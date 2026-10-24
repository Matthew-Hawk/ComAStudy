import { describe, it, expect } from "vitest";
import { domains } from "../content/load";
import { LEARNING } from "../learning-config";
import {
  completeReview,
  recordMiss,
  newSchedule,
  gradeFirstAttempt,
  DAY_MS,
  type Schedule,
} from "./scheduler";
import { objectiveMastery, domainMastery } from "./mastery";
import {
  currentStreak,
  emptyStreak,
  streakOnCompletion,
  localDay,
  weekKey,
  completionXP,
  earnedBadges,
} from "./rewards";
import {
  buildDailyReview,
  buildChapterSession,
  earlierDueItems,
} from "./session";
const now = Date.parse("2026-10-24T12:00:00Z");
describe("SM-2-style scheduling", () => {
  it("begins with a short step, then 1 day, 6 days, and ease-based intervals", () => {
    let s = newSchedule(now);
    const intervals: number[] = [];
    for (let n = 0; n < 4; n++) {
      s = completeReview(s, "good", now);
      intervals.push(s.interval);
    }
    expect(intervals).toEqual([LEARNING.stepDays, 1, 6, 15]);
    expect(s.repetitions).toBe(4);
    expect(s.dueAt).toBe(now + 15 * DAY_MS);
    expect(s.seen).toBe(4);
    expect(s.firstCorrect).toBe(4);
  });
  it("counts every miss, reduces ease to a minimum, and never erases lapses on recovery", () => {
    let s = completeReview(newSchedule(now), "good", now);
    for (let i = 0; i < 20; i++) s = recordMiss(s, now + i, i === 0);
    expect(s.ease).toBe(1.3);
    expect(s.lapses).toBe(20);
    expect(s.repetitions).toBe(0);
    const recovered = completeReview(s, "lapse", now + 100);
    expect(recovered.lapses).toBe(20);
    expect(recovered.repetitions).toBe(0);
    expect(recovered.interval).toBe(LEARNING.stepDays);
    expect(recovered.seen).toBe(2);
  });
  it("does not mutate its inputs and is deterministic for injected time", () => {
    const s = newSchedule(now);
    expect(completeReview(s, "good", now)).toEqual(
      completeReview(s, "good", now),
    );
    expect(s.seen).toBe(0);
  });
  it.each([
    [{ misses: 0, hinted: false, elapsedMs: 1000, mature: false }, "good"],
    [{ misses: 0, hinted: false, elapsedMs: 1000, mature: true }, "easy"],
    [{ misses: 0, hinted: false, elapsedMs: 20000, mature: true }, "good"],
    [{ misses: 0, hinted: true, elapsedMs: 1000, mature: true }, "hard"],
    [{ misses: 1, hinted: false, elapsedMs: 1000, mature: true }, "lapse"],
    [{ misses: 4, hinted: true, elapsedMs: 1000, mature: true }, "lapse"],
    [
      {
        misses: 0,
        hinted: false,
        elapsedMs: 1000,
        mature: true,
        flashcard: true,
      },
      "good",
    ],
    [{ misses: 0, hinted: false, elapsedMs: -1, mature: true }, "good"],
  ] as const)("grades only first-attempt evidence: %j -> %s", (input, grade) =>
    expect(gradeFirstAttempt(input)).toBe(grade),
  );
  it("hard grows more slowly and easy grows faster for mature items", () => {
    const s = { ...newSchedule(now), interval: 21, repetitions: 5 };
    expect(completeReview(s, "hard", now).ease).toBe(2.35);
    expect(completeReview(s, "hard", now).interval).toBeLessThan(
      completeReview(s, "good", now).interval,
    );
    expect(completeReview(s, "easy", now).interval).toBeGreaterThan(
      completeReview(s, "good", now).interval,
    );
  });
});
describe("derived mastery", () => {
  const objective = domains[0].objectives[0];
  function schedules(interval: number, firstCorrect = 10, seen = 10) {
    return Object.fromEntries(
      objective.activities.map((a) => [
        a.id,
        { ...newSchedule(now), interval, firstCorrect, seen, repetitions: 4 },
      ]),
    ) as Record<string, Schedule>;
  }
  it("requires exposure and independent accuracy as well as maturity", () => {
    expect(objectiveMastery(objective, {})).toBe("Learning");
    expect(objectiveMastery(objective, schedules(1))).toBe("Familiar");
    expect(objectiveMastery(objective, schedules(21))).toBe("Mastered");
    expect(objectiveMastery(objective, schedules(21, 2, 10))).toBe("Learning");
  });
  it("evaluates thresholds at their boundary", () => {
    expect(objectiveMastery(objective, schedules(0.999))).toBe("Learning");
    expect(objectiveMastery(objective, schedules(20.999))).toBe("Familiar");
    expect(objectiveMastery(objective, schedules(21, 17, 20))).toBe("Mastered");
    expect(objectiveMastery(objective, schedules(21, 16, 20))).toBe("Familiar");
  });
  it("downgrades immediately on a lapse and rings use the derived states", () => {
    const values = schedules(21);
    expect(domainMastery(domains[0], values).percent).toBe(50);
    const id = objective.activities[0].id;
    values[id] = recordMiss(values[id], now, true);
    expect(objectiveMastery(objective, values)).toBe("Familiar");
    expect(domainMastery(domains[0], values).percent).toBe(25);
  });
});
describe("local-day streaks and weekly freeze", () => {
  it("counts a local day only once and handles consecutive days", () => {
    let s = streakOnCompletion(emptyStreak(), "2026-10-20");
    s = streakOnCompletion(s, "2026-10-20");
    expect(s.current).toBe(1);
    expect(streakOnCompletion(s, "2026-10-21").current).toBe(2);
  });
  it("auto-applies a freeze for exactly one missed day", () => {
    let s = streakOnCompletion(emptyStreak(), "2026-10-19");
    s = streakOnCompletion(s, "2026-10-21");
    expect(s.current).toBe(2);
    expect(s.frozenDays).toEqual(["2026-10-20"]);
    expect(s.freezeWeeks).toEqual(["2026-10-19"]);
  });
  it("allows only one freeze within the missed day’s Monday-start week", () => {
    let s = streakOnCompletion(emptyStreak(), "2026-10-19");
    s = streakOnCompletion(s, "2026-10-21");
    s = streakOnCompletion(s, "2026-10-23");
    expect(s.current).toBe(1);
    expect(s.freezeWeeks).toHaveLength(1);
  });
  it("renews availability in the next week", () => {
    let s = streakOnCompletion(emptyStreak(), "2026-10-19");
    s = streakOnCompletion(s, "2026-10-21");
    for (const day of ["22", "23", "24", "25"])
      s = streakOnCompletion(s, `2026-10-${day}`);
    s = streakOnCompletion(s, "2026-10-27");
    expect(s.current).toBe(7);
    expect(s.freezeWeeks).toHaveLength(2);
  });
  it("starts a new streak after two missed days while preserving best", () => {
    let s = streakOnCompletion(emptyStreak(), "2026-10-19");
    s = streakOnCompletion(s, "2026-10-20");
    s = streakOnCompletion(s, "2026-10-23");
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
    expect(s.frozenDays).toEqual([]);
  });
  it("does not show a stale streak after an unprotected gap", () => {
    const s = streakOnCompletion(emptyStreak(), "2026-10-19");
    expect(currentStreak(s, "2026-10-20")).toBe(1);
    expect(currentStreak(s, "2026-10-21")).toBe(1);
    expect(currentStreak(s, "2026-10-22")).toBe(0);
  });
  it("uses timezone-specific midnight, not UTC midnight", () => {
    expect(localDay(new Date("2026-10-24T04:59:59Z"), "America/Chicago")).toBe(
      "2026-10-23",
    );
    expect(localDay(new Date("2026-10-24T05:00:00Z"), "America/Chicago")).toBe(
      "2026-10-24",
    );
    expect(localDay(new Date("2026-10-24T04:59:59Z"), "Asia/Tokyo")).toBe(
      "2026-10-24",
    );
  });
  it("handles DST and year boundaries as calendar days", () => {
    const a = localDay(new Date("2026-11-01T05:01:00Z"), "America/Chicago");
    const b = localDay(new Date("2026-11-02T06:01:00Z"), "America/Chicago");
    expect(
      streakOnCompletion(streakOnCompletion(emptyStreak(), a), b).current,
    ).toBe(2);
    expect(weekKey("2027-01-01")).toBe("2026-12-28");
    expect(
      streakOnCompletion(
        streakOnCompletion(emptyStreak(), "2026-12-31"),
        "2027-01-01",
      ).current,
    ).toBe(2);
  });
  it("does not count a day twice after a backward clock or timezone change", () => {
    const s = streakOnCompletion(emptyStreak(), "2026-10-24");
    expect(streakOnCompletion(s, "2026-10-23")).toBe(s);
  });
});
describe("quiet rewards", () => {
  it("awards full XP, reduced hint/retry XP, and always positive completion XP", () => {
    expect(completionXP(0, false)).toBe(10);
    expect(completionXP(0, true)).toBe(7);
    expect(completionXP(2, false)).toBeLessThan(10);
    expect(completionXP(100, true)).toBeGreaterThan(0);
  });
  it("defines and awards domain milestones and streak milestones", () => {
    const values: Record<string, Schedule> = {};
    for (const o of domains[0].objectives)
      for (const a of o.activities)
        values[a.id] = {
          ...newSchedule(now),
          seen: 10,
          firstCorrect: 10,
          interval: 21,
          repetitions: 4,
        };
    const badges = earnedBadges(domains, values, { ...emptyStreak(), best: 7 });
    expect(badges.filter((b) => b.id.startsWith(domains[0].id))).toHaveLength(
      3,
    );
    expect(badges.some((b) => b.id === "streak-7")).toBe(true);
    expect(badges.some((b) => b.id === "streak-30")).toBe(false);
  });
});
describe("due-first review sessions", () => {
  const all = domains.flatMap((d) => d.objectives.flatMap((o) => o.activities));
  it("filters future and unseen items, orders due then oldest lapses, and caps sessions", () => {
    const values: Record<string, Schedule> = {};
    all.forEach(
      (a, i) =>
        (values[a.id] = {
          ...newSchedule(now),
          seen: 1,
          dueAt: i < 20 ? now - 100 : now + 1,
          lastLapseAt: i < 20 ? now - i : null,
        }),
    );
    const session = buildDailyReview(domains, values, now);
    expect(session).toHaveLength(12);
    expect(session[0].itemId).toBe(all[19].id);
    expect(buildDailyReview(domains, values, now, 2)).toHaveLength(2);
    values[all[19].id].seen = 0;
    expect(buildDailyReview(domains, values, now)[0].itemId).toBe(all[18].id);
  });
  it("can include all six activity formats and never injects reviews into chapter flow", () => {
    const values = Object.fromEntries(
      all.map((a) => [a.id, { ...newSchedule(now), seen: 1 }]),
    );
    const session = buildDailyReview(domains, values, now, 100);
    expect(
      new Set(session.map((i) => all.find((a) => a.id === i.itemId)!.type))
        .size,
    ).toBe(6);
    const d = domains[1];
    const chapter = buildChapterSession(d, d.objectives[1].id);
    expect(chapter.every((i) => i.objectiveId === d.objectives[1].id)).toBe(
      true,
    );
    expect(
      earlierDueItems(d, d.objectives[1].id, values, now).every(
        (i) => i.objectiveId === d.objectives[0].id,
      ),
    ).toBe(true);
  });
  it("uses due time ahead of lapse age and returns no items when none are due", () => {
    const values = {
      [all[0].id]: {
        ...newSchedule(now),
        seen: 1,
        dueAt: now - 100,
        lastLapseAt: now,
      },
      [all[1].id]: {
        ...newSchedule(now),
        seen: 1,
        dueAt: now - 10,
        lastLapseAt: now - 10000,
      },
    };
    expect(buildDailyReview(domains, values, now)[0].itemId).toBe(all[0].id);
    expect(buildDailyReview(domains, values, now - 1000)).toEqual([]);
  });
});
