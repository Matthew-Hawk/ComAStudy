import { LEARNING } from "../learning-config";
export const DAY_MS = 86400000;
export type Grade = "lapse" | "hard" | "good" | "easy";
export type Schedule = {
  dueAt: number;
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  seen: number;
  firstCorrect: number;
  lastReviewedAt: number | null;
  lastLapseAt: number | null;
};
export function newSchedule(now: number): Schedule {
  return {
    dueAt: now,
    ease: LEARNING.initialEase,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    seen: 0,
    firstCorrect: 0,
    lastReviewedAt: null,
    lastLapseAt: null,
  };
}
export function gradeFirstAttempt(input: {
  misses: number;
  hinted: boolean;
  elapsedMs: number;
  mature: boolean;
  flashcard?: boolean;
}): Grade {
  if (input.misses) return "lapse";
  if (input.hinted) return "hard";
  if (
    !input.flashcard &&
    input.mature &&
    input.elapsedMs >= 0 &&
    input.elapsedMs <= LEARNING.quickMs
  )
    return "easy";
  return "good";
}
// Call on every wrong submission, not just at eventual completion. A retry never erases a lapse.
export function recordMiss(
  previous: Schedule,
  now: number,
  firstResponse: boolean,
): Schedule {
  return {
    ...previous,
    dueAt: now + LEARNING.stepDays * DAY_MS,
    ease: Math.max(LEARNING.minEase, previous.ease - 0.2),
    interval: LEARNING.stepDays,
    repetitions: 0,
    lapses: previous.lapses + 1,
    seen: previous.seen + Number(firstResponse),
    lastReviewedAt: now,
    lastLapseAt: now,
  };
}
// A lapse grade follows already-recorded misses; it must not count the same miss twice.
export function completeReview(
  previous: Schedule,
  grade: Grade,
  now: number,
): Schedule {
  if (grade === "lapse")
    return {
      ...previous,
      dueAt: now + LEARNING.stepDays * DAY_MS,
      interval: LEARNING.stepDays,
      repetitions: 0,
      lastReviewedAt: now,
    };
  const ease = Math.max(
    LEARNING.minEase,
    previous.ease + (grade === "easy" ? 0.15 : grade === "hard" ? -0.15 : 0),
  );
  const interval =
    grade === "hard"
      ? Math.max(LEARNING.stepDays, previous.interval * 1.2)
      : previous.repetitions === 0
        ? LEARNING.stepDays
        : previous.repetitions === 1
          ? 1
          : previous.repetitions === 2
            ? 6
            : Math.max(
                1,
                previous.interval * ease * (grade === "easy" ? 1.3 : 1),
              );
  return {
    ...previous,
    ease,
    interval,
    repetitions: previous.repetitions + 1,
    dueAt: now + interval * DAY_MS,
    seen: previous.seen + 1,
    firstCorrect: previous.firstCorrect + Number(grade !== "hard"),
    lastReviewedAt: now,
  };
}
