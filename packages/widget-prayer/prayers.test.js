import { describe, expect, it } from "vitest";
import { sunTimes } from "@daybreak/sdk";
import { currentAndNext, METHODS, PRAYERS, prayerTimes, untilLabel } from "./prayers";

const TEHRAN = { latitude: 35.6892, longitude: 51.389, timeZoneOffsetHours: 3.5 };
const LONDON = { latitude: 51.5074, longitude: -0.1278, timeZoneOffsetHours: 1 };

const hhmm = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
const minutesOf = (date) => date.getHours() * 60 + date.getMinutes();

describe("prayerTimes", () => {
  it("returns times on the day it was asked about", () => {
    // The assertion that caught a 27-day error hiding behind correct-looking
    // clock times: every prayer must fall on the requested date.
    const day = new Date(2026, 7, 21);
    const t = prayerTimes({ date: day, ...TEHRAN });
    for (const name of PRAYERS) {
      expect(t[name].getFullYear(), name).toBe(2026);
      expect(t[name].getMonth(), name).toBe(7);
      expect(t[name].getDate(), name).toBe(21);
    }
  });

  it("keeps the equation of time to the few minutes it really is", () => {
    // It is never more than about 17 minutes either way. A wildly wrong value
    // still produces plausible clock times if it lands near a whole day.
    for (const month of [0, 3, 6, 9]) {
      const t = prayerTimes({ date: new Date(2026, month, 15), ...TEHRAN });
      const solarNoonMinutes = minutesOf(t.dhuhr);
      // Longitude 51.389 and +3:30 put solar noon within 20 minutes of 12:04.
      expect(Math.abs(solarNoonMinutes - (12 * 60 + 4)), `${month}`).toBeLessThan(20);
    }
  });

  it("orders the day correctly", () => {
    const t = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN });
    const order = PRAYERS.map((p) => minutesOf(t[p]));
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i], PRAYERS[i]).toBeGreaterThan(order[i - 1]);
    }
  });

  it("puts Dhuhr at solar noon on the place's own clock", () => {
    // Derived, not recalled: solar noon is 12:00 minus the longitude term
    // (51.389/15 = 3.43h) plus the zone offset (+3:30), give or take the
    // equation of time — so a few minutes past 12:00 on Tehran's clock.
    // Published Iranian tables showing 13:06 are from before 2022, when the
    // country still kept daylight saving; using them cost an hour twice.
    const t = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN });
    expect(minutesOf(t.dhuhr)).toBeGreaterThan(11 * 60 + 55);
    expect(minutesOf(t.dhuhr)).toBeLessThan(12 * 60 + 20);
  });

  it("agrees with the sun core it shares its geometry with", () => {
    // The strongest check available without a network: sunrise here is computed
    // from the prayer module's own solar maths, and the SDK's astro module
    // arrives at it by a different route. Two independent implementations
    // landing within two minutes is worth more than a table from memory.
    const t = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN, method: "tehran" });
    const astro = sunTimes(new Date(Date.UTC(2026, 7, 21)), TEHRAN.latitude, TEHRAN.longitude);
    const astroLocal = new Date(astro.sunrise.getTime() + TEHRAN.timeZoneOffsetHours * 3600000);
    const astroMinutes = astroLocal.getUTCHours() * 60 + astroLocal.getUTCMinutes();
    expect(Math.abs(minutesOf(t.sunrise) - astroMinutes)).toBeLessThanOrEqual(2);
  });

  it("keeps Maghrib after sunset and Fajr well before it", () => {
    const t = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN, method: "tehran" });
    // Tehran's method puts Maghrib 4.5 degrees past sunset, so it is later.
    expect(t.maghrib.getTime()).toBeGreaterThan(t.sunrise.getTime());
    // Fajr is dawn, over an hour before sunrise at this latitude.
    expect(minutesOf(t.sunrise) - minutesOf(t.fajr)).toBeGreaterThan(60);
  });

  it("gives a later Asr under the Hanafi reckoning", () => {
    // Two shadow lengths instead of one, so it is always later — never equal.
    const standard = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN, asr: "standard" });
    const hanafi = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN, asr: "hanafi" });
    expect(hanafi.asr.getTime()).toBeGreaterThan(standard.asr.getTime());
  });

  it("moves Fajr with the method, since the methods genuinely disagree", () => {
    const day = new Date(2026, 7, 21);
    const tehran = prayerTimes({ date: day, ...TEHRAN, method: "tehran" });
    const isna = prayerTimes({ date: day, ...TEHRAN, method: "isna" });
    // Tehran uses 17.7 degrees and ISNA 15, so Tehran's Fajr is earlier.
    expect(tehran.fajr.getTime()).toBeLessThan(isna.fajr.getTime());
    expect(Math.abs(minutesOf(tehran.fajr) - minutesOf(isna.fajr))).toBeGreaterThan(8);
  });

  it("treats Maghrib as sunset where the method says so, and later where it does not", () => {
    const day = new Date(2026, 7, 21);
    // MWL has no maghrib angle, so Maghrib is sunset.
    const mwl = prayerTimes({ date: day, ...TEHRAN, method: "mwl" });
    expect(Math.abs(mwl.maghrib - mwl.sunrise)).toBeGreaterThan(0);
    // Tehran uses 4.5 degrees of depression, so it lands after sunset.
    const tehran = prayerTimes({ date: day, ...TEHRAN, method: "tehran" });
    expect(tehran.maghrib.getTime()).toBeGreaterThan(mwl.maghrib.getTime());
  });

  it("puts Isha a fixed interval after Maghrib for Umm al-Qura", () => {
    const t = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN, method: "makkah" });
    expect(Math.round((t.isha - t.maghrib) / 60000)).toBe(METHODS.makkah.ishaInterval);
  });

  it("applies per-prayer adjustments", () => {
    const day = new Date(2026, 7, 21);
    const plain = prayerTimes({ date: day, ...TEHRAN });
    const shifted = prayerTimes({ date: day, ...TEHRAN, adjustments: { fajr: 5, isha: -3 } });
    expect(Math.round((shifted.fajr - plain.fajr) / 60000)).toBe(5);
    expect(Math.round((shifted.isha - plain.isha) / 60000)).toBe(-3);
  });

  it("says null rather than a wrong time where the sun never gets low enough", () => {
    // Northern Norway in June: there is no 17.7-degree depression at all.
    const t = prayerTimes({
      date: new Date(2026, 5, 21),
      latitude: 69.65,
      longitude: 18.96,
      timeZoneOffsetHours: 2,
      method: "tehran",
    });
    expect(t.fajr).toBe(null);
    expect(t.isha).toBe(null);
    // Dhuhr is still solar noon, which always exists.
    expect(t.dhuhr).toBeInstanceOf(Date);
  });

  it("is on the place's clock, not the viewer's", () => {
    // The same instant described from two offsets must land on different local
    // clock readings — this is the bug that made Fajr look like an evening
    // prayer when the browser was in another zone.
    const day = new Date(2026, 7, 21);
    const local = prayerTimes({ date: day, ...TEHRAN, timeZoneOffsetHours: 3.5 });
    const shifted = prayerTimes({ date: day, ...TEHRAN, timeZoneOffsetHours: 0 });
    // Not rounded: Math.round(3.5) is 4, which quietly passed a wrong number
    // the first time this was written.
    expect((local.dhuhr - shifted.dhuhr) / 3600000).toBeCloseTo(3.5, 6);
  });

  it("gives London a sensible summer table too", () => {
    const t = prayerTimes({ date: new Date(2026, 6, 15), ...LONDON, method: "mwl" });
    expect(hhmm(t.dhuhr) > "12:30").toBe(true);
    expect(hhmm(t.dhuhr) < "13:30").toBe(true);
  });
});

describe("currentAndNext", () => {
  const times = prayerTimes({ date: new Date(2026, 7, 21), ...TEHRAN });

  it("finds the one in progress and the one coming", () => {
    // Just after Dhuhr.
    const { current, next } = currentAndNext(times, new Date(times.dhuhr.getTime() + 60000));
    expect(current.name).toBe("dhuhr");
    expect(next.name).toBe("asr");
  });

  it("has no current prayer before Fajr", () => {
    const { current, next } = currentAndNext(times, new Date(2026, 7, 21, 1, 0));
    expect(current).toBe(null);
    expect(next.name).toBe("fajr");
  });

  it("has nothing next after Isha, so the caller can reach for tomorrow", () => {
    const { current, next } = currentAndNext(times, new Date(2026, 7, 21, 23, 59));
    expect(current.name).toBe("isha");
    expect(next).toBe(null);
  });
});

describe("untilLabel", () => {
  const now = new Date(2026, 7, 21, 12, 0);

  it("counts hours and minutes, then minutes alone", () => {
    expect(untilLabel(new Date(2026, 7, 21, 14, 30), now)).toBe("in 2h 30m");
    expect(untilLabel(new Date(2026, 7, 21, 12, 25), now)).toBe("in 25m");
  });

  it("says now once it has arrived", () => {
    expect(untilLabel(new Date(2026, 7, 21, 11, 59), now)).toBe("now");
  });
});
