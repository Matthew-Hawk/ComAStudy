import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyProgress, createStudyStore } from "./storage";
import { createProgressStorage } from "./persistence/repository";
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("local persistence boundary", () => {
  it("round-trips saved progress and miss counts", async () => {
    const repository = createProgressStorage(null, localStorage);
    const progress = emptyProgress();
    progress.attempts["item"] = {
      misses: 3,
      attempts: 4,
      completed: true,
      firstAttemptCorrect: false,
    };
    expect(await repository.save(progress)).toBe(true);
    expect(await repository.read()).toEqual(progress);
  });
  it("recovers from malformed or incompatible saved JSON", async () => {
    const repository = createProgressStorage(null, localStorage);
    localStorage.setItem("studybench.progress.v1", "{invalid");
    expect(await repository.read()).toEqual(emptyProgress());
    localStorage.setItem(
      "studybench.progress.v1",
      JSON.stringify({ version: 999 }),
    );
    expect(await repository.read()).toEqual(emptyProgress());
  });
  it("keeps an in-memory session usable when persistent storage fails", async () => {
    const useStudy = createStudyStore(
      createProgressStorage(null, localStorage),
    );
    await useStudy.getState().initialize();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    useStudy.setState({ progress: emptyProgress(), storageError: false });
    useStudy.getState().update((p) => ({ ...p, motion: false }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useStudy.getState().progress.motion).toBe(false);
    expect(useStudy.getState().storageError).toBe(true);
  });
});
