import { describe, expect, it } from "vitest";
import { nextScrolled } from "./useKeyboard";

const next = nextScrolled;

// Condensing the header shortens the document, and scroll anchoring drags the
// scroll position down by about as much. Measured at 25px in Chrome.
const ANCHOR_SLIDE = 25;

describe("condensed-header hysteresis", () => {
  it("engages only past the upper threshold", () => {
    expect(next(false, 10)).toBe(false);
    expect(next(false, 48)).toBe(false);
    expect(next(false, 49)).toBe(true);
  });

  it("stays engaged between the thresholds", () => {
    expect(next(true, 40)).toBe(true);
    expect(next(true, 13)).toBe(true);
  });

  it("releases only below the lower threshold", () => {
    expect(next(true, 12)).toBe(false);
    expect(next(true, 0)).toBe(false);
  });

  // The real defect: condensing drags the scroll position down, so the band has
  // to be wider than that slide in both directions.
  it("survives the scroll position sliding when it engages", () => {
    // Engaged at the earliest position that can engage...
    let state = next(false, 49);
    expect(state).toBe(true);
    // ...and the slide must not push it back under the release point.
    state = next(state, 49 - ANCHOR_SLIDE);
    expect(state).toBe(true);
  });

  it("survives the scroll position sliding when it releases", () => {
    // Released at the latest position that can release, the document grows again
    // and the position is pushed back up; that must not re-engage it.
    let state = next(true, 12);
    expect(state).toBe(false);
    state = next(state, 12 + ANCHOR_SLIDE);
    expect(state).toBe(false);
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

  // Walking the whole danger zone: at every position, engaging and then sliding
  // must settle rather than flip forever.
  it("settles everywhere in the range the slide can reach", () => {
    for (let start = 0; start <= 90; start += 1) {
      let state = false;
      let y = start;
      const seenAt = new Map();
      for (let step = 0; step < 12; step += 1) {
        const before = state;
        state = next(state, y);
        if (state !== before) y += state ? -ANCHOR_SLIDE : ANCHOR_SLIDE;
        const seen = seenAt.get(y);
        // Same position, same state, twice: settled.
        if (seen === state) break;
        seenAt.set(y, state);
        if (step === 11) throw new Error(`never settled from y=${start}`);
      }
    }
  });

  it("a genuine scroll down then back to the top still toggles", () => {
    let state = next(false, 200);
    expect(state).toBe(true);
    state = next(state, 0);
    expect(state).toBe(false);
  });

  // A page that can only just scroll cannot reach the engage threshold at all,
  // so it never condenses and never starts the loop.
  it("cannot engage on a page with less overflow than the threshold", () => {
    expect(next(false, 40)).toBe(false);
  });
});
