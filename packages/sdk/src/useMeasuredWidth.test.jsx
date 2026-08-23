import { StrictMode } from "react";
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

// The observer that is currently doing the work. Several can be created over a
// component's life — a keyed swap replaces one, and StrictMode's double mount
// makes a spare — so what matters is that exactly one is still live and that it
// is watching the node on screen.
const live = () => observers.filter((o) => !o.disconnected);

function Probe({ fallback }) {
  const [ref, measured] = useMeasuredWidth();
  return (
    <div ref={ref} data-testid="box">
      {measured == null ? `fallback:${fallback}` : `measured:${Math.round(measured)}`}
    </div>
  );
}

// A measured element carrying a key, the shape that broke it the first time.
function Keyed({ mode }) {
  const [ref, measured] = useMeasuredWidth();
  return (
    <div key={mode} ref={ref} data-testid="box">
      {measured == null ? "fallback" : `measured:${Math.round(measured)}`}
    </div>
  );
}

// A measured element inside another, the shape that broke it the second time.
function Inner() {
  const [ref, measured] = useMeasuredWidth();
  return (
    <div ref={ref} data-testid="inner">
      {measured == null ? "fallback" : `measured:${Math.round(measured)}`}
    </div>
  );
}

function Nested() {
  const [ref, measured] = useMeasuredWidth();
  return (
    <div ref={ref} data-testid="outer">
      {measured == null ? "fallback" : `measured:${Math.round(measured)}`}
      <Inner />
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

  // Both of the following are regressions. This hook has broken twice, each
  // time silently: the widget just kept drawing its pre-measurement fallback,
  // which looks like a styling opinion rather than a dead observer.

  it("follows the element when a key swaps it out", () => {
    // Widgets put a key on the very element they measure so a mode change
    // crossfades — the clock does it for analog, seconds and the date line.
    // The first version observed from a mount effect, so after a swap it was
    // left watching a detached node and the measurement froze forever.
    const { rerender } = render(<Keyed mode="a" />);
    act(() => live()[0].send(300));
    expect(screen.getByTestId("box").textContent).toBe("measured:300");

    rerender(<Keyed mode="b" />);
    const current = live();
    expect(current).toHaveLength(1);
    expect(current[0].targets[0]).toBe(screen.getByTestId("box"));

    act(() => current[0].send(520));
    expect(screen.getByTestId("box").textContent).toBe("measured:520");
  });

  it("still measures under StrictMode, nested as well as top level", () => {
    // StrictMode runs every effect setup, cleanup, setup again, while a
    // callback ref is attached and re-attached in a separate pass. An unmount
    // effect that disconnected the observer raced that: for a nested component
    // the disconnect landed on the live observer and nothing re-created it, so
    // the analog clock face measured nothing and drew nothing at all, while its
    // own parent measured fine and looked healthy.
    render(
      <StrictMode>
        <Nested />
      </StrictMode>
    );

    const current = live();
    expect(current).toHaveLength(2);
    const nodes = current.map((o) => o.targets[0]);
    expect(nodes).toContain(screen.getByTestId("outer"));
    expect(nodes).toContain(screen.getByTestId("inner"));

    act(() => current.forEach((o) => o.send(404)));
    expect(screen.getByTestId("outer").textContent).toContain("measured:404");
    expect(screen.getByTestId("inner").textContent).toBe("measured:404");
  });

  it("keeps the fallback where there is no ResizeObserver at all", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    render(<Probe fallback="wide" />);
    expect(screen.getByTestId("box").textContent).toBe("fallback:wide");
  });
});
