import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyProgress, localProgressStorage, useStudy } from "./storage";
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("local persistence boundary", () => {
  it("round-trips saved progress and miss counts", () => {
    const progress = emptyProgress();
    progress.attempts["item"] = {
      misses: 3,
      attempts: 4,
      completed: true,
      firstAttemptCorrect: false,
    };
    expect(localProgressStorage.write(progress)).toBe(true);
    expect(localProgressStorage.read()).toEqual(progress);
  });
  it("recovers from malformed or incompatible saved JSON", () => {
    localStorage.setItem("studybench.progress.v1", "{invalid");
    expect(localProgressStorage.read()).toEqual(emptyProgress());
    localStorage.setItem(
      "studybench.progress.v1",
      JSON.stringify({ version: 999 }),
    );
    expect(localProgressStorage.read()).toEqual(emptyProgress());
  });
  it("keeps an in-memory session usable when persistent storage fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    useStudy.setState({ progress: emptyProgress(), storageError: false });
    useStudy.getState().update((p) => ({ ...p, motion: false }));
    expect(useStudy.getState().progress.motion).toBe(false);
    expect(useStudy.getState().storageError).toBe(true);
  });
});
