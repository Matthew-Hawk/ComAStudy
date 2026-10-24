import { describe, it, expect, vi } from "vitest";
import { indexedDatabase } from "./repository";
import { emptyProgress } from "./model";
// API-level transaction fixture. Real browser storage durability is a separate manual check.
function fixture() {
  let saved: unknown;
  let aborted = false;
  const createObjectStore = vi.fn();
  const close = vi.fn();
  const db = {
    objectStoreNames: { contains: () => false },
    createObjectStore,
    close,
    onversionchange: null as (() => void) | null,
    transaction: vi.fn((_name: string, mode: string) => {
      const tx = {
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        error: new Error("Aborted"),
        objectStore: () => ({
          get: () => {
            const req = {
              result: saved,
              onsuccess: null as (() => void) | null,
              onerror: null,
            };
            queueMicrotask(() => req.onsuccess?.());
            return req;
          },
          put: (value: unknown, key: string) => {
            expect(key).toBe("current");
            queueMicrotask(() => {
              if (aborted) {
                tx.onabort?.();
                return;
              }
              saved = structuredClone(value);
              tx.oncomplete?.();
            });
          },
        }),
      };
      expect(["readonly", "readwrite"]).toContain(mode);
      return tx;
    }),
  };
  const open = vi.fn(() => {
    const request = {
      result: db,
      onupgradeneeded: null as (() => void) | null,
      onsuccess: null as (() => void) | null,
      onerror: null,
      onblocked: null,
    };
    queueMicrotask(() => {
      request.onupgradeneeded?.();
      request.onsuccess?.();
    });
    return request;
  });
  return {
    factory: { open } as unknown as IDBFactory,
    db,
    abort: () => {
      aborted = true;
    },
  };
}
describe("native IndexedDB adapter contract", () => {
  it("creates its object store, waits for a committed write, and reads the stored snapshot", async () => {
    const f = fixture();
    const adapter = indexedDatabase(f.factory);
    const p = { ...emptyProgress(), xp: 10 };
    await adapter.write(p);
    expect(f.db.createObjectStore).toHaveBeenCalledWith("progress");
    expect(await adapter.read()).toEqual(p);
    expect(f.db.transaction).toHaveBeenCalledWith("progress", "readwrite");
  });
  it("reports an aborted transaction instead of acknowledging a save", async () => {
    const f = fixture();
    f.abort();
    await expect(
      indexedDatabase(f.factory).write(emptyProgress()),
    ).rejects.toThrow("Aborted");
  });
  it("reopens after a database version change", async () => {
    const f = fixture();
    const adapter = indexedDatabase(f.factory);
    await adapter.read();
    f.db.onversionchange?.();
    expect(f.db.close).toHaveBeenCalled();
    await adapter.read();
    expect(f.factory.open).toHaveBeenCalledTimes(2);
  });
});
