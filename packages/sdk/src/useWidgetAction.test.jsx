import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWidgetAction } from "./useWidgetAction";

function Probe({ action, name, onFire }) {
  useWidgetAction(action, name, onFire);
  return null;
}

describe("useWidgetAction", () => {
  it("does nothing until the menu asks", () => {
    const onFire = vi.fn();
    render(<Probe action={undefined} name="add" onFire={onFire} />);
    expect(onFire).not.toHaveBeenCalled();
  });

  it("fires once when the nonce arrives", () => {
    const onFire = vi.fn();
    const { rerender } = render(<Probe action={undefined} name="add" onFire={onFire} />);
    rerender(<Probe action={{ name: "add", nonce: 1 }} name="add" onFire={onFire} />);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("fires again each time the item is picked", () => {
    // The reason this is a counter and not a boolean. Picking "Add a city"
    // five times has to open the form five times, and a boolean would still be
    // true from the first one.
    const onFire = vi.fn();
    const { rerender } = render(
      <Probe action={{ name: "add", nonce: 1 }} name="add" onFire={onFire} />
    );
    rerender(<Probe action={{ name: "add", nonce: 2 }} name="add" onFire={onFire} />);
    rerender(<Probe action={{ name: "add", nonce: 3 }} name="add" onFire={onFire} />);
    expect(onFire).toHaveBeenCalledTimes(3);
  });

  it("does not fire again on an unrelated re-render", () => {
    // Where a boolean would have gone wrong: the widget re-renders constantly
    // (every tick, every option change), and reopening the add form on each
    // one would make the widget unusable.
    const onFire = vi.fn();
    const { rerender } = render(
      <Probe action={{ name: "add", nonce: 1 }} name="add" onFire={onFire} />
    );
    const action = { name: "add", nonce: 1 };
    rerender(<Probe action={action} name="add" onFire={onFire} />);
    rerender(<Probe action={action} name="add" onFire={onFire} />);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("ignores an action meant for something else", () => {
    const onFire = vi.fn();
    render(<Probe action={{ name: "refresh", nonce: 4 }} name="add" onFire={onFire} />);
    expect(onFire).not.toHaveBeenCalled();
  });

  it("calls the handler it has now, not the one it mounted with", () => {
    // The handler closes over widget state, so an effect that captured the
    // first one would add to a stale list.
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Probe action={undefined} name="add" onFire={first} />);
    rerender(<Probe action={{ name: "add", nonce: 1 }} name="add" onFire={second} />);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
