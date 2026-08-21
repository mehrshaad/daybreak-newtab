import { describe, expect, it } from "vitest";
import { IDLE, phaseLength, remainingOf, resumeFrom } from "./phases";

const NOW = 1_760_000_000_000;
const focus = phaseLength({ phase: "Focus", longFocus: false });

describe("remainingOf", () => {
  it("measures a running phase from its deadline, not from a stored count", () => {
    expect(remainingOf({ phase: "Focus", endsAt: NOW + 60_000 }, NOW)).toBeCloseTo(60, 5);
  });

  it("never goes negative once the deadline has passed", () => {
    expect(remainingOf({ phase: "Focus", endsAt: NOW - 60_000 }, NOW)).toBe(0);
  });

  it("uses the held value for a paused phase", () => {
    expect(remainingOf({ phase: "Focus", endsAt: null, left: 412 }, NOW)).toBe(412);
  });

  it("falls back to the phase's full length with nothing stored", () => {
    expect(remainingOf(null, NOW, false)).toBe(focus);
  });
});

describe("resumeFrom", () => {
  it("starts fresh when nothing was stored", () => {
    expect(resumeFrom(null, NOW)).toEqual({ ...IDLE, running: false });
  });

  it("carries on a run that is still going", () => {
    const state = { phase: "Focus", round: 2, endsAt: NOW + 90_000 };
    const out = resumeFrom(state, NOW, { longFocus: false });
    expect(out.running).toBe(true);
    expect(out.phase).toBe("Focus");
    expect(out.round).toBe(2);
    expect(out.left).toBeCloseTo(90, 5);
  });

  it("keeps a paused run exactly where it was left", () => {
    const state = { phase: "Break", round: 3, endsAt: null, left: 120 };
    const out = resumeFrom(state, NOW, { longFocus: false });
    expect(out).toMatchObject({ phase: "Break", round: 3, running: false, left: 120 });
  });

  it("advances one phase when the deadline passed while away", () => {
    const state = { phase: "Focus", round: 1, endsAt: NOW - 5_000 };
    const out = resumeFrom(state, NOW, { longFocus: false });
    expect(out.phase).toBe("Break");
    expect(out.round).toBe(1);
    expect(out.finishedWhileAway).toBe(true);
    expect(out.left).toBe(phaseLength({ phase: "Break" }));
  });

  it("advances only once, however long the browser was shut", () => {
    // A week away is not four hundred rounds of progress.
    const state = { phase: "Focus", round: 1, endsAt: NOW - 7 * 24 * 3600 * 1000 };
    const out = resumeFrom(state, NOW, { longFocus: false });
    expect(out.phase).toBe("Break");
    expect(out.round).toBe(1);
  });

  it("does not auto-start a break that is already half over", () => {
    const state = { phase: "Focus", round: 1, endsAt: NOW - 60_000 };
    const out = resumeFrom(state, NOW, { longFocus: false, autoStart: true });
    expect(out.running).toBe(false);
    expect(out.autoStartWanted).toBe(true);
  });

  it("gives the fourth round a long break", () => {
    const state = { phase: "Focus", round: 4, endsAt: NOW - 1 };
    expect(resumeFrom(state, NOW, {}).phase).toBe("Long break");
  });
});
