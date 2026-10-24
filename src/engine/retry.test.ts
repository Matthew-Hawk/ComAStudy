import { describe, expect, it } from "vitest";
import {
  attempt,
  assistance,
  initialAttempt,
  isCorrect,
  shuffled,
  variantPrompt,
} from "./retry";
import { buildChapterSession } from "./session";
import { domains } from "../content/load";
describe("supportive retry loop", () => {
  it("never permits a miss to complete an item, even after many attempts", () => {
    let s = initialAttempt();
    for (let n = 0; n < 30; n++) {
      s = attempt(s, false);
      expect(s.completed).toBe(false);
    }
    expect(assistance(s.misses).walkthrough).toBe(true);
    s = attempt(s, true);
    expect(s.completed).toBe(true);
    expect(s.firstAttemptCorrect).toBe(false);
    expect(s.misses).toBe(30);
  });
  it("retains the first attempt signal and every lapse after eventual success", () => {
    const s = attempt(attempt(attempt(initialAttempt(), false), false), true);
    expect(s).toEqual({
      completed: true,
      misses: 2,
      attempts: 3,
      firstAttemptCorrect: false,
    });
    expect(attempt(s, true)).toEqual(s);
  });
  it("records a first-attempt success", () =>
    expect(attempt(initialAttempt(), true).firstAttemptCorrect).toBe(true));
  it("escalates help at the requested thresholds", () => {
    expect(assistance(0)).toEqual({
      explanation: false,
      hint: false,
      highlight: false,
      walkthrough: false,
    });
    expect(assistance(1)).toEqual({
      explanation: true,
      hint: false,
      highlight: false,
      walkthrough: false,
    });
    expect(assistance(2)).toEqual({
      explanation: true,
      hint: true,
      highlight: true,
      walkthrough: false,
    });
    expect(assistance(3).walkthrough).toBe(true);
  });
  it("changes option and target arrangement on consecutive retries", () => {
    expect(shuffled(["a", "b", "c"], 0)).not.toEqual(
      shuffled(["a", "b", "c"], 1),
    );
    expect(shuffled(["a", "b", "c"], 1)).not.toEqual(
      shuffled(["a", "b", "c"], 2),
    );
  });
  it("uses alternate blank prompts and case-insensitive trimmed answers", () => {
    const item = domains[0].objectives[0].activities.find(
      (a) => a.type === "fill_in_blank",
    )!;
    if (item.type !== "fill_in_blank") throw Error();
    expect(variantPrompt(item, 0)).not.toBe(variantPrompt(item, 1));
    expect(isCorrect(item, ` ${item.accepted[0].toLowerCase()} `)).toBe(true);
    expect(isCorrect(item, "unrelated")).toBe(false);
  });
  it("repeats unknown flashcards until explicitly known", () => {
    const item = domains[0].objectives[0].activities.find(
      (a) => a.type === "flashcard",
    )!;
    expect(isCorrect(item, "unknown")).toBe(false);
    expect(isCorrect(item, "known")).toBe(true);
  });
  it("builds a linear session starting at the selected section without locking earlier sections", () => {
    const d = domains[0];
    const full = buildChapterSession(d, d.objectives[0].id);
    const later = buildChapterSession(d, d.objectives[1].id);
    expect(later.every((i) => i.objectiveId === d.objectives[1].id)).toBe(true);
    expect(full.slice(-later.length)).toEqual(later);
    expect(full[0].kind).toBe("lesson");
    expect(() => buildChapterSession(d, "missing")).toThrow();
  });
  it("checks complete exact matches, categories and order", () => {
    const items = domains.flatMap((d) =>
      d.objectives.flatMap((o) => o.activities),
    );
    for (const item of items) {
      if (item.type === "drag_match") {
        expect(
          isCorrect(
            item,
            Object.fromEntries(item.pairs.map((p) => [p.id, p.id])),
          ),
        ).toBe(true);
        expect(isCorrect(item, {})).toBe(false);
        expect(
          isCorrect(
            item,
            Object.fromEntries(
              item.pairs.map((p, i) => [
                p.id,
                item.pairs[(i + 1) % item.pairs.length].id,
              ]),
            ),
          ),
        ).toBe(false);
      }
      if (item.type === "drag_sort") {
        expect(
          isCorrect(
            item,
            Object.fromEntries(item.items.map((i) => [i.id, i.category])),
          ),
        ).toBe(true);
        expect(isCorrect(item, {})).toBe(false);
      }
      if (item.type === "drag_order") {
        expect(
          isCorrect(
            item,
            item.steps.map((s) => s.id),
          ),
        ).toBe(true);
        expect(isCorrect(item, item.steps.map((s) => s.id).reverse())).toBe(
          false,
        );
      }
    }
  });
});
