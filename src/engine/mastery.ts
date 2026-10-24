import type {
  DomainIndex as Domain,
  ObjectiveIndex as Objective,
} from "../content/index-types";
import type { Schedule } from "./scheduler";
import { LEARNING } from "../learning-config";
export type Mastery = "Learning" | "Familiar" | "Mastered";
export function objectiveMastery(
  objective: Objective,
  schedules: Record<string, Schedule>,
): Mastery {
  const values = objective.activities.map((a) => schedules[a.id]);
  const seen = values.filter((s) => s?.seen > 0).length / values.length;
  const attempts = values.reduce((n, s) => n + (s?.seen ?? 0), 0);
  const accuracy = attempts
    ? values.reduce((n, s) => n + (s?.firstCorrect ?? 0), 0) / attempts
    : 0;
  for (const [label, t] of [
    ["Mastered", LEARNING.mastery.mastered],
    ["Familiar", LEARNING.mastery.familiar],
  ] as const) {
    const matureShare =
      values.filter(
        (s) => s && s.interval >= t.intervalDays && s.repetitions > 0,
      ).length / values.length;
    if (
      seen >= t.seen &&
      accuracy >= t.accuracy &&
      matureShare >= t.matureShare
    )
      return label;
  }
  return "Learning";
}
export function domainMastery(
  domain: Domain,
  schedules: Record<string, Schedule>,
) {
  const states = domain.objectives.map((o) => objectiveMastery(o, schedules));
  return {
    percent: Math.round(
      (states.reduce(
        (n, s) => n + (s === "Mastered" ? 1 : s === "Familiar" ? 0.5 : 0),
        0,
      ) /
        states.length) *
        100,
    ),
    familiar: states.filter((s) => s !== "Learning").length,
    mastered: states.filter((s) => s === "Mastered").length,
    total: states.length,
  };
}
