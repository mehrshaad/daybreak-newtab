import { describe, expect, it } from "vitest";
import { lastNDays, streakFor, toggleDay } from "./streak";

const today = new Date(2026, 7, 10); // 2026-08-10

describe("lastNDays", () => {
  it("ends on today and runs oldest first", () => {
    expect(lastNDays(7, today)).toEqual([
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
      "2026-08-09",
      "2026-08-10",
    ]);
  });

  it("crosses a month boundary", () => {
    expect(lastNDays(3, new Date(2026, 8, 1))).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });

  it("crosses a year boundary", () => {
    expect(lastNDays(2, new Date(2027, 0, 1))).toEqual(["2026-12-31", "2027-01-01"]);
  });
});

describe("streakFor", () => {
  it("counts consecutive days ending today", () => {
    const history = { "2026-08-08": true, "2026-08-09": true, "2026-08-10": true };
    expect(streakFor(history, today)).toBe(3);
  });

  // Otherwise every streak would read zero until the user ticks today's box.
  it("survives today being unmarked", () => {
    const history = { "2026-08-08": true, "2026-08-09": true };
    expect(streakFor(history, today)).toBe(2);
  });

  it("breaks on a genuine gap", () => {
    const history = { "2026-08-06": true, "2026-08-07": true, "2026-08-09": true };
    expect(streakFor(history, today)).toBe(1);
  });

  it("is zero with no history at all", () => {
    expect(streakFor({}, today)).toBe(0);
    expect(streakFor(null, today)).toBe(0);
    expect(streakFor(undefined, today)).toBe(0);
  });

  it("is zero when the most recent entry is two days old", () => {
    expect(streakFor({ "2026-08-08": true }, today)).toBe(0);
  });

  it("counts a long run across a month boundary", () => {
    const history = {};
    for (let d = 28; d <= 31; d += 1) history[`2026-07-${d}`] = true;
    for (let d = 1; d <= 10; d += 1) {
      history[`2026-08-${String(d).padStart(2, "0")}`] = true;
    }
    expect(streakFor(history, today)).toBe(14);
  });
});

describe("toggleDay", () => {
  it("adds and removes without mutating the original", () => {
    const history = { "2026-08-09": true };
    const on = toggleDay(history, "2026-08-10");
    expect(on["2026-08-10"]).toBe(true);
    expect(history["2026-08-10"]).toBeUndefined();

    const off = toggleDay(on, "2026-08-10");
    expect(off["2026-08-10"]).toBeUndefined();
    expect(off["2026-08-09"]).toBe(true);
  });

  it("handles an empty starting history", () => {
    expect(toggleDay(null, "2026-08-10")).toEqual({ "2026-08-10": true });
  });
});
