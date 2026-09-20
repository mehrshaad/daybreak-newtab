import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Popover } from "@daybreak/sdk";
import { Drawer } from "./primitives";

// A popup opened from inside the settings drawer, and the click that used to
// close the drawer out from under it.
//
// Every floating surface portals to <body> so no ancestor can clip it, which
// puts it outside the drawer's panel in the only sense the DOM knows about.
// The drawer dismisses on a capture-phase pointer event on `document`, so it
// read a click on a city suggestion, a date or a folder as a click on the page
// behind it: the drawer closed, and where the popup belonged to the drawer it
// was unmounted in the middle of being used.
//
// Reproduced on the board before this was written — World Clocks settings
// open, "Add a city", type, click a suggestion: Kyoto was added and the drawer
// went with it.
//
// Capture phase is why the popups could not fix this themselves: Popover does
// call stopPropagation, but React attaches at the root container and the
// drawer's listener has already run.

function Harness({ onClose, popoverOpen }) {
  const anchorRef = useRef(null);
  const tileRef = useRef(null);
  return (
    <>
      <div ref={tileRef} data-testid="tile">
        a widget
      </div>
      <Drawer open onClose={onClose} label="Widget settings" keepInteractive={() => tileRef.current}>
        <button type="button" ref={anchorRef}>
          Pick a date
        </button>
        <Popover open={popoverOpen} anchorRef={anchorRef} onClose={() => {}}>
          <button type="button">the 14th</button>
        </Popover>
      </Drawer>
      <div data-testid="elsewhere">the board</div>
    </>
  );
}

describe("clicking a popup that belongs to the drawer", () => {
  it("leaves the drawer open", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} popoverOpen />);
    fireEvent.mouseDown(screen.getByText("the 14th"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not swallow the event, so the popup's own control still works", () => {
    // The drawer called preventDefault on every outside mousedown. Even with
    // the close suppressed that alone breaks a popup: preventing the default
    // on mousedown is exactly what stops focus landing in a text field.
    const onClose = vi.fn();
    render(<Harness onClose={onClose} popoverOpen />);
    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    screen.getByText("the 14th").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("still closes on a click that really is outside", () => {
    // The guard has to be narrow. A click on the board is still a dismissal,
    // and a test that only proved the first case would pass with the dismiss
    // deleted entirely.
    const onClose = vi.fn();
    render(<Harness onClose={onClose} popoverOpen />);
    fireEvent.mouseDown(screen.getByTestId("elsewhere"));
    expect(onClose).toHaveBeenCalled();
  });

  it("still leaves the configured widget's own tile live", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} popoverOpen />);
    fireEvent.mouseDown(screen.getByTestId("tile"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes on a click inside the drawer's own panel doing nothing", () => {
    // Not a dismissal: a click on the panel is inside it.
    const onClose = vi.fn();
    render(<Harness onClose={onClose} popoverOpen />);
    fireEvent.mouseDown(screen.getByText("Pick a date"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
