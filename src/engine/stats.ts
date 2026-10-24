import type { Progress } from "../persistence/model";
import type { DomainIndex } from "../content/index-types";
import { localDay, currentStreak } from "./rewards";
export function calendarDays(now: Date, offset: number, length: number) {
  return Array.from({ length }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset + i);
    return localDay(date);
  });
}
export function calculateStats(
  progress: Progress,
  domains: DomainIndex[],
  now: Date,
) {
  const valid = new Set(
    domains.flatMap((d) =>
      d.objectives.flatMap((o) => o.activities.map((a) => a.id)),
    ),
  );
  const schedules = Object.entries(progress.schedules)
    .filter(([id]) => valid.has(id))
    .map(([, s]) => s);
  const seen = schedules.reduce((n, s) => n + s.seen, 0);
  const first = schedules.reduce((n, s) => n + s.firstCorrect, 0);
  const weakest = domains
    .flatMap((d) =>
      d.objectives.map((o) => {
        const items = o.activities
          .map((a) => progress.schedules[a.id])
          .filter(Boolean);
        const attempts = items.reduce((n, s) => n + s.seen, 0);
        return {
          domainId: d.id,
          objectiveId: o.id,
          title: o.title,
          number: o.number,
          seen: attempts,
          accuracy: attempts
            ? items.reduce((n, s) => n + s.firstCorrect, 0) / attempts
            : 0,
          lapses: items.reduce((n, s) => n + s.lapses, 0),
        };
      }),
    )
    .filter((o) => o.seen > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.lapses - a.lapses)
    .slice(0, 5);
  const today = localDay(now);
  const activity = calendarDays(now, -29, 30).map((day) => ({
    day,
    value: progress.activityDays[day] ?? 0,
  }));
  const forecast = calendarDays(now, 0, 7).map((day) => ({
    day,
    value: schedules.filter(
      (s) =>
        s.seen > 0 &&
        (day === today
          ? localDay(new Date(s.dueAt)) <= today
          : localDay(new Date(s.dueAt)) === day),
    ).length,
  }));
  return {
    itemsSeen: schedules.filter((s) => s.seen > 0).length,
    accuracy: seen ? Math.round((first / seen) * 100) : 0,
    hasAccuracy: seen > 0,
    xp: progress.xp,
    currentStreak: currentStreak(progress.streak, today),
    bestStreak: progress.streak.best,
    weakest,
    activity,
    forecast,
  };
}
