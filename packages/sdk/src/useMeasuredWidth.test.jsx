import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMeasuredWidth } from "./useMeasuredWidth";

// jsdom has no ResizeObserver and no layout, so it is stubbed: every instance
// registers itself here and a test can push a width through it. That is enough
// to test what this hook is for — reporting a width once it knows one, and
// saying it does not know yet before that.
//
// It is also the only way to test this at all. A real ResizeObserver delivers on
// the frame lifecycle, which does not run in a background tab, so a widget
// measured through a browser automation session never sees anything but the
// fallback. That cost me a confused twenty minutes; it is written down here so
// it costs nobody else one.
let observers = [];

class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
    observers.push(this);
  }

  observe(target) {
    this.targets.push(target);
  }

  disconnect() {
    this.disconnected = true;
  }

  send(width) {
    this.callback([{ contentRect: { width }, target: this.targets[0] }]);
  }
}

function Probe({ fallback }) {
  const [ref, measured] = useMeasuredWidth();
  return (
    <div ref={ref} data-testid="box">
      {measured == null ? `fallback:${fallback}` : `measured:${Math.round(measured)}`}
    </div>
  );
}

describe("useMeasuredWidth", () => {
  beforeEach(() => {
    observers = [];
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says it does not know yet, rather than guessing zero", () => {
    // The difference matters: a caller reading 0 would decide it is in the
    // narrowest layout there is and flicker out of it a frame later.
    render(<Probe fallback="wide" />);
    expect(screen.getByTestId("box").textContent).toBe("fallback:wide");
  });

  it("reports the width once it has one", () => {
    render(<Probe fallback="wide" />);
    act(() => observers[0].send(366));
    expect(screen.getByTestId("box").textContent).toBe("measured:366");
  });

  it("follows the element as it resizes", () => {
    render(<Probe fallback="wide" />);
    act(() => observers[0].send(210));
    expect(screen.getByTestId("box").textContent).toBe("measured:210");
    act(() => observers[0].send(575));
    expect(screen.getByTestId("box").textContent).toBe("measured:575");
  });

  it("observes the element it was given", () => {
    render(<Probe fallback="wide" />);
    expect(observers[0].targets[0]).toBe(screen.getByTestId("box"));
  });

  it("disconnects when it goes away", () => {
    const { unmount } = render(<Probe fallback="wide" />);
    unmount();
    expect(observers[0].disconnected).toBe(true);
  });

  it("keeps the fallback where there is no ResizeObserver at all", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    render(<Probe fallback="wide" />);
    expect(screen.getByTestId("box").textContent).toBe("fallback:wide");
  });
});
