import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { emptyProgress, useStudy } from "./storage";
beforeEach(() => {
  useStudy.setState({ progress: emptyProgress(), storageError: false });
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
function app(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
describe("study routes and recovery", () => {
  it("introduces the site, offers random unscored practice, and opens topic selection", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0);
    app();
    expect(
      screen.queryByRole("link", { name: "Start review" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /Understand the tech/ }),
    ).toBeInTheDocument();
    const original = useStudy.getState().progress;
    await screen.findByRole("button", { name: "SSD" });
    await user.click(screen.getByRole("button", { name: "SSD" }));
    expect(
      screen.getByText("Not quite. Let’s work through it."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "RAM" }));
    expect(screen.getByText("That’s right. Here’s why.")).toBeInTheDocument();
    expect(useStudy.getState().progress).toBe(original);
    await user.click(
      screen.getByRole("button", { name: "Try another question" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "RAM" }),
      ).not.toBeInTheDocument(),
    );
    await screen.findByRole("button", { name: "Try another question" });
    expect(
      screen.queryByRole("button", { name: "RAM" }),
    ).not.toBeInTheDocument();
    expect(useStudy.getState().progress).toBe(original);
    await user.click(
      screen.getByRole("link", { name: "Choose your study topics" }),
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Choose a skill. Start building it.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /CHAPTER/ })).toHaveLength(5);
  });
  it("opens every chapter without accounts and filters chapters by exam and query", async () => {
    const user = userEvent.setup();
    app("/study");
    expect(screen.getAllByRole("link", { name: /CHAPTER/ })).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: /Core 2/ }));
    expect(screen.getAllByRole("link", { name: /CHAPTER/ })).toHaveLength(4);
    await user.type(screen.getByRole("searchbox"), "nonsense");
    expect(screen.getByText("No chapters found")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getAllByRole("link", { name: /CHAPTER/ })).toHaveLength(4);
  });
  it("starts at a later section and saves/resumes it without locking the earlier section", async () => {
    const user = userEvent.setup();
    app(
      "/chapters/mobile-devices/sections/220-1201-1.2/lesson?start=220-1201-1.2",
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Connections on the go" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 4 steps")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Start practice/ }));
    await user.click(screen.getByRole("link", { name: "Save & exit" }));
    expect(screen.getByRole("link", { name: /Resume/ })).toHaveAttribute(
      "href",
      expect.stringContaining("activities/220-1201-1.2-check"),
    );
    expect(screen.getAllByRole("link", { name: /Start section/ })).toHaveLength(
      2,
    );
  });
  it("redirects a shared activity link to its prerequisite lesson", () => {
    app(
      "/chapters/networking/sections/220-1201-2.1/activities/220-1201-2.1-recall",
    );
    expect(
      screen.getByRole("button", { name: /Start practice/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Check answer/ }),
    ).not.toBeInTheDocument();
  });
  it("does not allow a later activity before completing the previous one", async () => {
    const user = userEvent.setup();
    app("/chapters/mobile-devices/sections/220-1201-1.1/lesson");
    await user.click(screen.getByRole("button", { name: /Start practice/ }));
    cleanup();
    app(
      "/chapters/mobile-devices/sections/220-1201-1.1/activities/220-1201-1.1-card",
    );
    expect(
      screen.getByText(
        "Which component holds the active working data of running applications?",
      ),
    ).toBeInTheDocument();
  });
  it("applies the theme and motion preferences with native controls", async () => {
    const user = userEvent.setup();
    app("/settings");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Theme" }),
      "dark",
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Animations" }),
      "off",
    );
    expect(document.documentElement.dataset.motion).toBe("false");
  });
  it("offers a safe route for an unknown chapter", () => {
    app("/chapters/absent");
    expect(
      screen.getByRole("link", { name: "Return to library" }),
    ).toHaveAttribute("href", "/study");
  });
});
