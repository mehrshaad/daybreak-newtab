import { describe, expect, it } from "vitest";
import { MIN_SCROLLABLE, nextScrolled } from "./useKeyboard";

// Plenty of page to scroll, so these cases exercise the thresholds alone.
const next = (was, y, on = 24, off = 6) => nextScrolled(was, y, 4000, on, off);

describe("condensed-header hysteresis", () => {
  it("engages only past the upper threshold", () => {
    expect(next(false, 10)).toBe(false);
    expect(next(false, 24)).toBe(false);
    expect(next(false, 25)).toBe(true);
  });

  it("stays engaged between the thresholds", () => {
    expect(next(true, 10)).toBe(true);
    expect(next(true, 7)).toBe(true);
  });

  it("releases only below the lower threshold", () => {
    expect(next(true, 6)).toBe(false);
    expect(next(true, 0)).toBe(false);
  });

  // The actual bug: a single threshold means small scroll positions oscillate,
  // because condensing the header changes page height and can push the scroll
  // position back across the line. Two thresholds give it a stable band.
  it("does not oscillate when resting near the boundary", () => {
    let state = false;
    const seen = new Set();
    // Jitter around the old single threshold of 10.
    for (const y of [11, 9, 11, 9, 11, 9, 11, 9]) {
      state = next(state, y);
      seen.add(state);
    }
    expect(seen).toEqual(new Set([false]));
  });

  it("a genuine scroll down then back to the top still toggles", () => {
    let state = next(false, 200);
    expect(state).toBe(true);
    state = next(state, 0);
    expect(state).toBe(false);
  });

  // Condensing shortens the page. If that wipes out the only overflow there
  // was, the scroll position returns to 0 and the header expands again — a loop
  // hysteresis cannot break, because the position genuinely is 0 each time.
  it("never condenses a page that has barely anything to scroll", () => {
    expect(nextScrolled(false, 30, MIN_SCROLLABLE - 1)).toBe(false);
    expect(nextScrolled(true, 30, MIN_SCROLLABLE - 1)).toBe(false);
    expect(nextScrolled(false, 30, MIN_SCROLLABLE)).toBe(true);
  });
});
