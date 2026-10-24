import type { Activity } from "../content/schema";
export type AttemptState = {
  misses: number;
  completed: boolean;
  attempts: number;
  firstAttemptCorrect: boolean | null;
};
export const initialAttempt = (): AttemptState => ({
  misses: 0,
  completed: false,
  attempts: 0,
  firstAttemptCorrect: null,
});
export function attempt(state: AttemptState, correct: boolean): AttemptState {
  if (state.completed) return state;
  return {
    misses: state.misses + Number(!correct),
    completed: correct,
    attempts: state.attempts + 1,
    firstAttemptCorrect: state.firstAttemptCorrect ?? correct,
  };
}
export function assistance(misses: number) {
  return {
    explanation: misses >= 1,
    hint: misses >= 2,
    highlight: misses >= 2,
    walkthrough: misses >= 3,
  };
}
export function variantPrompt(
  item: Extract<Activity, { type: "fill_in_blank" }>,
  misses: number,
) {
  const prompts = [item.prompt, ...(item.variants ?? [])];
  return prompts[misses % prompts.length];
}
export function shuffled<T>(values: T[], seed: number): T[] {
  // Stable per attempt, different on the next attempt. A rotation guarantees a changed arrangement.
  if (values.length < 2) return [...values];
  const offset = ((seed % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}
export function itemSeed(id: string): number {
  return [...id].reduce(
    (hash, letter) => (hash * 31 + letter.charCodeAt(0)) >>> 0,
    7,
  );
}
export type Answer = string | string[] | Record<string, string>;
export function isCorrect(item: Activity, answer: Answer): boolean {
  if (item.type === "flashcard") return answer === "known";
  if (item.type === "multiple_choice") return answer === item.correct;
  if (item.type === "fill_in_blank")
    return (
      typeof answer === "string" &&
      (item.accepted.some(
        (a) => a.trim().toLowerCase() === answer.trim().toLowerCase(),
      ) ||
        Boolean(
          item.regex &&
          new RegExp(`^(?:${item.regex})$`, "i").test(answer.trim()),
        ))
    );
  if (item.type === "drag_order")
    return (
      Array.isArray(answer) &&
      answer.length === item.steps.length &&
      item.steps.every((s, i) => answer[i] === s.id)
    );
  if (typeof answer !== "object" || Array.isArray(answer)) return false;
  if (item.type === "drag_match")
    return item.pairs.every((p) => answer[p.id] === p.id);
  return item.items.every((i) => answer[i.id] === i.category);
}
