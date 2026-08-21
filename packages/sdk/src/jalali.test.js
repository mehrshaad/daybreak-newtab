import { describe, expect, it } from "vitest";
import {
  formatJalali,
  fromJalali,
  isJalaliLeapYear,
  jalaliMonthLength,
  toFarsiDigits,
  toJalali,
} from "./jalali";

// Anchors that can be checked independently: Nowruz is the vernal equinox, so
// 1 Farvardin is 20 or 21 March, and the Gregorian dates below are the
// published ones for those Persian new years.
describe("toJalali", () => {
  it("puts Nowruz on the right day", () => {
    expect(toJalali(new Date(2024, 2, 20))).toEqual({ jy: 1403, jm: 1, jd: 1 });
    expect(toJalali(new Date(2025, 2, 21))).toEqual({ jy: 1404, jm: 1, jd: 1 });
    expect(toJalali(new Date(2026, 2, 21))).toEqual({ jy: 1405, jm: 1, jd: 1 });
  });

  it("converts an ordinary date", () => {
    // 2026-08-21 is 30 Mordad 1405.
    expect(toJalali(new Date(2026, 7, 21))).toEqual({ jy: 1405, jm: 5, jd: 30 });
  });

  it("handles the day before Nowruz, which is the last of Esfand", () => {
    const before = toJalali(new Date(2025, 2, 20));
    expect(before.jm).toBe(12);
    expect(before.jy).toBe(1403);
  });

  it("reads local date parts, not UTC ones", () => {
    // Late in the evening the UTC date is already tomorrow in western zones; the
    // calendar shown to the user must still say today.
    const evening = new Date(2026, 7, 21, 23, 30);
    expect(toJalali(evening)).toEqual({ jy: 1405, jm: 5, jd: 30 });
  });
});

describe("fromJalali", () => {
  it("is the inverse of toJalali", () => {
    for (const [y, m, d] of [
      [2024, 0, 1],
      [2025, 5, 15],
      [2026, 2, 21],
      [2026, 11, 31],
      [2030, 6, 4],
    ]) {
      const date = new Date(y, m, d);
      const { jy, jm, jd } = toJalali(date);
      const back = fromJalali(jy, jm, jd);
      expect(back.getFullYear()).toBe(y);
      expect(back.getMonth()).toBe(m);
      expect(back.getDate()).toBe(d);
    }
  });

  it("round-trips every day of a Jalali year", () => {
    // The month lengths and the leap rule have to agree, or some day in Esfand
    // maps to the wrong Gregorian date.
    for (let jm = 1; jm <= 12; jm += 1) {
      for (let jd = 1; jd <= jalaliMonthLength(1405, jm); jd += 1) {
        const round = toJalali(fromJalali(1405, jm, jd));
        expect(round).toEqual({ jy: 1405, jm, jd });
      }
    }
  });
});

describe("month lengths", () => {
  it("gives the first six months 31 days and the next five 30", () => {
    for (let m = 1; m <= 6; m += 1) expect(jalaliMonthLength(1405, m)).toBe(31);
    for (let m = 7; m <= 11; m += 1) expect(jalaliMonthLength(1405, m)).toBe(30);
  });

  it("gives Esfand 30 days only in a leap year", () => {
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
    expect(isJalaliLeapYear(1404)).toBe(false);
  });

  it("adds up to 365 or 366", () => {
    for (const jy of [1400, 1403, 1404, 1405, 1408]) {
      let total = 0;
      for (let m = 1; m <= 12; m += 1) total += jalaliMonthLength(jy, m);
      expect(total, `${jy}`).toBe(isJalaliLeapYear(jy) ? 366 : 365);
    }
  });

  it("marks leap years on the real pattern, not every fourth", () => {
    // 1403 and 1408 are leap; 1404, 1405, 1406, 1407 are not. A naive
    // "every fourth year" rule would get 1407 wrong.
    expect([1403, 1404, 1405, 1406, 1407, 1408].map(isJalaliLeapYear)).toEqual([
      true,
      false,
      false,
      false,
      false,
      true,
    ]);
  });
});

describe("formatJalali", () => {
  it("writes the day, month name and year", () => {
    expect(formatJalali(new Date(2026, 7, 21))).toBe("30 Mordad 1405");
  });

  it("can leave the year off", () => {
    expect(formatJalali(new Date(2026, 7, 21), { withYear: false })).toBe("30 Mordad");
  });

  it("writes Farsi script with Farsi digits", () => {
    const out = formatJalali(new Date(2026, 7, 21), { farsi: true });
    expect(out).toContain("مرداد");
    // Latin digits beside a Farsi month name read as half-translated.
    expect(out).not.toMatch(/\d/);
  });
});

describe("toFarsiDigits", () => {
  it("swaps the numerals and leaves everything else", () => {
    expect(toFarsiDigits("1405/05/30")).toBe("۱۴۰۵/۰۵/۳۰");
  });
});

describe("range", () => {
  it("refuses a year the algorithm cannot answer for", () => {
    expect(() => isJalaliLeapYear(-100)).toThrow(RangeError);
    expect(() => isJalaliLeapYear(4000)).toThrow(RangeError);
  });
});
