import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import App from "../App";
import { useStudy, emptyProgress } from "../storage";
import { domains } from "./content";
import { initialAttempt } from "../engine/retry";
import { scoreExam, type ExamSession } from "../engine/exam";
import { Activity } from "../components/Activity";
const o = domains[0].objectives[0];
const item = o.activities[0];
const saved: ExamSession = {
  id: "audit-exam",
  exam: "220-1201",
  requested: 1,
  questions: [{ domainId: domains[0].id, objectiveId: o.id, itemId: item.id }],
  answers: {},
  flags: [],
  cursor: 0,
  startedAt: 1,
  timerOn: false,
  timerHidden: false,
  seed: 1,
};
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => null,
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const paths = [
  "/",
  "/study",
  "/chapters/mobile-devices",
  `/chapters/mobile-devices/sections/${o.id}/lesson`,
  `/chapters/mobile-devices/sections/${o.id}/activities/${item.id}`,
  "/review",
  "/exam",
  "/stats",
  "/settings",
  "/guide",
  "/unknown",
  "/exam/results/audit-exam",
];
describe("automated accessibility checks in both themes", () => {
  for (const theme of ["light", "dark"] as const)
    for (const type of [
      "flashcard",
      "fill_in_blank",
      "multiple_choice",
      "drag_match",
      "drag_sort",
      "drag_order",
    ] as const)
      it(`${theme}: ${type} activity controls`, async () => {
        useStudy.setState({
          progress: { ...emptyProgress(), theme },
          ready: true,
        });
        document.documentElement.dataset.theme = theme;
        const objective = domains
          .flatMap((d) => d.objectives)
          .find((o) => o.activities.some((a) => a.type === type))!;
        const item = objective.activities.find((a) => a.type === type)!;
        render(
          <main>
            <h1>Activity accessibility check</h1>
            <Activity
              item={item}
              objective={objective}
              state={initialAttempt()}
              onAttempt={() => {}}
              onNext={() => {}}
            />
          </main>,
        );
        const results = await axe.run(document.body, {
          runOnly: {
            type: "tag",
            values: [
              "wcag2a",
              "wcag2aa",
              "wcag21a",
              "wcag21aa",
              "wcag22a",
              "wcag22aa",
            ],
          },
          rules: { "color-contrast": { enabled: false } },
        });
        expect(
          results.violations.filter(
            (v) => v.impact === "serious" || v.impact === "critical",
          ),
        ).toEqual([]);
      });
  for (const theme of ["light", "dark"] as const)
    for (const path of paths)
      it(`${theme}: ${path}`, async () => {
        const p = {
          ...emptyProgress(),
          theme,
          lessons: [o.id],
          examHistory: [scoreExam(saved, domains, 1000)],
        };
        useStudy.setState({
          progress: p,
          ready: true,
          storageError: false,
          notifications: [],
          xpTick: 0,
        });
        render(
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>,
        );
        await screen.findByRole("main");
        const results = await axe.run(document.body, {
          runOnly: {
            type: "tag",
            values: [
              "wcag2a",
              "wcag2aa",
              "wcag21a",
              "wcag21aa",
              "wcag22a",
              "wcag22aa",
            ],
          },
          rules: { "color-contrast": { enabled: false } },
        });
        expect(
          results.violations
            .filter((v) => v.impact === "serious" || v.impact === "critical")
            .map((v) => ({
              id: v.id,
              help: v.help,
              nodes: v.nodes.map((n) => n.html),
            })),
        ).toEqual([]);
      });
});
