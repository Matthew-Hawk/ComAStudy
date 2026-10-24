import { z } from "zod";
import { create } from "zustand";
import { initialAttempt, type AttemptState } from "./engine/retry";
const attemptSchema = z.object({
  misses: z.number().int().nonnegative(),
  completed: z.boolean(),
  attempts: z.number().int().nonnegative(),
  firstAttemptCorrect: z.boolean().nullable(),
});
const progressSchema = z.object({
  version: z.literal(1),
  attempts: z.record(z.string(), attemptSchema),
  lessons: z.array(z.string()),
  resume: z.record(
    z.string(),
    z.object({ start: z.string(), cursor: z.number().int().nonnegative() }),
  ),
  theme: z.enum(["system", "light", "dark"]),
  motion: z.boolean(),
});
export type Progress = z.infer<typeof progressSchema>;
export interface ProgressStorage {
  read(): Progress;
  write(progress: Progress): boolean;
}
export const emptyProgress = (): Progress => ({
  version: 1,
  attempts: {},
  lessons: [],
  resume: {},
  theme: "system",
  motion: true,
});
export const localProgressStorage: ProgressStorage = {
  read() {
    try {
      const value = localStorage.getItem("studybench.progress.v1");
      return value ? progressSchema.parse(JSON.parse(value)) : emptyProgress();
    } catch {
      return emptyProgress();
    }
  },
  write(value) {
    try {
      localStorage.setItem("studybench.progress.v1", JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};
type Store = {
  progress: Progress;
  storageError: boolean;
  update: (fn: (p: Progress) => Progress) => void;
};
export const useStudy = create<Store>((set) => ({
  progress: localProgressStorage.read(),
  storageError: false,
  update: (fn) =>
    set((state) => {
      const progress = fn(state.progress);
      return { progress, storageError: !localProgressStorage.write(progress) };
    }),
}));
export const getAttempt = (p: Progress, id: string): AttemptState =>
  p.attempts[id] ?? initialAttempt();
