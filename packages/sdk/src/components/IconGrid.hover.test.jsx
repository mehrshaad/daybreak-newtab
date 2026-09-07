import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IconGrid from "./IconGrid";

// What hovering an icon reveals, and in particular what "off" means.
//
// Turning the hover card off used to fall back to a tooltip of the address, so
// "off" still popped something up over the grid. That is not what off means to
// anybody who has just switched it off, and it was reported as exactly that.
// Two states could not express it — a card, a tooltip, or nothing is three.

const ITEMS = [{ key: "a", name: "GitHub", title: "https://github.com" }];

// useTooltip waits before revealing, the same restraint a native title has.
const SHOW_DELAY = 400;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

function hover() {
  fireEvent.mouseEnter(screen.getByRole("button", { name: "GitHub" }));
  act(() => {
    vi.advanceTimersByTime(SHOW_DELAY + 50);
  });
}

describe("what hovering an icon reveals", () => {
  it("shows the address as a tooltip by default", () => {
    // Google Apps and Bookmarks rely on this: their items have no detail worth
    // a card, and the name under a truncated label is worth having.
    render(<IconGrid items={ITEMS} cols={4} iconSize={40} />);
    hover();
    expect(screen.queryByText("https://github.com")).toBeTruthy();
  });

  it("shows nothing at all when hover is off", () => {
    // The fix, called exactly the way the widgets call it: Quick Links and Top
    // Sites pass no hoverCard at all when the option is off. Passing one here
    // would make this pass for the wrong reason — the old code keyed the
    // tooltip off `hoverCard` being present, so a card function alone was
    // enough to suppress it. Verified by reinstating the old line and watching
    // this fail.
    render(<IconGrid items={ITEMS} cols={4} iconSize={40} hover="none" />);
    hover();
    expect(screen.queryByText("https://github.com")).toBeNull();
    expect(screen.queryByText("a card")).toBeNull();
  });

  it("shows nothing even when a card is available but hover is off", () => {
    render(
      <IconGrid
        items={ITEMS}
        cols={4}
        iconSize={40}
        hover="none"
        hoverCard={() => <div>a card</div>}
      />
    );
    hover();
    expect(screen.queryByText("https://github.com")).toBeNull();
    expect(screen.queryByText("a card")).toBeNull();
  });

  it("shows the card, and not also a tooltip, when hover is a card", () => {
    // Both at once would be two panels over one icon.
    render(
      <IconGrid
        items={ITEMS}
        cols={4}
        iconSize={40}
        hover="card"
        hoverCard={() => <div>a card</div>}
      />
    );
    hover();
    expect(screen.queryByText("a card")).toBeTruthy();
    expect(screen.queryByText("https://github.com")).toBeNull();
  });

  it("falls back to the tooltip when a card is asked for but none is given", () => {
    // A caller that passes hover="card" with no hoverCard has nothing to draw,
    // and silently revealing nothing would look like a broken setting.
    render(<IconGrid items={ITEMS} cols={4} iconSize={40} hoverCard={undefined} />);
    hover();
    expect(screen.queryByText("https://github.com")).toBeTruthy();
  });
});
