import type { Domain } from "../content/schema";
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
  return domain.objectives
    .slice(index)
    .flatMap((o) => [
      { objectiveId: o.id, kind: "lesson" as const, itemId: "lesson" },
      ...o.activities.map((a) => ({
        objectiveId: o.id,
        kind: "activity" as const,
        itemId: a.id,
      })),
    ]);
}
