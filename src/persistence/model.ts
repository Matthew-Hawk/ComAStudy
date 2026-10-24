import { z } from "zod";
import { emptyStreak } from "../engine/rewards";
import { newSchedule } from "../engine/scheduler";
import { domains } from "../content/load";
import packageInfo from "../../package.json";
import { examSessionSchema, examHistoryBase } from "./exam-schema";
export const SCHEMA_VERSION = 3;
export const APP_VERSION = packageInfo.version;
const count = z.number().int().nonnegative();
const timestamp = z.number().finite().nonnegative();
export const attemptSchema = z
  .object({
    misses: count,
    completed: z.boolean(),
    attempts: count,
    firstAttemptCorrect: z.boolean().nullable(),
    usedHint: z.boolean().optional(),
    startedAt: timestamp.optional(),
  })
  .refine(
    (a) =>
      a.misses <= a.attempts &&
      (a.attempts === 0
        ? a.firstAttemptCorrect === null && !a.completed
        : a.firstAttemptCorrect !== null) &&
      a.attempts === a.misses + Number(a.completed) &&
      (a.firstAttemptCorrect !== true || a.misses === 0),
    "Inconsistent attempt record",
  );
export const scheduleSchema = z
  .object({
    dueAt: timestamp,
    ease: z.number().finite().min(1.3),
    interval: z.number().finite().nonnegative(),
    repetitions: count,
    lapses: count,
    seen: count,
    firstCorrect: count,
    lastReviewedAt: timestamp.nullable(),
    lastLapseAt: timestamp.nullable(),
  })
  .refine(
    (s) => s.firstCorrect <= s.seen,
    "First correct count cannot exceed review count",
  );
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s + "T00:00:00Z")) &&
      new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s,
    "Invalid calendar day",
  );
const streakSchema = z
  .object({
    lastDay: day.nullable(),
    current: count,
    best: count,
    freezeWeeks: z.array(day),
    frozenDays: z.array(day),
  })
  .refine(
    (s) => s.best >= s.current && (s.lastDay !== null || s.current === 0),
    "Invalid streak",
  );
const resumeSchema = z.object({
  start: z.string(),
  cursor: count,
  updatedAt: timestamp.optional(),
});
const objectiveProgressSchema = z.object({
  lessonRead: z.boolean(),
  completedItems: z.array(z.string()),
  updatedAt: timestamp,
});
const sessionItemSchema = z.object({
  objectiveId: z.string(),
  kind: z.enum(["lesson", "activity"]),
  itemId: z.string(),
});
const reviewSchema = z
  .object({
    id: z.string(),
    queue: z.array(sessionItemSchema).max(100),
    cursor: count,
    attempts: z.record(z.string(), attemptSchema),
    completed: z.boolean(),
    source: z.enum(["daily", "chapter"]),
    scopeKey: z.string().optional(),
  })
  .refine(
    (s) =>
      s.cursor <= s.queue.length &&
      (s.completed
        ? s.cursor === s.queue.length
        : s.queue.length > 0 && s.cursor < s.queue.length) &&
      s.queue.every((i) => i.kind === "activity") &&
      new Set(s.queue.map((i) => i.itemId)).size === s.queue.length,
    "Invalid review position",
  );
export const progressSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  revision: count,
  attempts: z.record(z.string(), attemptSchema),
  lessons: z.array(z.string()),
  resume: z.record(z.string(), resumeSchema),
  theme: z.enum(["system", "light", "dark"]),
  motion: z.boolean(),
  schedules: z.record(z.string(), scheduleSchema),
  objectives: z.record(z.string(), objectiveProgressSchema),
  xp: count,
  streak: streakSchema,
  badges: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      unlockedAt: timestamp,
    }),
  ),
  review: reviewSchema.nullable(),
  lastChapter: z.string().nullable(),
  sound: z.boolean(),
  animationMode: z.enum(["on", "reduced", "off"]),
  reviewLength: z.union([
    z.literal(8),
    z.literal(12),
    z.literal(16),
    z.literal(20),
  ]),
  examTimerDefault: z.boolean(),
  activityDays: z.record(day, count),
  examSession: examSessionSchema.nullable(),
  examHistory: z.array(
    z
      .object({
        ...examHistoryBase,
        reviewAttempts: z.record(z.string(), attemptSchema),
      })
      .refine(
        (s) =>
          s.questions.length === s.length &&
          s.correct <= s.length &&
          s.score === Math.round((s.correct / s.length) * 100) &&
          s.domainScores.reduce((n, d) => n + d.total, 0) === s.length &&
          s.domainScores.reduce((n, d) => n + d.correct, 0) === s.correct &&
          s.domainScores.every((d) => d.correct <= d.total) &&
          s.missedIds.length === s.length - s.correct &&
          new Set(s.questions.map((q) => q.itemId)).size === s.length &&
          new Set(s.missedIds).size === s.missedIds.length &&
          s.missedIds.every((id) => s.questions.some((q) => q.itemId === id)),
        "Inconsistent exam result",
      ),
  ),
});
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({
  schemaVersion: SCHEMA_VERSION,
  revision: 0,
  attempts: {},
  lessons: [],
  resume: {},
  theme: "system",
  motion: true,
  schedules: {},
  objectives: {},
  xp: 0,
  streak: emptyStreak(),
  badges: [],
  review: null,
  lastChapter: null,
  sound: false,
  animationMode: "on",
  reviewLength: 12,
  examTimerDefault: false,
  activityDays: {},
  examSession: null,
  examHistory: [],
});
export type Migration = (
  raw: Record<string, unknown>,
  now: number,
) => Record<string, unknown>;
// Add future migrations here; supplied state is never mutated.
export const migrations: Record<number, Migration> = {
  2: (raw) => ({
    ...raw,
    schemaVersion: 3,
    sound: false,
    animationMode: raw.motion === false ? "off" : "on",
    reviewLength: 12,
    examTimerDefault: false,
    activityDays: {},
    examSession: null,
    examHistory: [],
  }),
  1: (raw, now) => {
    const schedules: Progress["schedules"] = {};
    const attempts: Progress["attempts"] = {};
    if (raw.attempts && typeof raw.attempts === "object")
      for (const [id, value] of Object.entries(raw.attempts)) {
        const parsed = attemptSchema.safeParse(value);
        if (parsed.success) {
          const a = parsed.data;
          attempts[id] = a;
          if (a.attempts > 0)
            schedules[id] = {
              ...newSchedule(now),
              seen: 1,
              firstCorrect: Number(
                a.firstAttemptCorrect === true && !a.usedHint,
              ),
              lapses: a.misses,
              lastLapseAt: a.misses ? now : null,
            };
        }
      }
    const objectives: Progress["objectives"] = {};
    for (const o of domains.flatMap((d) => d.objectives)) {
      const completedItems = o.activities
        .filter((a) => attempts[a.id]?.completed)
        .map((a) => a.id);
      const lessonRead =
        Array.isArray(raw.lessons) && raw.lessons.includes(o.id);
      if (lessonRead || completedItems.length)
        objectives[o.id] = { lessonRead, completedItems, updatedAt: now };
    }
    return { ...raw, schemaVersion: 2, schedules, objectives };
  },
};
export function migrate(raw: unknown, now: number): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  let result = { ...raw } as Record<string, unknown>;
  let version = Number(result.schemaVersion ?? result.version ?? 1);
  if (!Number.isInteger(version) || version < 1)
    throw new Error("Unrecognized progress version.");
  if (version > SCHEMA_VERSION)
    throw new Error(
      "This progress was created by a newer app version. Update the app before importing.",
    );
  while (version < SCHEMA_VERSION) {
    const hook = migrations[version];
    if (!hook)
      throw new Error(`No migration is available for version ${version}.`);
    result = hook(result, now);
    version = Number(result.schemaVersion);
  }
  return result;
}
// On-device recovery resets a bad slice/record. Import uses strict validation instead.
export function recoverProgress(raw: unknown, now: number): Progress {
  let data: Record<string, unknown>;
  try {
    data = migrate(raw, now);
  } catch {
    return emptyProgress();
  }
  const result = { ...emptyProgress() } as Record<string, unknown>;
  for (const [key, schema] of Object.entries(progressSchema.shape)) {
    const value = schema.safeParse(data[key]);
    if (value.success) result[key] = value.data;
    else if (
      ["attempts", "schedules", "objectives", "resume"].includes(key) &&
      data[key] &&
      typeof data[key] === "object" &&
      !Array.isArray(data[key])
    ) {
      const entrySchema = {
        attempts: attemptSchema,
        schedules: scheduleSchema,
        objectives: objectiveProgressSchema,
        resume: resumeSchema,
      }[key]!;
      result[key] = Object.fromEntries(
        Object.entries(data[key] as object).flatMap(([id, entry]) => {
          const parsed = entrySchema.safeParse(entry);
          return parsed.success ? [[id, parsed.data]] : [];
        }),
      );
    }
  }
  return result as Progress;
}
const envelope = z.object({
  schemaVersion: count,
  appVersion: z.string().min(1),
  exportedAt: z.string().datetime(),
  progress: z.unknown(),
});
const legacyImportSchema = z.object({
  attempts: z.record(z.string(), attemptSchema),
  lessons: z.array(z.string()),
  resume: z.record(z.string(), resumeSchema),
  theme: z.enum(["system", "light", "dark"]),
  motion: z.boolean(),
});
export function exportProgress(progress: Progress, now: number): string {
  return JSON.stringify(
    {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date(now).toISOString(),
      progress: progressSchema.parse(progress),
    },
    null,
    2,
  );
}
export function importProgress(json: string, now: number): Progress {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("This file is not valid JSON. No progress was changed.");
  }
  const file = envelope.safeParse(raw);
  if (!file.success)
    throw new Error(
      "This is not a valid progress export. No progress was changed.",
    );
  if (file.data.schemaVersion > SCHEMA_VERSION)
    throw new Error(
      "This file needs a newer app version. No progress was changed.",
    );
  const inner = file.data.progress as Record<string, unknown>;
  if (
    !inner ||
    typeof inner !== "object" ||
    Number(inner.schemaVersion ?? inner.version) !== file.data.schemaVersion
  )
    throw new Error(
      "The file contains inconsistent versions. No progress was changed.",
    );
  if (
    file.data.schemaVersion === 1 &&
    !legacyImportSchema.safeParse(inner).success
  )
    throw new Error(
      "The older export is incomplete or malformed. Nothing was imported.",
    );
  const migrated = migrate(inner, now);
  const candidate =
    file.data.schemaVersion < SCHEMA_VERSION
      ? { ...emptyProgress(), ...migrated }
      : migrated;
  const parsed = progressSchema.safeParse(candidate);
  if (!parsed.success)
    throw new Error("Some progress fields are invalid. Nothing was imported.");
  return parsed.data;
}
