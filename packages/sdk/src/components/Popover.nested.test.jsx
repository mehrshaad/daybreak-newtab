import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import Popover from "./Popover";
import Select from "./Select";

// A popover opened from inside another popover, and the click that used to
// close the outer one out from under it.
//
// Both portal to <body>, so the inner panel is outside the outer panel as far
// as the DOM can tell. The outer one dismissed on any pointerdown outside its
// own panel, so picking a folder in the Quick Links add form — a Select, which
// is a Popover — closed the whole form and threw away what had been typed.

function Harness({ onOuterClose, innerOpen = true }) {
  const outerAnchor = useRef(null);
  const innerAnchor = useRef(null);
  return (
    <>
      <button type="button" ref={outerAnchor}>
        open
      </button>
      <Popover open anchorRef={outerAnchor} onClose={onOuterClose}>
        <button type="button" ref={innerAnchor}>
          folder
        </button>
        <Popover open={innerOpen} anchorRef={innerAnchor} onClose={() => {}}>
          <button type="button">Work</button>
        </Popover>
      </Popover>
      <div data-testid="elsewhere">the board</div>
    </>
  );
}

describe("a popover inside a popover", () => {
  it("leaves the outer one open when the inner one is clicked", () => {
    const onOuterClose = vi.fn();
    render(<Harness onOuterClose={onOuterClose} />);
    fireEvent.pointerDown(screen.getByText("Work"));
    expect(onOuterClose).not.toHaveBeenCalled();
  });

  it("still closes the outer one on a click that really is outside", () => {
    const onOuterClose = vi.fn();
    render(<Harness onOuterClose={onOuterClose} />);
    fireEvent.pointerDown(screen.getByTestId("elsewhere"));
    expect(onOuterClose).toHaveBeenCalled();
  });

  it("closes only the inner one on Escape", () => {
    const onOuterClose = vi.fn();
    render(<Harness onOuterClose={onOuterClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOuterClose).not.toHaveBeenCalled();
  });

  it("closes the outer one on Escape once the inner one is shut", () => {
    const onOuterClose = vi.fn();
    render(<Harness onOuterClose={onOuterClose} innerOpen={false} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOuterClose).toHaveBeenCalled();
  });
});

// The real case: a Select with "New folder…" inside a popover form.
function Form({ onOuterClose }) {
  const anchor = useRef(null);
  const [folder, setFolder] = useState("");
  return (
    <>
      <button type="button" ref={anchor}>
        add
      </button>
      <Popover open anchorRef={anchor} onClose={onOuterClose}>
        <Select
          value={folder}
          options={[{ value: "", label: "No folder" }]}
          onChange={setFolder}
          onCreate={setFolder}
          createLabel="New folder…"
          ariaLabel="Folder"
        />
      </Popover>
    </>
  );
}

describe("creating a folder from a Select inside a popover", () => {
  it("keeps the form open through opening the list, New folder and typing", () => {
    const onOuterClose = vi.fn();
    render(<Form onOuterClose={onOuterClose} />);
    const combo = screen.getByRole("combobox", { name: "Folder" });
    fireEvent.pointerDown(combo);
    fireEvent.click(combo);
    const create = screen.getByText("New folder…");
    fireEvent.pointerDown(create);
    fireEvent.click(create);
    const field = screen.getByRole("textbox", { name: "New folder…" });
    fireEvent.pointerDown(field);
    fireEvent.change(field, { target: { value: "Work" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onOuterClose).not.toHaveBeenCalled();
  });
});
