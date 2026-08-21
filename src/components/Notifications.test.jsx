import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NoticeContext } from "../core/noticeContext";
import { makeNotice } from "../core/notices";
import Notifications from "./Notifications";

// The queue's own arithmetic is covered in core/notices.test.js. What is worth
// asserting here is the behaviour that only exists once it is on screen: that
// hovering stops the countdown, that the action runs and then closes, and that
// edit mode hides the whole stack.

function show(notices, { dismiss = vi.fn(), freeze = vi.fn(), hidden = false } = {}) {
  const value = { notices, notify: vi.fn(), dismiss, freeze };
  render(
    <NoticeContext.Provider value={value}>
      <Notifications hidden={hidden} />
    </NoticeContext.Provider>
  );
  return { dismiss, freeze };
}

describe("Notifications", () => {
  it("renders nothing when there is nothing to say", () => {
    show([]);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders nothing in edit mode, where the presets dock sits", () => {
    show([makeNotice({ message: "Widgets rearranged" })], { hidden: true });
    expect(screen.queryByText("Widgets rearranged")).toBeNull();
  });

  it("shows the message", () => {
    show([makeNotice({ message: "Backup restored" })]);
    expect(screen.getByText("Backup restored")).toBeTruthy();
  });

  it("stacks more than one", () => {
    show([makeNotice({ message: "first" }), makeNotice({ message: "second" })]);
    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.getByText("second")).toBeTruthy();
  });

  it("freezes on hover and thaws on leave", () => {
    const notice = makeNotice({ message: "hold me" });
    const { freeze } = show([notice]);
    const card = screen.getByRole("status");

    fireEvent.mouseEnter(card);
    expect(freeze).toHaveBeenCalledWith(notice.id, true);

    fireEvent.mouseLeave(card);
    expect(freeze).toHaveBeenCalledWith(notice.id, false);
  });

  it("freezes while held down, for a pointer that never hovers", () => {
    const notice = makeNotice({ message: "hold me" });
    const { freeze } = show([notice]);
    const card = screen.getByRole("status");

    fireEvent.pointerDown(card);
    expect(freeze).toHaveBeenCalledWith(notice.id, true);
    fireEvent.pointerUp(card);
    expect(freeze).toHaveBeenCalledWith(notice.id, false);
  });

  it("runs the action and then closes itself", () => {
    const run = vi.fn();
    const notice = makeNotice({ message: "Clock removed", action: { label: "Undo", run } });
    const { dismiss } = show([notice]);

    fireEvent.click(screen.getByText("Undo"));
    expect(run).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledWith(notice.id);
  });

  it("closes on the dismiss button", () => {
    const notice = makeNotice({ message: "Saved" });
    const { dismiss } = show([notice]);

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(dismiss).toHaveBeenCalledWith(notice.id);
  });

  it("draws the countdown as a share of the width, and not at all when sticky", () => {
    const { unmount } = render(
      <NoticeContext.Provider
        value={{ notices: [{ ...makeNotice({ message: "half" }), remaining: 0.5 }], notify: vi.fn(), dismiss: vi.fn(), freeze: vi.fn() }}
      >
        <Notifications />
      </NoticeContext.Provider>
    );
    const bar = screen.getByRole("status").querySelector('span[aria-hidden="true"]');
    expect(bar.style.width).toBe("50%");
    unmount();

    show([makeNotice({ message: "sticky", duration: 0 })]);
    expect(screen.getByRole("status").querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it("speaks up assertively only for errors", () => {
    show([makeNotice({ message: "Widget failed", category: "error" })]);
    expect(screen.getByRole("alert").getAttribute("aria-live")).toBe("assertive");
  });

  it("uses a polite status for a confirmation", () => {
    show([makeNotice({ message: "Saved", category: "info" })]);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });
});
