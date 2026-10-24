import { create } from "zustand";
import { initialAttempt, type AttemptState } from "./engine/retry";
import {
  browserProgressStorage,
  type ProgressStorage,
} from "./persistence/repository";
import { emptyProgress, type Progress } from "./persistence/model";
import { domains } from "./content/load";
import {
  completeReview,
  gradeFirstAttempt,
  newSchedule,
  recordMiss,
} from "./engine/scheduler";
import {
  completionXP,
  earnedBadges,
  localDay,
  streakOnCompletion,
  type Badge,
} from "./engine/rewards";
import { LEARNING } from "./learning-config";
import { scoreExam, type ExamSession, type ExamResult } from "./engine/exam";
import type { Domain } from "./content/schema";
import { isCorrect } from "./engine/retry";
import { completionSound } from "./sound";
export { emptyProgress } from "./persistence/model";
export type { Progress } from "./persistence/model";
export type { ProgressStorage } from "./persistence/repository";
type Store = {
  progress: Progress;
  ready: boolean;
  storageError: boolean;
  xpTick: number;
  notifications: Badge[];
  initialize: () => Promise<void>;
  update: (fn: (p: Progress) => Progress) => void;
  replace: (p: Progress) => Promise<boolean>;
  answer: (
    id: string,
    objectiveId: string,
    next: AttemptState,
    now: number,
    review?: boolean,
    resultId?: string,
  ) => void;
  submitExam: (bank: Domain[], now: number) => ExamResult | null;
  reset: () => Promise<boolean>;
  dismissBadge: (id: string) => void;
};
export function createStudyStore(repository: ProgressStorage) {
  let initialization: Promise<void> | null = null;
  return create<Store>((set, get) => {
    function persist(progress: Progress) {
      void repository
        .save(progress)
        .then((ok) => set({ storageError: !ok }))
        .catch(() => set({ storageError: true }));
    }
    return {
      progress: emptyProgress(),
      ready: false,
      storageError: false,
      xpTick: 0,
      notifications: [],
      initialize: () =>
        (initialization ??= (async () => {
          try {
            const progress = await repository.read();
            set({ progress, ready: true });
          } catch {
            set({ ready: true, storageError: true });
          }
        })()),
      update: (fn) => {
        const progress = {
          ...fn(get().progress),
          revision: get().progress.revision + 1,
        };
        set({ progress });
        persist(progress);
      },
      replace: async (value) => {
        const progress = { ...value, revision: get().progress.revision + 1 };
        const ok = await repository.save(progress);
        if (ok)
          set({ progress, storageError: false, notifications: [], xpTick: 0 });
        else set({ storageError: true });
        return ok;
      },
      reset: async () => get().replace(emptyProgress()),
      submitExam: (bank, now) => {
        const p = get().progress;
        const exam = p.examSession;
        if (!exam || p.examHistory.some((e) => e.id === exam.id)) return null;
        const result = scoreExam(exam, bank, now);
        const schedules = { ...p.schedules };
        const objectives = { ...p.objectives };
        let xp = 0;
        for (const q of exam.questions) {
          const right = !result.missedIds.includes(q.itemId);
          const schedule = schedules[q.itemId] ?? newSchedule(now);
          schedules[q.itemId] = right
            ? completeReview(schedule, "good", now)
            : recordMiss(schedule, now, true);
          if (right) {
            xp += completionXP(0, false);
            const previous = objectives[q.objectiveId] ?? {
              lessonRead: p.lessons.includes(q.objectiveId),
              completedItems: [],
              updatedAt: now,
            };
            objectives[q.objectiveId] = {
              ...previous,
              completedItems: [
                ...new Set([...previous.completedItems, q.itemId]),
              ],
              updatedAt: now,
            };
          }
        }
        if (result.correct && p.sound) completionSound();
        const streak = result.correct
          ? streakOnCompletion(p.streak, localDay(new Date(now)))
          : p.streak;
        const unlocked = earnedBadges(domains, schedules, streak).filter(
          (b) => !p.badges.some((old) => old.id === b.id),
        );
        const day = localDay(new Date(now));
        const progress: Progress = {
          ...p,
          schedules,
          objectives,
          xp: p.xp + xp,
          streak,
          badges: [
            ...p.badges,
            ...unlocked.map((b) => ({ ...b, unlockedAt: now })),
          ],
          activityDays: {
            ...p.activityDays,
            [day]: (p.activityDays[day] ?? 0) + result.correct,
          },
          examSession: null,
          examHistory: [result, ...p.examHistory],
          revision: p.revision + 1,
        };
        set({
          progress,
          xpTick: xp,
          notifications: [...get().notifications, ...unlocked],
        });
        persist(progress);
        return result;
      },
      answer: (id, objectiveId, next, now, review = false, resultId) => {
        const p = get().progress;
        const result = resultId
          ? p.examHistory.find((e) => e.id === resultId)
          : undefined;
        if (resultId && (!result || !result.missedIds.includes(id))) return;
        if (
          review &&
          (!p.review ||
            p.review.completed ||
            p.review.queue[p.review.cursor]?.itemId !== id)
        )
          return;
        const previous =
          (result
            ? result.reviewAttempts[id]
            : review
              ? p.review?.attempts[id]
              : p.attempts[id]) ?? initialAttempt();
        if (previous.completed || next.attempts !== previous.attempts + 1)
          return;
        let schedule = p.schedules[id] ?? newSchedule(now);
        const wrong = next.misses > previous.misses;
        if (wrong)
          schedule = recordMiss(schedule, now, previous.attempts === 0);
        let xp = 0;
        let streak = p.streak;
        if (next.completed) {
          const grade = gradeFirstAttempt({
            misses: next.misses,
            hinted: !!next.usedHint,
            elapsedMs: now - (next.startedAt ?? now),
            mature: schedule.interval >= LEARNING.matureDays,
            flashcard:
              domains
                .flatMap((d) => d.objectives.flatMap((o) => o.activities))
                .find((a) => a.id === id)?.type === "flashcard",
          });
          schedule = completeReview(schedule, grade, now);
          xp = completionXP(next.misses, !!next.usedHint);
          if (p.sound) completionSound();
          streak = streakOnCompletion(p.streak, localDay(new Date(now)));
        }
        const schedules = { ...p.schedules, [id]: schedule };
        const unlocked = earnedBadges(domains, schedules, streak).filter(
          (b) => !p.badges.some((old) => old.id === b.id),
        );
        const objective = p.objectives[objectiveId] ?? {
          lessonRead: p.lessons.includes(objectiveId),
          completedItems: [],
          updatedAt: now,
        };
        const progress: Progress = {
          ...p,
          revision: p.revision + 1,
          schedules,
          xp: p.xp + xp,
          streak,
          badges: [
            ...p.badges,
            ...unlocked.map((b) => ({ ...b, unlockedAt: now })),
          ],
          objectives: {
            ...p.objectives,
            [objectiveId]: {
              ...objective,
              completedItems: next.completed
                ? [...new Set([...objective.completedItems, id])]
                : objective.completedItems,
              updatedAt: now,
            },
          },
          attempts:
            review || result ? p.attempts : { ...p.attempts, [id]: next },
          examHistory: result
            ? p.examHistory.map((e) =>
                e.id === resultId
                  ? {
                      ...e,
                      reviewAttempts: { ...e.reviewAttempts, [id]: next },
                    }
                  : e,
              )
            : p.examHistory,
          activityDays: next.completed
            ? {
                ...p.activityDays,
                [localDay(new Date(now))]:
                  (p.activityDays[localDay(new Date(now))] ?? 0) + 1,
              }
            : p.activityDays,
          review:
            review && p.review
              ? { ...p.review, attempts: { ...p.review.attempts, [id]: next } }
              : p.review,
        };
        set({
          progress,
          xpTick: xp,
          notifications: [...get().notifications, ...unlocked],
        });
        persist(progress);
      },
      dismissBadge: (id) =>
        set({ notifications: get().notifications.filter((b) => b.id !== id) }),
    };
  });
}
export const progressStorage = browserProgressStorage();
export const useStudy = createStudyStore(progressStorage);
export const getAttempt = (p: Progress, id: string): AttemptState =>
  p.attempts[id] ?? initialAttempt();
