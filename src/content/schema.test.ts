import { describe, it, expect } from "vitest";
import { activitySchema, objectiveSchema, validateDomains } from "./schema";
import { domains } from "./load";
describe("content authoring validation", () => {
  it("validates every seeded domain and all six formats", () => {
    expect(validateDomains(domains)).toHaveLength(9);
    expect(
      new Set(
        domains.flatMap((d) =>
          d.objectives.flatMap((o) => o.activities.map((a) => a.type)),
        ),
      ).size,
    ).toBe(6);
  });
  it("rejects a missing visual and dangling lesson anchor", () => {
    const o = domains[0].objectives[0];
    expect(objectiveSchema.safeParse({ ...o, visual: "typo" }).success).toBe(
      false,
    );
    expect(
      objectiveSchema.safeParse({
        ...o,
        activities: [{ ...o.activities[0], lessonAnchor: "absent" }],
      }).success,
    ).toBe(false);
  });
  it("rejects answer keys that do not exist and duplicate options", () => {
    const i = domains[0].objectives[0].activities[0];
    if (i.type !== "multiple_choice") throw Error();
    expect(activitySchema.safeParse({ ...i, correct: "missing" }).success).toBe(
      false,
    );
    expect(
      activitySchema.safeParse({ ...i, options: [i.options[0], i.options[0]] })
        .success,
    ).toBe(false);
  });
  it("rejects invalid blank regexes and missing markers", () => {
    const item = domains[0].objectives[0].activities.find(
      (a) => a.type === "fill_in_blank",
    )!;
    expect(activitySchema.safeParse({ ...item, regex: "[" }).success).toBe(
      false,
    );
    expect(
      activitySchema.safeParse({ ...item, prompt: "no blank" }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({ ...item, variants: ["no marker here"] })
        .success,
    ).toBe(false);
  });
  it("rejects duplicate item IDs across objectives", () => {
    const data = structuredClone(domains);
    data[0].objectives[1].activities[0].id =
      data[0].objectives[0].activities[0].id;
    expect(() => validateDomains(data)).toThrow("Duplicate");
  });
  it("rejects references to missing sort categories", () => {
    const item = domains
      .flatMap((d) => d.objectives.flatMap((o) => o.activities))
      .find((a) => a.type === "drag_sort")!;
    if (item.type !== "drag_sort") throw Error();
    expect(
      activitySchema.safeParse({
        ...item,
        items: [{ ...item.items[0], category: "missing" }, item.items[1]],
      }).success,
    ).toBe(false);
  });
});
