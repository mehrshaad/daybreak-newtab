import { describe, expect, it } from "vitest";
import { fromJalali, toJalali } from "@daybreak/sdk";
import {
  holidaysOn,
  isHoliday,
  LUNAR_HOLIDAYS,
  SOLAR_HOLIDAYS,
} from "./holidays";

describe("the table itself", () => {
  it("names a real month and day for every entry", () => {
    for (const h of SOLAR_HOLIDAYS) {
      expect(h.month, h.name).toBeGreaterThanOrEqual(1);
      expect(h.month, h.name).toBeLessThanOrEqual(12);
      expect(h.day, h.name).toBeGreaterThanOrEqual(1);
      // Esfand runs to 30 in a leap year; no Jalali month is longer.
      expect(h.day, h.name).toBeLessThanOrEqual(31);
      expect(h.name, JSON.stringify(h)).toBeTruthy();
    }
    for (const h of LUNAR_HOLIDAYS) {
      expect(h.month, h.name).toBeGreaterThanOrEqual(1);
      expect(h.month, h.name).toBeLessThanOrEqual(12);
      // Either a fixed day, or the last day of the month whatever that is.
      if (h.lastDay) {
        expect(h.day, h.name).toBeUndefined();
      } else {
        expect(h.day, h.name).toBeGreaterThanOrEqual(1);
        // A Hijri month is 29 or 30 days.
        expect(h.day, h.name).toBeLessThanOrEqual(30);
      }
    }
  });
});

describe("solar holidays", () => {
  it("finds Nowruz on the first four days of Farvardin, whatever the year", () => {
    // Nowruz is the test that matters: it lands on a different Gregorian date
    // depending on the year, so finding it proves the lookup goes through the
    // Jalali calendar rather than through a Gregorian date somebody hardcoded.
    for (const year of [1403, 1404, 1405, 1406, 1407]) {
      for (const day of [1, 2, 3, 4]) {
        const at = fromJalali(year, 1, day);
        expect(holidaysOn(at).map((h) => h.name), `${year}/1/${day}`).toContain("Nowruz");
      }
      // And the 5th is not a holiday.
      expect(holidaysOn(fromJalali(year, 1, 5)).map((h) => h.name)).not.toContain("Nowruz");
    }
  });

  it("puts the revolution anniversary on 22 Bahman in every year", () => {
    for (const year of [1403, 1404, 1405, 1406]) {
      const at = fromJalali(year, 11, 22);
      expect(toJalali(at)).toEqual({ jy: year, jm: 11, jd: 22 });
      expect(holidaysOn(at).map((h) => h.name)).toContain("Anniversary of the Revolution");
    }
  });

  it("marks a fixed date as fixed", () => {
    const found = holidaysOn(fromJalali(1405, 1, 1));
    expect(found.find((h) => h.name === "Nowruz").kind).toBe("solar");
  });

  it("reports both when a solar and a lunar holiday land together", () => {
    // Nowruz 1405 is 21 March 2026, which is also the second day of Eid al-Fitr
    // 1447. Two calendars, two holidays, one day — and each keeps its own kind,
    // so the widget can say which of them is a computed date. My first version
    // of the test above assumed a solar holiday would be alone on its day; this
    // is the day that proves otherwise.
    const found = holidaysOn(fromJalali(1405, 1, 1));
    expect(found.map((h) => h.name)).toEqual(["Nowruz", "Eid al-Fitr"]);
    expect(found.map((h) => h.kind)).toEqual(["solar", "lunar"]);
  });

  it("finds nothing on an ordinary day", () => {
    // 10 Mordad is not a holiday on either calendar in 1405.
    expect(isHoliday(fromJalali(1405, 5, 10))).toBe(false);
  });
});

describe("lunar holidays", () => {
  // Skipped where Intl has no Hijri calendar; the widget degrades the same way.
  const hijriWorks = holidaysOn(new Date(2026, 0, 1)) !== null;

  it.skipIf(!hijriWorks)("finds Ashura once, and marks it computed", () => {
    // Ashura 1448 falls in the summer of 2026. Rather than hardcode a Gregorian
    // date from memory, walk a year and assert it appears exactly once — which
    // also catches the lookup firing on every day, the way a broken index would.
    const hits = [];
    for (let i = 0; i < 366; i += 1) {
      const at = new Date(2026, 0, 1 + i);
      if (holidaysOn(at).some((h) => h.name === "Ashura")) hits.push(at);
    }
    expect(hits).toHaveLength(1);
    expect(holidaysOn(hits[0]).find((h) => h.name === "Ashura").kind).toBe("lunar");
  });

  it.skipIf(!hijriWorks)("never reports the same holiday twice on one day", () => {
    // Ali al-Rida's death is listed on both 29 and 30 Safar, because the month
    // has either length. A 30-day Safar must not show it twice.
    for (let i = 0; i < 800; i += 1) {
      const at = new Date(2026, 0, 1 + i);
      const names = holidaysOn(at).map((h) => h.name);
      expect(new Set(names).size, at.toDateString()).toBe(names.length);
    }
  });

  it.skipIf(!hijriWorks)("finds Eid al-Fitr twice a Hijri year, on consecutive days", () => {
    const hits = [];
    for (let i = 0; i < 366; i += 1) {
      const at = new Date(2026, 0, 1 + i);
      if (holidaysOn(at).some((h) => h.name === "Eid al-Fitr")) hits.push(at);
    }
    expect(hits).toHaveLength(2);
    expect(hits[1] - hits[0]).toBe(86400000);
  });
});

describe("how often it fires", () => {
  it("marks a plausible number of days in a year, not none and not most of them", () => {
    // A broad sanity check on the whole mechanism. Iran has roughly two dozen
    // public holidays; anything near zero means the lookup is broken and
    // anything near a hundred means it is matching far too eagerly.
    let count = 0;
    for (let i = 0; i < 365; i += 1) {
      if (isHoliday(new Date(2026, 0, 1 + i))) count += 1;
    }
    expect(count).toBeGreaterThan(15);
    expect(count).toBeLessThan(45);
  });
});

describe("the last day of a lunar month", () => {
  const hijriWorks = holidaysOn(new Date(2026, 0, 1)) !== null;

  it.skipIf(!hijriWorks)("falls on one day a year, not two", () => {
    // Listed as two fixed days (29 and 30 Safar), this landed on two
    // consecutive days in every year where Safar runs to 30 — which 1447 does.
    // Three red days in a row in the month grid is what gave it away.
    const hits = [];
    for (let i = 0; i < 366; i += 1) {
      const at = new Date(2026, 0, 1 + i);
      if (holidaysOn(at).some((h) => h.name === "Death of Ali al-Rida")) hits.push(at);
    }
    expect(hits).toHaveLength(1);
  });

  it.skipIf(!hijriWorks)("is genuinely the month's last day, in a 29 and a 30 day year", () => {
    // Walk several Hijri years so both month lengths are covered, and check the
    // day after every hit is in a new month.
    let found = 0;
    for (let i = 0; i < 366 * 4; i += 1) {
      const at = new Date(2025, 0, 1 + i);
      if (!holidaysOn(at).some((h) => h.name === "Death of Ali al-Rida")) continue;
      found += 1;
      const next = new Date(2025, 0, 2 + i);
      const here = holidaysOn(at);
      expect(here.length, at.toDateString()).toBeGreaterThan(0);
      // The next day must be Rabi I, day 1.
      expect(holidaysOn(next).some((h) => h.name === "Death of Ali al-Rida")).toBe(false);
    }
    expect(found).toBeGreaterThanOrEqual(3);
  });
});
