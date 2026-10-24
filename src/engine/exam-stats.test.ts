import { describe, it, expect } from "vitest";
import { domains } from "../test/content";
import {
  allocateQuestions,
  buildExam,
  answerExam,
  flagExam,
  scoreExam,
  type ExamSession,
} from "./exam";
import { calculateStats } from "./stats";
import { createStudyStore, emptyProgress } from "../storage";
import { createProgressStorage } from "../persistence/repository";
import {
  exportProgress,
  importProgress,
  recoverProgress,
  SCHEMA_VERSION,
} from "../persistence/model";
import { newSchedule } from "./scheduler";
import { EXAM_WEIGHTS } from "../exam-config";
const now = Date.parse("2026-10-24T15:00:00Z");
const session = (): ExamSession => ({
  id: "test-exam",
  exam: "220-1201",
  requested: 15,
  questions: buildExam(domains, "220-1201", 15, 42),
  answers: {},
  flags: [],
  cursor: 0,
  startedAt: now - 60000,
  timerOn: false,
  timerHidden: false,
  seed: 42,
});
describe("practice exam allocation and state", () => {
  it("keeps content metadata weights synchronized with the PDF-sourced exam config", () => {
    for (const exam of ["220-1201", "220-1202"] as const)
      expect(
        Object.fromEntries(
          domains.filter((d) => d.exam === exam).map((d) => [d.id, d.weight]),
        ),
      ).toEqual(EXAM_WEIGHTS[exam]);
  });
  it("uses largest remainders and always fills the requested total when supply allows", () => {
    for (let n = 1; n <= 90; n++) {
      const a = allocateQuestions(
        { a: 13, b: 23, c: 25, d: 11, e: 28 },
        { a: 100, b: 100, c: 100, d: 100, e: 100 },
        n,
      );
      expect(Object.values(a).reduce((n, v) => n + v, 0)).toBe(n);
      for (const [id, w] of Object.entries({
        a: 13,
        b: 23,
        c: 25,
        d: 11,
        e: 28,
      }))
        expect(Math.abs(a[id] - (n * w) / 100)).toBeLessThan(1.01);
    }
  });
  it("redistributes shortages without duplicates and caps to eligible supply", () => {
    const a = allocateQuestions({ a: 90, b: 10 }, { a: 1, b: 10 }, 8);
    expect(a).toEqual({ a: 1, b: 7 });
    const q = buildExam(domains, "220-1201", 90, 1);
    expect(q).toHaveLength(22);
    expect(new Set(q.map((i) => i.itemId)).size).toBe(q.length);
    expect(
      q.every(
        (i) =>
          domains
            .flatMap((d) => d.objectives.flatMap((o) => o.activities))
            .find((a) => a.id === i.itemId)!.type !== "flashcard",
      ),
    ).toBe(true);
    expect(buildExam(domains, "220-1202", 90, 1)).toHaveLength(17);
  });
  it("is random across seeds and reproducible with an injected seed", () => {
    expect(buildExam(domains, "220-1201", 15, 3)).toEqual(
      buildExam(domains, "220-1201", 15, 3),
    );
    expect(buildExam(domains, "220-1201", 15, 3)).not.toEqual(
      buildExam(domains, "220-1201", 15, 4),
    );
  });
  it("supports answer changes and flags without exposing a result", () => {
    let s = session();
    s = answerExam(s, s.questions[0].itemId, "a");
    s = answerExam(s, s.questions[0].itemId, "b");
    s = flagExam(s, s.questions[0].itemId);
    expect(s.answers[s.questions[0].itemId]).toBe("b");
    expect(s.flags).toContain(s.questions[0].itemId);
    expect(s).not.toHaveProperty("score");
    expect(s).not.toHaveProperty("correct");
    expect(flagExam(s, s.questions[0].itemId).flags).toEqual([]);
  });
  it("scores by domain and counts unanswered questions as misses", () => {
    const s = session();
    const q = s.questions[0];
    const a = domains
      .flatMap((d) => d.objectives.flatMap((o) => o.activities))
      .find((a) => a.id === q.itemId)!;
    if (a.type === "multiple_choice") s.answers[a.id] = a.correct;
    else if (a.type === "fill_in_blank") s.answers[a.id] = a.accepted[0];
    else if (a.type === "drag_match")
      s.answers[a.id] = Object.fromEntries(a.pairs.map((p) => [p.id, p.id]));
    else if (a.type === "drag_sort")
      s.answers[a.id] = Object.fromEntries(
        a.items.map((i) => [i.id, i.category]),
      );
    else if (a.type === "drag_order")
      s.answers[a.id] = a.steps.map((s) => s.id);
    const result = scoreExam(s, domains, now);
    expect(result.correct).toBe(1);
    expect(result.missedIds).toHaveLength(14);
    expect(result.domainScores.reduce((n, d) => n + d.correct, 0)).toBe(1);
    expect(result.elapsedMs).toBe(60000);
  });
});
describe("exam persistence, scheduling and stats", () => {
  it("submits once, creates lapses, awards correct-answer XP and includes history in backups", async () => {
    const repo = createProgressStorage(null, localStorage);
    const store = createStudyStore(repo);
    const s = session();
    const q = s.questions.find(
      (q) =>
        domains
          .flatMap((d) => d.objectives.flatMap((o) => o.activities))
          .find((a) => a.id === q.itemId)?.type === "multiple_choice",
    )!;
    const a = domains
      .flatMap((d) => d.objectives.flatMap((o) => o.activities))
      .find((a) => a.id === q.itemId)!;
    if (a.type !== "multiple_choice") throw Error();
    s.answers[q.itemId] = a.correct;
    store.getState().update((p) => ({ ...p, examSession: s }));
    const result = store.getState().submitExam(domains, now)!;
    expect(result.correct).toBe(1);
    expect(store.getState().progress.xp).toBe(10);
    expect(
      store.getState().progress.schedules[result.missedIds[0]].lapses,
    ).toBe(1);
    expect(store.getState().submitExam(domains, now)).toBeNull();
    expect(store.getState().progress.xp).toBe(10);
    const p = store.getState().progress;
    expect(importProgress(exportProgress(p, now), now)).toEqual(p);
    await repo.flush();
  });
  it("migrates schema 2 settings and preserves schedules without fabricating daily history", () => {
    const old = { ...emptyProgress(), schemaVersion: 2, motion: false, xp: 55 };
    const p = recoverProgress(old, now);
    expect(p.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.xp).toBe(55);
    expect(p.animationMode).toBe("off");
    expect(p.activityDays).toEqual({});
    expect(p.examHistory).toEqual([]);
  });
  it("keeps an in-progress exam and answer changes through export/import", () => {
    const p = emptyProgress();
    p.examSession = answerExam(
      session(),
      session().questions[0].itemId,
      "edited",
    );
    expect(importProgress(exportProgress(p, now), now).examSession).toEqual(
      p.examSession,
    );
  });
  it("calculates accuracy, weakest objectives, 30-day activity and 7-day forecast", () => {
    const p = emptyProgress();
    const o = domains[0].objectives[0];
    p.schedules[o.activities[0].id] = {
      ...newSchedule(now - 86400000),
      seen: 4,
      firstCorrect: 1,
      lapses: 3,
    };
    p.activityDays["2026-10-24"] = 3;
    const s = calculateStats(p, domains, new Date(now));
    expect(s.itemsSeen).toBe(1);
    expect(s.accuracy).toBe(25);
    expect(s.weakest[0].objectiveId).toBe(o.id);
    expect(s.activity).toHaveLength(30);
    expect(s.activity.at(-1)!.value).toBe(3);
    expect(s.forecast).toHaveLength(7);
    expect(s.forecast[0].value).toBe(1);
  });
});
