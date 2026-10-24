import type { Domain } from "../content/schema";
import type { Schedule } from "./scheduler";
import { LEARNING } from "../learning-config";
export type SessionItem = {
  objectiveId: string;
  kind: "lesson" | "activity";
  itemId: string;
};
export function buildChapterSession(
  domain: Domain,
  startId: string,
): SessionItem[] {
  const index = domain.objectives.findIndex((o) => o.id === startId);
  if (index < 0) throw new Error("Unknown starting section");
  return domain.objectives.slice(index).flatMap((o) => [
    { objectiveId: o.id, kind: "lesson" as const, itemId: "lesson" },
    ...o.activities.map((a) => ({
      objectiveId: o.id,
      kind: "activity" as const,
      itemId: a.id,
    })),
  ]);
}
export function buildDailyReview(
  domains: Domain[],
  schedules: Record<string, Schedule>,
  now: number,
  cap: number = LEARNING.reviewLimit,
  allowedIds?: string[],
): SessionItem[] {
  return domains
    .flatMap((d) =>
      d.objectives.flatMap((o) =>
        o.activities.map((a) => ({
          objectiveId: o.id,
          kind: "activity" as const,
          itemId: a.id,
        })),
      ),
    )
    .filter(
      (i) =>
        schedules[i.itemId]?.seen > 0 &&
        schedules[i.itemId].dueAt <= now &&
        (!allowedIds || allowedIds.includes(i.itemId)),
    )
    .sort(
      (a, b) =>
        schedules[a.itemId].dueAt - schedules[b.itemId].dueAt ||
        (schedules[a.itemId].lastLapseAt ?? Infinity) -
          (schedules[b.itemId].lastLapseAt ?? Infinity) ||
        a.itemId.localeCompare(b.itemId),
    )
    .slice(0, Math.max(0, cap));
}
export function earlierDueItems(
  domain: Domain,
  startId: string,
  schedules: Record<string, Schedule>,
  now: number,
) {
  const earlier = domain.objectives.slice(
    0,
    domain.objectives.findIndex((o) => o.id === startId),
  );
  return buildDailyReview([{ ...domain, objectives: earlier }], schedules, now);
}
