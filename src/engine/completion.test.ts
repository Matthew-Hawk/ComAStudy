import { describe, it, expect } from "vitest";
import { domains } from "../test/content";
import { emptyProgress } from "../persistence/model";
import { objectiveCompletion, domainCompletion } from "./completion";
import { attempt, initialAttempt } from "./retry";
describe("completion independent of spaced-review mastery", () => {
  const domain = domains[0];
  const objective = domain.objectives[0];
  it("moves immediately after an item and after a section, reaching 100 after a chapter", () => {
    const p = emptyProgress();
    expect(domainCompletion(domain, p).percent).toBe(0);
    p.attempts[objective.activities[0].id] = attempt(initialAttempt(), true);
    expect(objectiveCompletion(objective, p).percent).toBe(33);
    expect(domainCompletion(domain, p).percent).toBe(17);
    for (const a of objective.activities)
      p.attempts[a.id] = attempt(initialAttempt(), true);
    expect(domainCompletion(domain, p)).toMatchObject({
      percent: 50,
      completedSections: 1,
      totalSections: 2,
    });
    for (const o of domain.objectives)
      for (const a of o.activities)
        p.attempts[a.id] = attempt(initialAttempt(), true);
    expect(domainCompletion(domain, p).percent).toBe(100);
  });
  it("counts review completion and legacy chapter attempts without double-counting", () => {
    const p = emptyProgress();
    const ids = objective.activities.map((a) => a.id);
    p.objectives[objective.id] = {
      lessonRead: true,
      completedItems: [...ids, ids[0], "unrelated"],
      updatedAt: 1,
    };
    p.attempts[ids[0]] = attempt(initialAttempt(), true);
    expect(objectiveCompletion(objective, p).completed).toBe(ids.length);
    expect(domainCompletion(domain, p).percent).toBe(50);
  });
  it("weights sections equally when their activity counts differ", () => {
    const d = domains.find((d) => d.id === "networking")!;
    const p = emptyProgress();
    for (const a of d.objectives[0].activities)
      p.attempts[a.id] = attempt(initialAttempt(), true);
    expect(domainCompletion(d, p).percent).toBe(50);
  });
  it("does not mark wrong or merely seen items complete", () => {
    const p = emptyProgress();
    p.attempts[objective.activities[0].id] = attempt(initialAttempt(), false);
    expect(domainCompletion(domain, p).percent).toBe(0);
  });
});
