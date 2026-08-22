import { describe, expect, it } from "vitest";
import { addMonths, monthGrid, weekdayLabels, WEEKDAY_LABELS } from "./monthGrid";

describe("monthGrid", () => {
  it("starts every row on Sunday", () => {
    const days = monthGrid(2026, 7); // August 2026
    for (let row = 0; row < 6; row += 1) {
      expect(days[row * 7].date.getDay()).toBe(0);
    }
  });

  it("always returns six full weeks", () => {
    expect(monthGrid(2026, 0)).toHaveLength(42); // January
    expect(monthGrid(2026, 1)).toHaveLength(42); // February, the short one
  });

  it("includes every day of the target month, marked inMonth", () => {
    const days = monthGrid(2026, 7); // August 2026 has 31 days
    const inMonth = days.filter((d) => d.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].iso).toBe("2026-08-01");
    expect(inMonth[inMonth.length - 1].iso).toBe("2026-08-31");
  });

  it("pads with adjacent months' days, marked outside the month", () => {
    const days = monthGrid(2026, 7);
    const leading = days.slice(0, days.findIndex((d) => d.inMonth));
    for (const d of leading) expect(d.inMonth).toBe(false);
    const trailing = days.slice(days.map((d) => d.inMonth).lastIndexOf(true) + 1);
    for (const d of trailing) expect(d.inMonth).toBe(false);
  });

  it("never skips or repeats a calendar day", () => {
    // February's grid runs into March, which can cross a DST transition —
    // comparing local Date objects directly would then see a 23-or-25-hour
    // "day". Diffing via Date.UTC on the same y/m/d fields sidesteps that: UTC
    // has no DST, so a real calendar gap is the only thing that shows up.
    const days = monthGrid(2026, 1);
    const isos = days.map((d) => d.iso);
    expect(new Set(isos).size).toBe(isos.length);
    const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    for (let i = 1; i < days.length; i += 1) {
      const gap = (utcDay(days[i].date) - utcDay(days[i - 1].date)) / 86400000;
      expect(gap).toBe(1);
    }
  });
});

describe("addMonths", () => {
  it("advances within a year", () => {
    expect(addMonths(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
  });

  it("wraps forward across a year boundary", () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("wraps backward across a year boundary", () => {
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("handles a jump of more than one month in either direction", () => {
    expect(addMonths(2026, 10, 4)).toEqual({ year: 2027, month: 2 });
    expect(addMonths(2026, 1, -3)).toEqual({ year: 2025, month: 10 });
  });

  it("is a no-op for a zero delta", () => {
    expect(addMonths(2026, 4, 0)).toEqual({ year: 2026, month: 4 });
  });
});

describe("a week that starts somewhere other than Sunday", () => {
  it("still gives six full weeks, whatever the start day", () => {
    for (const weekStart of [0, 1, 6]) {
      for (const month of [0, 1, 5, 11]) {
        const grid = monthGrid(2026, month, weekStart);
        expect(grid, `${month}/${weekStart}`).toHaveLength(42);
        // Every row is one week and the first cell of every row is the start
        // day, which is the property a grid is unreadable without.
        for (let row = 0; row < 6; row += 1) {
          expect(grid[row * 7].date.getDay(), `row ${row} of ${month}/${weekStart}`).toBe(weekStart);
        }
      }
    }
  });

  it("holds every day of the month, once, in order", () => {
    for (const weekStart of [0, 1, 6]) {
      const grid = monthGrid(2026, 1, weekStart);
      const inMonth = grid.filter((c) => c.inMonth).map((c) => c.date.getDate());
      // February 2026 has 28 days.
      expect(inMonth, String(weekStart)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
    }
  });

  it("reaches back a whole week, never zero, when the 1st is the start day", () => {
    // 1 February 2026 is a Sunday. With a Sunday start the first cell is the
    // 1st itself; the arithmetic must not reach back seven days and show a
    // leading week nobody asked for, nor reach back a negative amount.
    const sunday = monthGrid(2026, 1, 0);
    expect(sunday[0].date.getDate()).toBe(1);
    expect(sunday[0].inMonth).toBe(true);
    // With a Monday start the same month leads in with six days of January.
    const monday = monthGrid(2026, 1, 1);
    expect(monday[0].inMonth).toBe(false);
    expect(monday.filter((c) => !c.inMonth && c.date.getMonth() === 0)).toHaveLength(6);
  });

  it("defaults to Sunday, so the date picker is untouched", () => {
    expect(monthGrid(2026, 1)).toEqual(monthGrid(2026, 1, 0));
  });
});

describe("weekdayLabels", () => {
  it("rotates to match the start day", () => {
    expect(weekdayLabels(0)).toEqual(WEEKDAY_LABELS);
    expect(weekdayLabels(1)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
    expect(weekdayLabels(6)).toEqual(["S", "S", "M", "T", "W", "T", "F"]);
  });

  it("always gives seven, and copes with nonsense", () => {
    for (const start of [0, 1, 6, 7, 13, -1]) expect(weekdayLabels(start)).toHaveLength(7);
  });
});
