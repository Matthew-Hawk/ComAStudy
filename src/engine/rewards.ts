import type { DomainIndex as Domain } from "../content/index-types";
import type { Schedule } from "./scheduler";
import { domainMastery } from "./mastery";
import definitions from "../data/badges.json";
export type Streak = {
  lastDay: string | null;
  current: number;
  best: number;
  freezeWeeks: string[];
  frozenDays: string[];
};
export const emptyStreak = (): Streak => ({
  lastDay: null,
  current: 0,
  best: 0,
  freezeWeeks: [],
  frozenDays: [],
});
export function localDay(date: Date, timeZone?: string): string {
  if (!timeZone)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86400000;
export function weekKey(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
export function streakOnCompletion(previous: Streak, today: string): Streak {
  if (previous.lastDay && dayNumber(today) <= dayNumber(previous.lastDay))
    return previous;
  const gap = previous.lastDay
    ? dayNumber(today) - dayNumber(previous.lastDay)
    : Infinity;
  const missed = new Date((dayNumber(today) - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
  const freeze = gap === 2 && !previous.freezeWeeks.includes(weekKey(missed));
  const current = gap === 1 || freeze ? previous.current + 1 : 1;
  return {
    lastDay: today,
    current,
    best: Math.max(previous.best, current),
    freezeWeeks: freeze
      ? [...previous.freezeWeeks, weekKey(missed)]
      : previous.freezeWeeks,
    frozenDays: freeze ? [...previous.frozenDays, missed] : previous.frozenDays,
  };
}
export function currentStreak(streak: Streak, today: string) {
  if (!streak.lastDay) return 0;
  const gap = dayNumber(today) - dayNumber(streak.lastDay);
  const missed = new Date((dayNumber(today) - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
  return gap <= 1 ||
    (gap === 2 && !streak.freezeWeeks.includes(weekKey(missed)))
    ? streak.current
    : 0;
}
export function completionXP(misses: number, hinted: boolean) {
  return misses ? Math.max(3, 10 - 2 * misses) : hinted ? 7 : 10;
}
export type Badge = { id: string; title: string; description: string };
export function earnedBadges(
  domains: Domain[],
  schedules: Record<string, Schedule>,
  streak: Streak,
): Badge[] {
  const badges: Badge[] = [];
  for (const d of domains) {
    const state = domainMastery(d, schedules);
    const conditions = [
      state.familiar >= 1,
      state.familiar === state.total,
      state.mastered === state.total,
    ];
    definitions.domain.forEach((b, i) => {
      if (conditions[i])
        badges.push({
          ...b,
          id: `${d.id}:${b.id}`,
          title: `${d.title}: ${b.title}`,
        });
    });
  }
  definitions.streak.forEach((b) => {
    if (streak.best >= b.days) badges.push(b);
  });
  return badges;
}
