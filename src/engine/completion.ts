import type {
  DomainIndex as Domain,
  ObjectiveIndex as Objective,
} from "../content/index-types";
import type { Progress } from "../persistence/model";
type CompletionSource = Pick<Progress, "attempts" | "objectives">;
export function objectiveCompletion(
  objective: Objective,
  progress: CompletionSource,
) {
  const completed = objective.activities.filter(
    (a) =>
      progress.attempts[a.id]?.completed ||
      progress.objectives[objective.id]?.completedItems.includes(a.id),
  ).length;
  const total = objective.activities.length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
    finished: total > 0 && completed === total,
  };
}
export function domainCompletion(domain: Domain, progress: CompletionSource) {
  const sections = domain.objectives.map((o) =>
    objectiveCompletion(o, progress),
  );
  // Each available section has equal weight; partial activity completion counts immediately.
  const percent = sections.length
    ? Math.round(
        (sections.reduce(
          (n, s) => n + (s.total ? s.completed / s.total : 0),
          0,
        ) /
          sections.length) *
          100,
      )
    : 0;
  return {
    percent,
    completedSections: sections.filter((s) => s.finished).length,
    totalSections: sections.length,
  };
}
