import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { Activity } from "./Activity";
import { domains } from "../content/load";
import { initialAttempt } from "../engine/retry";
import type { Activity as Item } from "../content/schema";
afterEach(cleanup);
const objective = domains.find((d) => d.id === "networking")!.objectives[0];
function Harness({
  item,
  onNext = vi.fn(),
}: {
  item: Item;
  onNext?: () => void;
}) {
  const [s, setS] = useState(initialAttempt);
  return (
    <Activity
      item={item}
      objective={objective}
      state={s}
      onAttempt={setS}
      onNext={onNext}
    />
  );
}
describe("activity UI", () => {
  it("blocks advancement, escalates help, and accepts recovery after three misses", async () => {
    const user = userEvent.setup();
    const item = objective.activities[0];
    if (item.type !== "multiple_choice") throw Error();
    const onNext = vi.fn();
    render(<Harness item={item} onNext={onNext} />);
    expect(
      screen.getByRole("button", { name: /check answer/i }),
    ).toBeDisabled();
    for (let n = 0; n < 3; n++) {
      await user.click(
        screen.getByRole("radio", { name: new RegExp(item.options[1].text) }),
      );
      await user.click(screen.getByRole("button", { name: /check answer/i }));
      expect(
        screen.queryByRole("button", { name: "Continue →" }),
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
      if (n >= 1) {
        expect(screen.getByText(/Hint:/)).toBeInTheDocument();
        expect(document.querySelector(".highlighted")).not.toBeNull();
      }
      if (n === 2)
        expect(screen.getByText("A worked walkthrough")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: /try a fresh version/i }),
      );
    }
    await user.click(
      screen.getByRole("radio", { name: new RegExp(item.options[0].text) }),
    );
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    await user.click(screen.getByRole("button", { name: "Continue →" }));
    expect(onNext).toHaveBeenCalledOnce();
  });
  it("offers an accessible tap-to-select/place alternative for matching", async () => {
    const user = userEvent.setup();
    const item = objective.activities.find((a) => a.type === "drag_match")!;
    render(<Harness item={item} />);
    await user.click(screen.getByRole("button", { name: "SSH" }));
    await user.click(
      screen.getByRole("button", { name: "Place selected item in 22" }),
    );
    await user.click(screen.getByRole("button", { name: "DNS" }));
    await user.click(
      screen.getByRole("button", { name: "Place selected item in 53" }),
    );
    await user.click(screen.getByRole("button", { name: "HTTPS" }));
    await user.click(
      screen.getByRole("button", { name: "Place selected item in 443" }),
    );
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByText("That’s right")).toBeInTheDocument();
  });
  it("re-asks a blank with an alternate prompt and accepts a correct answer using Enter", async () => {
    const user = userEvent.setup();
    const item = objective.activities.find((a) => a.type === "fill_in_blank")!;
    if (item.type !== "fill_in_blank") throw Error();
    render(<Harness item={item} />);
    const first = screen.getByRole("heading", { level: 2 }).textContent;
    await user.type(
      screen.getByRole("textbox", { name: "Your answer" }),
      "wrong{Enter}",
    );
    expect(
      screen.queryByRole("button", { name: "Continue →" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveFocus();
    await user.click(
      screen.getByRole("button", { name: /Try a fresh version/ }),
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
    expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(
      first,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Your answer" }),
      `${item.accepted[0]}{Enter}`,
    );
    expect(
      screen.getByRole("button", { name: "Continue →" }),
    ).toBeInTheDocument();
  });
  it("repeats an unknown flashcard without advancing until it is marked known", async () => {
    const user = userEvent.setup();
    const item = objective.activities.find((a) => a.type === "flashcard")!;
    render(<Harness item={item} />);
    await user.click(screen.getByRole("button", { name: "Turn card" }));
    await user.click(screen.getByRole("button", { name: "Still learning" }));
    expect(
      screen.queryByRole("button", { name: "Continue →" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Try a fresh version/ }),
    );
    await user.click(screen.getByRole("button", { name: "Turn card" }));
    await user.click(screen.getByRole("button", { name: /I knew this/ }));
    expect(
      screen.getByRole("button", { name: "Continue →" }),
    ).toBeInTheDocument();
  });
  it("completes category sorting entirely through keyboard activation", async () => {
    const user = userEvent.setup();
    const item = domains
      .flatMap((d) => d.objectives.flatMap((o) => o.activities))
      .find((a) => a.type === "drag_sort")!;
    if (item.type !== "drag_sort") throw Error();
    render(<Harness item={item} />);
    for (const token of item.items) {
      screen.getByRole("button", { name: token.text }).focus();
      await user.keyboard("{Enter}");
      screen
        .getByRole("button", {
          name: `Place selected item in ${item.categories.find((c) => c.id === token.category)!.label}`,
        })
        .focus();
      await user.keyboard("{Enter}");
    }
    screen.getByRole("button", { name: /Check answer/ }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("That’s right")).toBeInTheDocument();
  });
  it("places a selected step before a later step without shifting past it", async () => {
    const user = userEvent.setup();
    const item = domains
      .flatMap((d) => d.objectives.flatMap((o) => o.activities))
      .find((a) => a.type === "drag_order")!;
    render(<Harness item={item} />);
    const rows = screen.getAllByRole("listitem");
    const first = within(rows[0]).getByRole("button", { pressed: false });
    const text = first.textContent;
    await user.click(first);
    await user.click(
      within(rows[rows.length - 1]).getByRole("button", {
        name: "Place before",
      }),
    );
    const next = screen.getAllByRole("listitem");
    expect(
      within(next[next.length - 2]).getByRole("button", { pressed: false }),
    ).toHaveTextContent(text!);
  });
  it("completes step ordering using the keyboard move controls", async () => {
    const user = userEvent.setup();
    const item = domains
      .flatMap((d) => d.objectives.flatMap((o) => o.activities))
      .find((a) => a.type === "drag_order")!;
    if (item.type !== "drag_order") throw Error();
    render(<Harness item={item} />);
    for (const [target, step] of item.steps.entries()) {
      let position = screen
        .getAllByRole("listitem")
        .findIndex((row) =>
          within(row).queryByRole("button", { name: step.text }),
        );
      while (position > target) {
        screen.getByRole("button", { name: `Move ${step.text} up` }).focus();
        await user.keyboard("{Enter}");
        position--;
      }
    }
    screen.getByRole("button", { name: /Check answer/ }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("That’s right")).toBeInTheDocument();
  });
});
