import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { useStudy, emptyProgress } from "../storage";
import { domains } from "../content/load";
import { newSchedule } from "../engine/scheduler";
import { exportProgress } from "../persistence/model";
beforeEach(() => {
  useStudy.setState({
    progress: emptyProgress(),
    ready: true,
    storageError: false,
    notifications: [],
    xpTick: 0,
  });
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
const app = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
describe("Phase 2 interaction paths", () => {
  it("updates visible completion after a section and a whole chapter while labeling mastery separately", async () => {
    const user = userEvent.setup();
    const domain = domains[0];
    app(`/chapters/${domain.id}/sections/${domain.objectives[0].id}/lesson`);
    async function finishSection(index: number) {
      await user.click(screen.getByRole("button", { name: /Start practice/ }));
      for (const item of domain.objectives[index].activities) {
        if (item.type === "multiple_choice") {
          const correct = item.options.find((o) => o.id === item.correct)!;
          await user.click(
            screen.getByRole("radio", {
              name: (name) => name.endsWith(correct.text),
            }),
          );
          await user.click(
            screen.getByRole("button", { name: /Check answer/ }),
          );
        } else if (item.type === "fill_in_blank") {
          await user.type(
            screen.getByRole("textbox", { name: "Your answer" }),
            `${item.accepted[0]}{Enter}`,
          );
        } else if (item.type === "flashcard") {
          await user.click(screen.getByRole("button", { name: "Turn card" }));
          await user.click(screen.getByRole("button", { name: /I knew this/ }));
        }
        await user.click(screen.getByRole("button", { name: "Continue →" }));
      }
    }
    await finishSection(0);
    await user.click(screen.getByRole("link", { name: "Save & exit" }));
    expect(
      screen.getByText("50% complete · available seed content"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "← Study library" }));
    expect(
      screen.getByRole("progressbar", {
        name: `${domain.title} completion of available sections`,
      }),
    ).toHaveAttribute("aria-valuenow", "50");
    expect(
      screen.getByRole("img", {
        name: `${domain.title}: 0% mastery across available sections`,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /RESUME CHAPTER/ }));
    await finishSection(1);
    expect(
      screen.getByText("100% complete · available seed content"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "← Study library" }));
    expect(
      screen.getByRole("progressbar", {
        name: `${domain.title} completion of available sections`,
      }),
    ).toHaveAttribute("aria-valuenow", "100");
    cleanup();
    app();
    expect(
      screen.getByRole("progressbar", {
        name: `${domain.title} completion of available sections`,
      }),
    ).toHaveAttribute("aria-valuenow", "100");
  });
  it("refreshes completion on home when a daily-review answer is completed", () => {
    const domain = domains[0];
    const objective = domain.objectives[0];
    const item = objective.activities[0];
    useStudy.setState({
      progress: {
        ...emptyProgress(),
        review: {
          id: "review",
          queue: [
            { objectiveId: objective.id, itemId: item.id, kind: "activity" },
          ],
          cursor: 0,
          completed: false,
          source: "daily",
          attempts: {},
        },
      },
    });
    app();
    act(() =>
      useStudy
        .getState()
        .answer(
          item.id,
          objective.id,
          {
            misses: 0,
            attempts: 1,
            completed: true,
            firstAttemptCorrect: true,
          },
          Date.now(),
          true,
        ),
    );
    expect(
      screen.getByRole("progressbar", {
        name: `${domain.title} completion of available sections`,
      }),
    ).toHaveAttribute("aria-valuenow", "17");
  });
  it("clears an XP tick when a replacement or a later miss clears its award", () => {
    useStudy.setState({ xpTick: 10, progress: { ...emptyProgress(), xp: 10 } });
    app();
    expect(screen.getByText("+10 XP")).toBeInTheDocument();
    act(() => useStudy.setState({ xpTick: 0 }));
    expect(screen.queryByText("+0 XP")).not.toBeInTheDocument();
    expect(screen.queryByText("+10 XP")).not.toBeInTheDocument();
  });
  it("offers a nothing-due state with a path back to chapters", () => {
    app("/review");
    expect(
      screen.getByRole("heading", { name: "Nothing due right now." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue a chapter/ }),
    ).toHaveAttribute("href", "/");
  });
  it("requires correct answers in review and resumes unfinished attempts after remount", async () => {
    const user = userEvent.setup();
    const o = domains[0].objectives[0];
    const item = o.activities[0];
    if (item.type !== "multiple_choice") throw Error();
    useStudy.setState({
      progress: {
        ...emptyProgress(),
        schedules: {
          [item.id]: { ...newSchedule(Date.now() - 10000), seen: 1 },
        },
      },
    });
    app("/review");
    await user.click(
      screen.getByRole("button", { name: "Start 1-item review" }),
    );
    await user.click(
      screen.getByRole("radio", { name: new RegExp(item.options[1].text) }),
    );
    await user.click(screen.getByRole("button", { name: /Check answer/ }));
    expect(useStudy.getState().progress.schedules[item.id].lapses).toBe(1);
    expect(
      screen.queryByRole("button", { name: "Continue →" }),
    ).not.toBeInTheDocument();
    cleanup();
    app("/review");
    expect(screen.getByText("1 of 1 items")).toBeInTheDocument();
    await user.click(
      screen.getByRole("radio", { name: new RegExp(item.options[0].text) }),
    );
    await user.click(screen.getByRole("button", { name: /Check answer/ }));
    expect(useStudy.getState().progress.schedules[item.id].lapses).toBe(1);
    expect(useStudy.getState().progress.schedules[item.id].repetitions).toBe(0);
    await user.click(screen.getByRole("button", { name: "Continue →" }));
    expect(
      screen.getByRole("heading", { name: "Review complete. Nicely done." }),
    ).toBeInTheDocument();
  });
  it("grades a requested hint as hard and shows a subtle XP completion tick", async () => {
    const user = userEvent.setup();
    const o = domains[0].objectives[0];
    const item = o.activities[0];
    if (item.type !== "multiple_choice") throw Error();
    useStudy.setState({ progress: { ...emptyProgress(), lessons: [o.id] } });
    app(`/chapters/${domains[0].id}/sections/${o.id}/activities/${item.id}`);
    await user.click(screen.getByRole("button", { name: "Request a hint" }));
    expect(document.querySelector(".highlighted")).not.toBeNull();
    await user.click(
      screen.getByRole("radio", { name: new RegExp(item.options[0].text) }),
    );
    await user.click(screen.getByRole("button", { name: /Check answer/ }));
    expect(useStudy.getState().progress.xp).toBe(7);
    expect(useStudy.getState().progress.schedules[item.id].ease).toBe(2.35);
    expect(screen.getByText("+7 XP")).toBeInTheDocument();
  });
  it("shows the last saved chapter on the dashboard", async () => {
    const user = userEvent.setup();
    const d = domains[0];
    const o = d.objectives[0];
    app(`/chapters/${d.id}/sections/${o.id}/lesson`);
    await user.click(screen.getByRole("link", { name: "Save & exit" }));
    await user.click(screen.getByRole("link", { name: "← Study library" }));
    expect(
      screen.getByRole("link", { name: /RESUME CHAPTER/ }),
    ).toHaveAttribute("href", expect.stringContaining(o.id));
  });
  it("validates import, shows a replacement summary, and waits for explicit confirmation", async () => {
    const user = userEvent.setup();
    const candidate = { ...emptyProgress(), xp: 123, theme: "dark" as const };
    app("/settings");
    const file = new File(
      [exportProgress(candidate, Date.now())],
      "backup.json",
      { type: "application/json" },
    );
    Object.defineProperty(file, "text", {
      value: async () => exportProgress(candidate, Date.now()),
    });
    await user.upload(screen.getByLabelText("Import Progress"), file);
    const dialog = await screen.findByRole("dialog", {
      name: "Replace this device’s progress?",
    });
    expect(within(dialog).getByText(/123 XP/)).toBeInTheDocument();
    expect(useStudy.getState().progress.xp).toBe(0);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(useStudy.getState().progress.xp).toBe(0);
    await user.upload(screen.getByLabelText("Import Progress"), file);
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Replace progress",
      }),
    );
    await waitFor(() => expect(useStudy.getState().progress.xp).toBe(123));
    expect(useStudy.getState().progress.theme).toBe("dark");
  });
  it("refuses malformed imports without modifying any progress", async () => {
    const user = userEvent.setup();
    useStudy.setState({ progress: { ...emptyProgress(), xp: 12 } });
    app("/settings");
    const file = new File(["{broken"], "bad.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => "{broken" });
    await user.upload(screen.getByLabelText("Import Progress"), file);
    expect(await screen.findByText(/not valid JSON/)).toBeInTheDocument();
    expect(useStudy.getState().progress.xp).toBe(12);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("shows and dismisses an unlocked badge without changing earned history", async () => {
    const user = userEvent.setup();
    const badge = {
      id: "test",
      title: "A steady start",
      description: "Three days.",
    };
    useStudy.setState({
      notifications: [badge],
      progress: {
        ...emptyProgress(),
        badges: [{ ...badge, unlockedAt: Date.now() }],
      },
    });
    app();
    await user.click(
      screen.getByRole("button", { name: "Dismiss A steady start" }),
    );
    expect(screen.queryByText("A steady start")).not.toBeInTheDocument();
    expect(useStudy.getState().progress.badges).toHaveLength(1);
  });
  it("offers earlier due sections only at the chapter end, never in the linear session", () => {
    const d = domains[1];
    const earlier = d.objectives[0];
    const start = d.objectives[1];
    const schedules = Object.fromEntries(
      earlier.activities.map((a) => [
        a.id,
        { ...newSchedule(Date.now() - 1000), seen: 1 },
      ]),
    );
    useStudy.setState({ progress: { ...emptyProgress(), schedules } });
    app(`/chapters/${d.id}/sections/${start.id}/lesson?start=${start.id}`);
    expect(
      screen.queryByRole("link", { name: "Review earlier sections" }),
    ).not.toBeInTheDocument();
    cleanup();
    app(`/chapters/${d.id}?finished=${start.id}`);
    expect(
      screen.getByRole("link", { name: "Review earlier sections" }),
    ).toHaveAttribute("href", expect.stringContaining(`before=${start.id}`));
  });
});
