import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { domains } from "../test/content";
import { emptyProgress, useStudy } from "../storage";
import type { ExamSession } from "./exam";
const o = domains[0].objectives[0];
const item = o.activities[0];
const saved = (): ExamSession => ({
  id: "exam-ui",
  exam: "220-1201",
  requested: 1,
  questions: [{ domainId: domains[0].id, objectiveId: o.id, itemId: item.id }],
  answers: {},
  flags: [],
  cursor: 0,
  startedAt: Date.now(),
  timerOn: true,
  timerHidden: false,
  seed: 1,
});
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
  vi.unstubAllGlobals();
});
function app(path = "/exam") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
describe("exam interaction contract", () => {
  it("focuses the objective named by a stats section link", async () => {
    app(`/chapters/${domains[0].id}#${o.id}`);
    await waitFor(() => expect(document.getElementById(o.id)).toHaveFocus());
  });
  it("completes the exam flow using keyboard activation only", async () => {
    const user = userEvent.setup();
    if (item.type !== "multiple_choice") throw Error();
    useStudy.setState({
      progress: { ...emptyProgress(), examSession: saved() },
    });
    app();
    async function enter(name: string) {
      screen.getByRole("button", { name }).focus();
      await user.keyboard("{Enter}");
    }
    await enter("Resume exam");
    screen
      .getByRole("radio", {
        name: (n) =>
          n.endsWith(item.options.find((o) => o.id === item.correct)!.text),
      })
      .focus();
    await user.keyboard(" ");
    await enter("Review all questions");
    await enter("Submit practice exam");
    await enter("Confirm submission");
    expect(
      await screen.findByRole("heading", { name: "Your practice results" }),
    ).toBeInTheDocument();
    expect(useStudy.getState().progress.examHistory[0].correct).toBe(1);
  });
  it("saves edits and flags, exposes no feedback, requires confirmation, and reviews misses through the retry loop", async () => {
    const user = userEvent.setup();
    if (item.type !== "multiple_choice") throw Error();
    useStudy.setState({
      progress: { ...emptyProgress(), examSession: saved() },
    });
    app();
    await user.click(screen.getByRole("button", { name: "Resume exam" }));
    await user.click(
      screen.getByRole("radio", {
        name: (n) => n.endsWith(item.options[1].text),
      }),
    );
    expect(
      screen.queryByText(item.options[1].whyWrong),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request a hint" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", { name: "Flag this question for review" }),
    );
    await user.click(screen.getByRole("button", { name: "Hide timer" }));
    expect(screen.queryByText(/Elapsed:/)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Review all questions" }),
    );
    expect(
      screen.getByRole("button", { name: "Question 1 · Answered · Flagged" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Submit practice exam" }),
    );
    expect(useStudy.getState().progress.examHistory).toHaveLength(0);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirm submission",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Your practice results" }),
    ).toBeInTheDocument();
    expect(useStudy.getState().progress.examHistory).toHaveLength(1);
    expect(useStudy.getState().progress.schedules[item.id].lapses).toBe(1);
    await user.click(
      screen.getByRole("button", { name: "Review missed question" }),
    );
    await user.click(
      screen.getByRole("radio", {
        name: (n) => n.endsWith(item.options[1].text),
      }),
    );
    await user.click(screen.getByRole("button", { name: /Check answer/ }));
    expect(screen.getByText(item.options[1].whyWrong)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue →" }),
    ).not.toBeInTheDocument();
  });
  it("offers capped lengths and does not silently start or submit an exam", async () => {
    const user = userEvent.setup();
    app();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Length" }),
      "Full",
    );
    expect(
      await screen.findByText(/only 22 eligible questions/),
    ).toBeInTheDocument();
    expect(useStudy.getState().progress.examSession).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Start practice exam" }),
    );
    expect(useStudy.getState().progress.examSession?.questions).toHaveLength(
      22,
    );
    expect(screen.queryByText(/That’s right/)).not.toBeInTheDocument();
    cleanup();
    app();
    expect(
      screen.getByRole("button", { name: "Resume exam" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Discard saved exam" }),
    );
    expect(useStudy.getState().progress.examSession).toBeNull();
  });
  it("keeps RESET guarded by a typed word and preserves unrelated website data", async () => {
    const user = userEvent.setup();
    localStorage.setItem("unrelated", "keep");
    useStudy.setState({ progress: { ...emptyProgress(), xp: 99 } });
    app("/settings");
    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm reset" }),
    );
    expect(useStudy.getState().progress.xp).toBe(99);
    await user.type(
      within(dialog).getByRole("textbox", { name: "Type RESET to confirm" }),
      "RESET",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm reset" }),
    );
    await waitFor(() => expect(useStudy.getState().progress.xp).toBe(0));
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
