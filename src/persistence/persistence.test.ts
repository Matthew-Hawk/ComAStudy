import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emptyProgress,
  exportProgress,
  importProgress,
  recoverProgress,
  migrate,
  SCHEMA_VERSION,
  APP_VERSION,
} from "./model";
import { createProgressStorage, type Database } from "./repository";
import { createStudyStore } from "../storage";
import { newSchedule } from "../engine/scheduler";
import { initialAttempt, attempt } from "../engine/retry";
import { domains } from "../test/content";
const now = Date.parse("2026-10-24T12:00:00Z");
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("versioned backups", () => {
  it("round-trips all progress slices and includes app/schema versions", () => {
    const p = emptyProgress();
    p.xp = 45;
    p.theme = "dark";
    p.schedules.item = { ...newSchedule(now), seen: 2, firstCorrect: 1 };
    p.resume.chapter = { start: "section", cursor: 2 };
    const json = exportProgress(p, now);
    expect(JSON.parse(json)).toMatchObject({
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    });
    expect(importProgress(json, now)).toEqual(p);
  });
  it.each([
    "not-json",
    "{}",
    "[]",
    JSON.stringify({
      schemaVersion: 3,
      appVersion: "future",
      exportedAt: new Date(now).toISOString(),
      progress: { schemaVersion: 3 },
    }),
  ])("rejects malformed/newer files: %s", (json) =>
    expect(() => importProgress(json, now)).toThrow(),
  );
  it("rejects the entire import for a bad slice or inconsistent record", () => {
    const file = JSON.parse(exportProgress(emptyProgress(), now));
    file.progress.xp = -1;
    expect(() => importProgress(JSON.stringify(file), now)).toThrow(
      /Nothing was imported/,
    );
    file.progress.xp = 1;
    file.progress.attempts.bad = { ...initialAttempt(), completed: true };
    expect(() => importProgress(JSON.stringify(file), now)).toThrow();
  });
  it("refuses inconsistent envelope and inner versions", () => {
    const file = JSON.parse(exportProgress(emptyProgress(), now));
    file.progress.schemaVersion = 1;
    expect(() => importProgress(JSON.stringify(file), now)).toThrow(
      /inconsistent/,
    );
  });
  it("does not repair a malformed legacy import or an impossible active review queue", () => {
    const legacy = {
      schemaVersion: 1,
      appVersion: "0.1.0",
      exportedAt: new Date(now).toISOString(),
      progress: { version: 1 },
    };
    expect(() => importProgress(JSON.stringify(legacy), now)).toThrow(
      /incomplete/,
    );
    const file = JSON.parse(exportProgress(emptyProgress(), now));
    file.progress.review = {
      id: "bad",
      queue: [],
      cursor: 0,
      attempts: {},
      completed: false,
      source: "daily",
    };
    expect(() => importProgress(JSON.stringify(file), now)).toThrow(
      /Nothing was imported/,
    );
  });
  it("runs the v1 migration hook without inventing XP, mastery or review intervals", () => {
    const id = domains[0].objectives[0].activities[0].id;
    const old = {
      version: 1,
      attempts: {
        [id]: {
          misses: 2,
          completed: true,
          attempts: 3,
          firstAttemptCorrect: false,
        },
      },
      lessons: [domains[0].objectives[0].id],
      resume: {
        "mobile-devices": { start: domains[0].objectives[0].id, cursor: 2 },
      },
      theme: "dark",
      motion: false,
    };
    const migrated = recoverProgress(old, now);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.xp).toBe(0);
    expect(migrated.schedules[id]).toMatchObject({
      lapses: 2,
      interval: 0,
      repetitions: 0,
      dueAt: now,
    });
    expect(
      migrated.objectives[domains[0].objectives[0].id].completedItems,
    ).toContain(id);
    expect(migrated.theme).toBe("dark");
    expect(old).not.toHaveProperty("schemaVersion");
    const wrapped = {
      schemaVersion: 1,
      appVersion: "0.1.0",
      exportedAt: new Date(now).toISOString(),
      progress: old,
    };
    expect(importProgress(JSON.stringify(wrapped), now)).toMatchObject({
      schemaVersion: SCHEMA_VERSION,
      theme: "dark",
    });
  });
  it("recovers corrupted slices and individual records while preserving healthy data", () => {
    const p = emptyProgress();
    const recovered = recoverProgress(
      {
        ...p,
        xp: "broken",
        theme: "dark",
        schedules: { good: newSchedule(now), bad: { ease: 0 } },
        streak: { current: 9 },
      },
      now,
    );
    expect(recovered.theme).toBe("dark");
    expect(recovered.xp).toBe(0);
    expect(recovered.schedules.good).toEqual(newSchedule(now));
    expect(recovered.schedules).not.toHaveProperty("bad");
    expect(recovered.streak.current).toBe(0);
    expect(() => migrate({ schemaVersion: 99 }, now)).toThrow(/newer/);
  });
});
describe("IndexedDB boundary and fallback", () => {
  it("preserves stored future-version data and refuses to overwrite it", async () => {
    const future = JSON.stringify({
      ...emptyProgress(),
      schemaVersion: 99,
      xp: 100,
    });
    localStorage.setItem("studybench.progress.v2", future);
    const repo = createProgressStorage(null, localStorage);
    await expect(repo.read()).rejects.toThrow(/newer/);
    expect(await repo.save(emptyProgress())).toBe(false);
    expect(localStorage.getItem("studybench.progress.v2")).toBe(future);
  });
  it("loads IndexedDB and serializes answer writes in order", async () => {
    let primary: unknown = { ...emptyProgress(), revision: 3, xp: 10 };
    const writes: number[] = [];
    const db: Database = {
      read: async () => primary,
      write: async (p) => {
        writes.push(p.revision);
        primary = p;
      },
    };
    const repo = createProgressStorage(db, localStorage, () => now);
    expect((await repo.read()).xp).toBe(10);
    const a = repo.save({ ...emptyProgress(), revision: 4, xp: 20 });
    const b = repo.save({ ...emptyProgress(), revision: 5, xp: 30 });
    await Promise.all([a, b]);
    await repo.flush();
    expect(writes).toEqual([4, 5]);
    expect((await repo.read()).xp).toBe(30);
  });
  it("writes the recovery journal synchronously even before IndexedDB finishes", async () => {
    let finish!: () => void;
    const db: Database = {
      read: async () => null,
      write: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    };
    const repo = createProgressStorage(db, localStorage);
    const saved = repo.save({ ...emptyProgress(), xp: 10, revision: 1 });
    expect(JSON.parse(localStorage.getItem("studybench.progress.v2")!).xp).toBe(
      10,
    );
    await Promise.resolve();
    finish();
    expect(await saved).toBe(true);
  });
  it("recovers a newer journal after a tab closes with an IndexedDB write pending", async () => {
    localStorage.setItem(
      "studybench.progress.v2",
      JSON.stringify({ ...emptyProgress(), revision: 5, xp: 50 }),
    );
    const db: Database = {
      read: async () => ({ ...emptyProgress(), revision: 4, xp: 40 }),
      write: async () => {},
    };
    expect((await createProgressStorage(db, localStorage).read()).xp).toBe(50);
  });
  it("falls back when IndexedDB is unavailable, blocked, or fails a write", async () => {
    const db: Database = {
      read: async () => {
        throw Error("Unavailable");
      },
      write: async () => {
        throw Error("Quota");
      },
    };
    const repo = createProgressStorage(db, localStorage);
    await repo.read();
    expect(await repo.save({ ...emptyProgress(), xp: 5 })).toBe(true);
    expect((await repo.read()).xp).toBe(5);
    const writing = createProgressStorage(
      { ...db, read: async () => null },
      localStorage,
    );
    expect(await writing.save({ ...emptyProgress(), xp: 6 })).toBe(true);
  });
  it("can use IndexedDB when localStorage is denied, and reports complete storage failure", async () => {
    const db: Database = { read: async () => null, write: async () => {} };
    expect(await createProgressStorage(db, null).save(emptyProgress())).toBe(
      true,
    );
    expect(await createProgressStorage(null, null).save(emptyProgress())).toBe(
      false,
    );
  });
  it("falls back to the legacy Phase 1 key", async () => {
    localStorage.setItem(
      "studybench.progress.v1",
      JSON.stringify({
        version: 1,
        theme: "dark",
        attempts: {},
        lessons: [],
        resume: {},
        motion: true,
      }),
    );
    expect((await createProgressStorage(null, localStorage).read()).theme).toBe(
      "dark",
    );
  });
});
describe("answer transactions", () => {
  it("records every lapse immediately, preserves it on completion, awards XP once, and persists hint use", async () => {
    const repo = createProgressStorage(null, localStorage, () => now);
    const store = createStudyStore(repo);
    await store.getState().initialize();
    const o = domains[0].objectives[0];
    const id = o.activities[0].id;
    let s = initialAttempt();
    s = attempt(s, false);
    store.getState().answer(id, o.id, s, now);
    s = attempt(s, false);
    store.getState().answer(id, o.id, s, now + 1);
    expect(store.getState().progress.schedules[id].lapses).toBe(2);
    expect(
      JSON.parse(localStorage.getItem("studybench.progress.v2")!).schedules[id]
        .lapses,
    ).toBe(2);
    s = attempt(s, true);
    store.getState().answer(id, o.id, s, now + 2);
    expect(store.getState().progress.schedules[id].repetitions).toBe(0);
    expect(store.getState().progress.schedules[id].lapses).toBe(2);
    const xp = store.getState().progress.xp;
    expect(xp).toBeGreaterThan(0);
    store.getState().answer(id, o.id, s, now + 3);
    expect(store.getState().progress.xp).toBe(xp);
    const nextId = o.activities[1].id;
    store
      .getState()
      .answer(
        nextId,
        o.id,
        attempt({ ...initialAttempt(), usedHint: true }, true),
        now,
      );
    expect(store.getState().progress.xp - xp).toBe(7);
    await repo.flush();
  });
  it("starts a fresh attempt for due reviews while preserving chapter completion", async () => {
    const repo = createProgressStorage(null, localStorage);
    const store = createStudyStore(repo);
    await store.getState().initialize();
    const o = domains[0].objectives[0];
    const id = o.activities[0].id;
    store.getState().answer(id, o.id, attempt(initialAttempt(), true), now);
    store.getState().update((p) => ({
      ...p,
      review: {
        id: "review",
        queue: [{ objectiveId: o.id, itemId: id, kind: "activity" }],
        cursor: 0,
        completed: false,
        source: "daily",
        attempts: {},
      },
    }));
    store
      .getState()
      .answer(id, o.id, attempt(initialAttempt(), false), now + 1, true);
    expect(store.getState().progress.attempts[id].completed).toBe(true);
    expect(store.getState().progress.review!.attempts[id].completed).toBe(
      false,
    );
    expect(store.getState().progress.schedules[id].lapses).toBe(1);
    await repo.flush();
  });
});
