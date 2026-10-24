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
  ) => void;
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
      answer: (id, objectiveId, next, now, review = false) => {
        const p = get().progress;
        if (
          review &&
          (!p.review ||
            p.review.completed ||
            p.review.queue[p.review.cursor]?.itemId !== id)
        )
          return;
        const previous =
          (review ? p.review?.attempts[id] : p.attempts[id]) ??
          initialAttempt();
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
          attempts: review ? p.attempts : { ...p.attempts, [id]: next },
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
