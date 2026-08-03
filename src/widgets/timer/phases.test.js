import { describe, expect, it } from "vitest";
import { formatClock, nextPhase, phaseLength } from "./phases";

describe("phaseLength", () => {
  it("uses 25 or 50 minutes for focus", () => {
    expect(phaseLength({ phase: "Focus", longFocus: false })).toBe(1500);
    expect(phaseLength({ phase: "Focus", longFocus: true })).toBe(3000);
  });

  it("uses 5 for short breaks and 15 for long", () => {
    expect(phaseLength({ phase: "Break" })).toBe(300);
    expect(phaseLength({ phase: "Long break" })).toBe(900);
  });
});

describe("nextPhase", () => {
  it("alternates focus and break", () => {
    expect(nextPhase("Focus", 1)).toEqual({ phase: "Break", round: 1 });
    expect(nextPhase("Break", 1)).toEqual({ phase: "Focus", round: 2 });
  });

  it("gives a long break after every fourth focus round", () => {
    expect(nextPhase("Focus", 4)).toEqual({ phase: "Long break", round: 4 });
    expect(nextPhase("Focus", 8)).toEqual({ phase: "Long break", round: 8 });
    expect(nextPhase("Focus", 3)).toEqual({ phase: "Break", round: 3 });
  });

  it("returns to focus and increments after a long break", () => {
    expect(nextPhase("Long break", 4)).toEqual({ phase: "Focus", round: 5 });
  });

  it("runs a full eight-round cycle in the expected order", () => {
    let state = { phase: "Focus", round: 1 };
    const seen = [state.phase];
    for (let i = 0; i < 8; i += 1) {
      state = nextPhase(state.phase, state.round);
      seen.push(state.phase);
    }
    expect(seen).toEqual([
      "Focus",
      "Break",
      "Focus",
      "Break",
      "Focus",
      "Break",
      "Focus",
      "Long break",
      "Focus",
    ]);
  });
});

describe("formatClock", () => {
  it("pads to mm:ss", () => {
    expect(formatClock(1500)).toBe("25:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(9)).toBe("00:09");
  });

  it("never renders a negative clock", () => {
    expect(formatClock(-5)).toBe("00:00");
  });

  it("handles times over an hour without breaking format", () => {
    expect(formatClock(3600)).toBe("60:00");
  });
});
