import { describe, expect, it } from "vitest";
import { nextTheme, THEME_CYCLE, THEME_LABELS } from "./themeCycle";

describe("nextTheme", () => {
  it("rings back round to system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });

  it("reaches every state from every state", () => {
    // The point of the ring: no setting is a dead end. Three presses from
    // anywhere has to come back to where it started, having visited the rest.
    for (const start of THEME_CYCLE) {
      const seen = [];
      let at = start;
      for (let i = 0; i < THEME_CYCLE.length; i++) {
        at = nextTheme(at);
        seen.push(at);
      }
      expect(at).toBe(start);
      expect([...seen].sort()).toEqual([...THEME_CYCLE].sort());
    }
  });

  it("takes an unset or unknown value to the head of the ring", () => {
    expect(nextTheme(undefined)).toBe("system");
    expect(nextTheme("sepia")).toBe("system");
  });

  it("names every state it can be in", () => {
    for (const value of THEME_CYCLE) expect(THEME_LABELS[value]).toBeTruthy();
  });
});
