import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Clock from "./Widget";

// One behaviour: the clock decides how to write its date from how wide it
// actually is, not from how many grid columns it spans.
//
// A two-column tile is 210px on the default board and 366px on a full-width
// one. The span rule called both narrow, so a clock with room for
// "Friday, August 21" wrote "Fri, Aug 21" anyway. Nothing caught it, because a
// test written at the time would have been written against the span too.
//
// ResizeObserver is stubbed because jsdom has neither it nor layout. It is also
// the only way to test this: a real ResizeObserver delivers on the frame
// lifecycle, which does not run in a background tab, so a widget measured
// through browser automation only ever shows the fallback.

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

  disconnect() {}

  send(width) {
    this.callback([{ contentRect: { width }, target: this.targets[0] }]);
  }
}

const OPTIONS = {
  analog: false,
  seconds: false,
  hideDate: false,
  hour24: false,
  align: "left",
  face: "round",
  dialDate: false,
  accentFace: false,
};

function mount({ size = [2, 2] } = {}) {
  render(<Clock options={OPTIONS} size={size} config={{}} setConfig={() => {}} />);
}

// The innermost element holding the date. Every ancestor's text contains it too,
// so the last match in document order is the one that is only the date. An
// earlier version of this took the first match and compared against text that
// had the time stuck to the front of it.
function dateLine() {
  const matches = screen.getAllByText(/Aug/);
  return matches[matches.length - 1].textContent;
}

// The assertion is about the form, not the exact string: Intl decides the word
// order from the locale, so "Fri 21 Aug" and "Fri, Aug 21" are the same answer,
// and what this widget chooses is only whether to abbreviate.
function abbreviated() {
  return !/Friday/.test(dateLine());
}

describe("the clock's date line", () => {
  beforeEach(() => {
    observers = [];
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    // A fixed instant, so the assertions are about the format rather than
    // whatever day the suite happens to run on.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 21, 21, 55));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("abbreviates in a genuinely narrow tile", () => {
    mount({ size: [2, 2] });
    act(() => observers[0].send(210));
    expect(abbreviated()).toBe(true);
    expect(dateLine()).toMatch(/Aug/);
  });

  it("writes it out in full when the same span is actually wide", () => {
    // Same two-column span, on a full-width board. This is the case the span
    // rule got wrong, and the whole reason for measuring.
    mount({ size: [2, 2] });
    act(() => observers[0].send(366));
    expect(abbreviated()).toBe(false);
    expect(dateLine()).toMatch(/August/);
  });

  it("falls back to the span before any measurement arrives", () => {
    // No flicker through the wrong layout on the first frame: with nothing
    // measured yet, a two-column span still reads as narrow.
    mount({ size: [2, 2] });
    expect(abbreviated()).toBe(true);
  });

  it("changes its mind when the tile is resized", () => {
    mount({ size: [2, 2] });
    act(() => observers[0].send(210));
    expect(abbreviated()).toBe(true);
    act(() => observers[0].send(575));
    expect(abbreviated()).toBe(false);
    act(() => observers[0].send(180));
    expect(abbreviated()).toBe(true);
  });

  it("still shows the time", () => {
    mount();
    // The separator is Intl's business and differs between jsdom and Chrome, so
    // this asserts the digits are on screen rather than the format.
    expect(screen.getAllByText(/9[:.]55/).length).toBeGreaterThan(0);
  });
});
