import { describe, expect, it } from "vitest";
import { addMonths, monthGrid } from "./calendar";

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
