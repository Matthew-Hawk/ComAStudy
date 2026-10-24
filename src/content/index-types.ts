import type { Domain, Activity, Objective } from "./schema";
export type ObjectiveIndex = Pick<
  Objective,
  "id" | "number" | "title" | "summary" | "visual"
> & { activities: Pick<Activity, "id" | "type">[] };
export type DomainIndex = Omit<Domain, "objectives"> & {
  objectives: ObjectiveIndex[];
};
