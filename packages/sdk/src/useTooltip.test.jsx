import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Tooltip from "./components/Tooltip";
import { useTooltip } from "./useTooltip";

// Each of these reproduces a way the tooltip used to get stuck on screen. They
// all share one cause: onMouseLeave never fired, because the element the
// pointer was over stopped existing rather than being left.

function Harness({ label = "Drag to move", swap = false }) {
  const tip = useTooltip(label);
  return (
    <>
      {swap ? (
        // Standing in for EditableText, which replaces its span with an input
        // on double-click — the anchor the pointer was over is simply gone.
        <input aria-label="editing" />
      ) : (
        <button ref={tip.anchorRef} type="button" {...tip.anchorProps}>
          anchor
        </button>
      )}
      <Tooltip {...tip} />
    </>
  );
}

function Swappable() {
  const [swap, setSwap] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setSwap(true)}>
        swap
      </button>
      <Harness swap={swap} />
    </>
  );
}

const openIt = () => {
  fireEvent.mouseEnter(screen.getByText("anchor"));
  act(() => {
    vi.advanceTimersByTime(500);
  });
};

// Tooltip keeps itself mounted for a 120ms exit animation, so "gone" has to be
// asked for after that has run rather than on the same tick.
const settle = () =>
  act(() => {
    vi.advanceTimersByTime(300);
  });

const shown = () => screen.queryByText("Drag to move");

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTooltip", () => {
  it("waits before showing, so a quick pass-through does not flash it", () => {
    render(<Harness />);
    fireEvent.mouseEnter(screen.getByText("anchor"));
    settle();
    expect(shown()).toBeNull();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(shown()).toBeTruthy();
  });

  it("closes on mouseleave, as it always did", () => {
    render(<Harness />);
    openIt();
    fireEvent.mouseLeave(screen.getByText("anchor"));
    settle();
    expect(shown()).toBeNull();
  });

  // The remaining guard — "the pointer is no longer over the anchor although it
  // never left it" — cannot be expressed here: jsdom answers matches(":hover")
  // with true for any element, whatever the pointer has done, so the check can
  // never fail in this environment. That path is verified in Chrome instead.
  // What *is* covered below is the same guard reached through isConnected,
  // which is the case that actually bit: the anchor being replaced.

  it("closes when the anchor is swapped out from under the pointer", () => {
    // The double-click case: a span becomes an input and the old node is gone.
    render(<Swappable />);
    openIt();
    expect(shown()).toBeTruthy();
    fireEvent.click(screen.getByText("swap"));
    fireEvent.mouseMove(document.body);
    settle();
    expect(shown()).toBeNull();
  });

  it("closes on a press anywhere", () => {
    render(<Harness />);
    openIt();
    fireEvent.pointerDown(document.body);
    settle();
    expect(shown()).toBeNull();
  });

  it("closes on a keystroke", () => {
    render(<Harness />);
    openIt();
    fireEvent.keyDown(document.body, { key: "Escape" });
    settle();
    expect(shown()).toBeNull();
  });

  it("closes when the window loses focus", () => {
    render(<Harness />);
    openIt();
    fireEvent.blur(window);
    settle();
    expect(shown()).toBeNull();
  });

  it("cancels a reveal that is still counting down", () => {
    render(<Harness />);
    fireEvent.mouseEnter(screen.getByText("anchor"));
    // Pressing during the delay must not leave a tooltip to appear afterwards.
    fireEvent.pointerDown(document.body);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    settle();
    expect(shown()).toBeNull();
  });

  it("stays shut when the label is taken away mid-hover", () => {
    // What the drag handle does: it drops its label for the length of a drag.
    const { rerender } = render(<Harness label="Drag to move" />);
    openIt();
    expect(shown()).toBeTruthy();
    rerender(<Harness label={null} />);
    settle();
    expect(shown()).toBeNull();
  });
});
