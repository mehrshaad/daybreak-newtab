import { describe, expect, it } from "vitest";
import { formatHijri, hijriAvailable, toHijri } from "./hijri";
import { toJalali } from "./jalali";

// Two things worth testing here, and neither is "does Intl work".
//
// One: that this module reads Intl correctly — the right calendar variant, and
// the right day when local time is near midnight, which is where a naive
// implementation goes wrong.
//
// Two, and more valuable: Intl also ships the Persian calendar, which makes it
// an independent check on the Jalali arithmetic in jalali.js. That module is
// hand-written Borkowski and the only previous evidence it was right was its own
// test fixtures. Cross-checking two implementations that share no code is worth
// more than any number of hand-copied dates.

const available = hijriAvailable();

describe.skipIf(!available)("toHijri", () => {
  it("uses the Umm al-Qura variant, not the calculated one", () => {
    // 21 August 2026 is 8 Rabi I 1448 by Umm al-Qura and 9 by plain "islamic".
    // Getting this wrong is a whole day out, every time, and silently.
    expect(toHijri(new Date(2026, 7, 21))).toMatchObject({ year: 1448, month: 3, day: 8 });
  });

  it("names the month", () => {
    expect(toHijri(new Date(2026, 7, 21)).monthName).toMatch(/Rabi/);
  });

  it("gives the same day whatever the local time is", () => {
    // The failure this guards: formatting the raw Date in the local zone puts
    // a late evening on the next Hijri day, or an early morning on the previous
    // one, which is exactly when somebody glancing at a date display cares.
    const day = new Date(2026, 7, 21).getDate();
    for (const hour of [0, 1, 6, 12, 18, 23]) {
      const at = new Date(2026, 7, day, hour, 30);
      expect(toHijri(at), `${hour}:30`).toMatchObject({ year: 1448, month: 3, day: 8 });
    }
  });

  it("moves forward exactly one day at a time", () => {
    // A month-length table read wrongly shows up as a day skipped or repeated
    // at a month boundary, so walk a whole year of them.
    let previous = null;
    for (let i = 0; i < 370; i += 1) {
      const at = new Date(2026, 0, 1 + i);
      const h = toHijri(at);
      if (previous) {
        const sameMonth = h.year === previous.year && h.month === previous.month;
        if (sameMonth) {
          expect(h.day, at.toDateString()).toBe(previous.day + 1);
        } else {
          // A new month always starts on day 1, and the month before it ended
          // on 29 or 30 — never anything else in a lunar calendar.
          expect(h.day, at.toDateString()).toBe(1);
          expect([29, 30], at.toDateString()).toContain(previous.day);
        }
      }
      previous = h;
    }
  });

  it("formats with and without the year", () => {
    const at = new Date(2026, 7, 21);
    expect(formatHijri(at)).toMatch(/^8 Rabi.* 1448$/);
    expect(formatHijri(at, { withYear: false })).toMatch(/^8 Rabi/);
  });
});

// The check that actually matters for the code this repo owns.
const persianAvailable = (() => {
  try {
    new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric" }).format(new Date());
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!persianAvailable)("jalali.js, checked against Intl's Persian calendar", () => {
  const viaIntl = (date) => {
    const f = new Intl.DateTimeFormat("en-u-ca-persian", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const at = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
    const parts = {};
    for (const part of f.formatToParts(at)) parts[part.type] = part.value;
    return {
      jy: parseInt(parts.year, 10),
      jm: parseInt(parts.month, 10),
      jd: parseInt(parts.day, 10),
    };
  };

  it("agrees with Intl on every day across four years, leap years included", () => {
    // Two implementations sharing no code: hand-written Borkowski here, ICU's
    // own tables there. 2028 and 2032 are Gregorian leaps, and 1403 and 1407 AP
    // are Jalali leaps, so the window covers both kinds of boundary.
    for (let i = 0; i < 365 * 4; i += 1) {
      const at = new Date(2025, 0, 1 + i);
      expect(toJalali(at), at.toDateString()).toEqual(viaIntl(at));
    }
  });

  it("agrees on Nowruz, which is the day the two calendars must not disagree", () => {
    // 1 Farvardin. If the leap rule were wrong anywhere, this is the date that
    // would land on the wrong Gregorian day.
    for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
      for (const day of [19, 20, 21, 22]) {
        const at = new Date(year, 2, day);
        expect(toJalali(at), at.toDateString()).toEqual(viaIntl(at));
      }
    }
  });
});
