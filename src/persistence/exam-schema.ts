import { z } from "zod";
const count = z.number().int().nonnegative();
export const answerSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.record(z.string(), z.string()),
]);
export const questionSchema = z.object({
  domainId: z.string().min(1),
  objectiveId: z.string().min(1),
  itemId: z.string().min(1),
});
export const examSessionSchema = z
  .object({
    id: z.string().min(1),
    exam: z.enum(["220-1201", "220-1202"]),
    requested: z.number().int().positive().max(90),
    questions: z.array(questionSchema).min(1).max(90),
    answers: z.record(z.string(), answerSchema),
    flags: z.array(z.string()),
    cursor: count,
    startedAt: z.number().nonnegative(),
    timerOn: z.boolean(),
    timerHidden: z.boolean(),
    seed: count,
  })
  .refine(
    (s) =>
      s.cursor < s.questions.length &&
      new Set(s.questions.map((q) => q.itemId)).size === s.questions.length &&
      Object.keys(s.answers).every((id) =>
        s.questions.some((q) => q.itemId === id),
      ) &&
      s.flags.every((id) => s.questions.some((q) => q.itemId === id)),
    "Invalid saved exam",
  );
export const examHistoryBase = {
  id: z.string().min(1),
  date: z.number().nonnegative(),
  exam: z.enum(["220-1201", "220-1202"]),
  requested: count,
  length: z.number().int().positive().max(90),
  correct: count,
  score: z.number().min(0).max(100),
  domainScores: z.array(
    z.object({ domainId: z.string(), correct: count, total: count }),
  ),
  missedIds: z.array(z.string()),
  questions: z.array(questionSchema),
  answers: z.record(z.string(), answerSchema),
  timerOn: z.boolean(),
  elapsedMs: z.number().nonnegative(),
};
