import { describe, expect, it } from "vitest";
import { QUOTES, dayOfYear, quoteForDay } from "./quotes";

describe("dayOfYear", () => {
  it("counts from 1 on January 1st", () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
  });

  it("counts the last day of a common year as 365", () => {
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365);
  });

  it("handles a leap year", () => {
    expect(dayOfYear(new Date(2028, 11, 31))).toBe(366);
    expect(dayOfYear(new Date(2028, 1, 29))).toBe(60);
  });

  // Local-midnight arithmetic in a DST-shifting zone can otherwise land a day
  // off; the UTC normalisation in dayOfYear is what prevents that.
  it("is stable across a DST boundary", () => {
    const before = dayOfYear(new Date(2026, 2, 7));
    const after = dayOfYear(new Date(2026, 2, 9));
    expect(after - before).toBe(2);
  });
});

describe("quoteForDay", () => {
  it("returns the same quote all day", () => {
    const morning = quoteForDay(new Date(2026, 5, 12, 8, 0));
    const night = quoteForDay(new Date(2026, 5, 12, 23, 30));
    expect(morning).toEqual(night);
  });

  it("changes from one day to the next", () => {
    const a = quoteForDay(new Date(2026, 5, 12));
    const b = quoteForDay(new Date(2026, 5, 13));
    expect(a).not.toEqual(b);
  });

  it("always returns a complete quote", () => {
    for (let d = 0; d < 366; d += 1) {
      const q = quoteForDay(new Date(2028, 0, 1 + d));
      expect(q.text).toBeTruthy();
      expect(q.author).toBeTruthy();
    }
  });

  it("cycles through the whole bundle over a year", () => {
    const seen = new Set();
    for (let d = 0; d < 365; d += 1) {
      seen.add(quoteForDay(new Date(2026, 0, 1 + d)).text);
    }
    expect(seen.size).toBe(QUOTES.length);
  });
});
