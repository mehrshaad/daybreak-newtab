import { describe, expect, it } from "vitest";
import {
  dayLengthDelta,
  dayProgress,
  daysUntilPhase,
  fromJulian,
  moonPhase,
  moonPhaseName,
  sunPosition,
  sunTimes,
  SYNODIC_MONTH,
  toJulian,
} from "./astro";

// Checked against NOAA's solar calculator and timeanddate.com. Tolerances are
// in minutes because that is the resolution anything displaying these will use.
const LONDON = { lat: 51.5074, lon: -0.1278 };
const TEHRAN = { lat: 35.6892, lon: 51.389 };
const REYKJAVIK = { lat: 64.1466, lon: -21.9426 };
const SINGAPORE = { lat: 1.3521, lon: 103.8198 };

const utc = (y, m, d, h = 12, min = 0) => new Date(Date.UTC(y, m - 1, d, h, min));
const minutesApart = (a, b) => Math.abs(a - b) / 60000;

describe("julian round trip", () => {
  it("survives there and back", () => {
    const date = utc(2026, 8, 21, 9, 30);
    expect(fromJulian(toJulian(date)).getTime()).toBe(date.getTime());
  });

  it("puts J2000 where it belongs", () => {
    // 2000-01-01 12:00 UTC is JD 2451545.0.
    expect(toJulian(utc(2000, 1, 1, 12, 0))).toBeCloseTo(2451545, 6);
  });
});

describe("sunTimes", () => {
  it("matches the published sunrise and sunset for London at an equinox", () => {
    // 2026-03-20: sunrise 06:03 UTC, sunset 18:14 UTC.
    const t = sunTimes(utc(2026, 3, 20), LONDON.lat, LONDON.lon);
    expect(minutesApart(t.sunrise, utc(2026, 3, 20, 6, 3))).toBeLessThan(3);
    expect(minutesApart(t.sunset, utc(2026, 3, 20, 18, 14))).toBeLessThan(3);
  });

  // Deliberately not asserted against a remembered almanac time: the first
  // attempt at this test used Tehran figures from the pre-2022 daylight-saving
  // era and failed the correct code by 57 minutes. Solar noon is fixed by
  // longitude — 12:00 UTC minus lon/15 hours, give or take the equation of time
  // — which is arithmetic anyone can check, so that is what is checked.
  it("puts solar noon where the longitude says it must be", () => {
    for (const place of [LONDON, TEHRAN, { lat: 35.68, lon: 139.69 }]) {
      const noon = sunTimes(utc(2026, 6, 21), place.lat, place.lon).solarNoon;
      const hours = noon.getUTCHours() + noon.getUTCMinutes() / 60;
      const predicted = 12 - place.lon / 15;
      // The equation of time is worth a few minutes; a longitude sign error
      // would be worth hours.
      expect(Math.abs(hours - predicted) * 60, `${place.lon}`).toBeLessThan(5);
    }
  });

  it("gives Tehran the day length it should have in midsummer", () => {
    // 14h35m at 35.7°N on the solstice. Length depends on latitude alone, so
    // no timezone can make this one wrong.
    const t = sunTimes(utc(2026, 6, 21), TEHRAN.lat, TEHRAN.lon);
    expect(t.dayLength / 3600).toBeGreaterThan(14.4);
    expect(t.dayLength / 3600).toBeLessThan(14.7);
  });

  it("puts solar noon between them", () => {
    const t = sunTimes(utc(2026, 8, 21), LONDON.lat, LONDON.lon);
    expect(t.solarNoon.getTime()).toBeGreaterThan(t.sunrise.getTime());
    expect(t.solarNoon.getTime()).toBeLessThan(t.sunset.getTime());
  });

  it("gives a day near twelve hours at the equator, all year", () => {
    for (const month of [1, 4, 7, 10]) {
      const t = sunTimes(utc(2026, month, 15), SINGAPORE.lat, SINGAPORE.lon);
      expect(t.dayLength / 3600).toBeGreaterThan(11.5);
      expect(t.dayLength / 3600).toBeLessThan(12.5);
    }
  });

  it("gives a long day and a short one in the right seasons", () => {
    const june = sunTimes(utc(2026, 6, 21), LONDON.lat, LONDON.lon).dayLength / 3600;
    const december = sunTimes(utc(2026, 12, 21), LONDON.lat, LONDON.lon).dayLength / 3600;
    expect(june).toBeGreaterThan(16);
    expect(december).toBeLessThan(8.5);
  });

  it("says null rather than a wrong time where the sun never sets", () => {
    // Reykjavik is south of the circle, so use a latitude that truly is inside.
    const t = sunTimes(utc(2026, 6, 21), 78, 15);
    expect(t.sunrise).toBe(null);
    expect(t.sunset).toBe(null);
    expect(t.dayLength).toBe(null);
  });

  it("still gives a solar noon through a polar day", () => {
    expect(sunTimes(utc(2026, 6, 21), 78, 15).solarNoon).toBeInstanceOf(Date);
  });

  it("orders dawn, sunrise, sunset and dusk", () => {
    const t = sunTimes(utc(2026, 8, 21), REYKJAVIK.lat, REYKJAVIK.lon);
    expect(t.dawn.getTime()).toBeLessThan(t.sunrise.getTime());
    expect(t.sunset.getTime()).toBeLessThan(t.dusk.getTime());
  });

  it("has the longitude the right way round", () => {
    // East of Greenwich the sun comes up earlier in UTC, west of it later. A
    // flipped sign would sail past every day-length check above.
    const east = sunTimes(utc(2026, 3, 20), TEHRAN.lat, TEHRAN.lon).sunrise;
    const greenwich = sunTimes(utc(2026, 3, 20), LONDON.lat, 0).sunrise;
    const west = sunTimes(utc(2026, 3, 20), LONDON.lat, -75).sunrise;
    expect(east.getTime()).toBeLessThan(greenwich.getTime());
    expect(west.getTime()).toBeGreaterThan(greenwich.getTime());
  });
});

describe("dayLengthDelta", () => {
  it("is positive in spring and negative in autumn", () => {
    expect(dayLengthDelta(utc(2026, 3, 20), LONDON.lat, LONDON.lon)).toBeGreaterThan(0);
    expect(dayLengthDelta(utc(2026, 9, 23), LONDON.lat, LONDON.lon)).toBeLessThan(0);
  });

  it("is near zero at a solstice, where the change turns around", () => {
    expect(Math.abs(dayLengthDelta(utc(2026, 6, 21), LONDON.lat, LONDON.lon))).toBeLessThan(60);
  });

  it("is null where there is no day length to compare", () => {
    expect(dayLengthDelta(utc(2026, 6, 21), 78, 15)).toBe(null);
  });
});

describe("dayProgress", () => {
  it("is 0 at sunrise, 1 at sunset and a half in between", () => {
    const day = utc(2026, 8, 21);
    const { sunrise, sunset } = sunTimes(day, LONDON.lat, LONDON.lon);
    expect(dayProgress(sunrise, LONDON.lat, LONDON.lon)).toBeCloseTo(0, 2);
    expect(dayProgress(sunset, LONDON.lat, LONDON.lon)).toBeCloseTo(1, 2);
    const middle = new Date((sunrise.getTime() + sunset.getTime()) / 2);
    expect(dayProgress(middle, LONDON.lat, LONDON.lon)).toBeCloseTo(0.5, 2);
  });

  it("clamps rather than running negative before dawn", () => {
    expect(dayProgress(utc(2026, 8, 21, 1, 0), LONDON.lat, LONDON.lon)).toBe(0);
  });
});

describe("sunPosition", () => {
  it("puts the sun below the horizon at local midnight", () => {
    expect(sunPosition(utc(2026, 8, 21, 0, 0), LONDON.lat, LONDON.lon).altitude).toBeLessThan(0);
  });

  it("puts it high at midsummer noon and low at midwinter noon", () => {
    const june = sunPosition(utc(2026, 6, 21, 12, 0), LONDON.lat, LONDON.lon).altitude;
    const december = sunPosition(utc(2026, 12, 21, 12, 0), LONDON.lat, LONDON.lon).altitude;
    expect(june).toBeGreaterThan(55);
    expect(december).toBeLessThan(20);
    expect(december).toBeGreaterThan(0);
  });

  it("reports a compass bearing on the dial", () => {
    const { azimuth } = sunPosition(utc(2026, 8, 21, 12, 0), LONDON.lat, LONDON.lon);
    expect(azimuth).toBeGreaterThanOrEqual(0);
    expect(azimuth).toBeLessThan(360);
  });
});

describe("moonPhase", () => {
  it("is near full at a known full moon", () => {
    // 2026-03-03 11:38 UTC.
    const { illumination, phase } = moonPhase(utc(2026, 3, 3, 11, 38));
    expect(illumination).toBeGreaterThan(0.97);
    expect(Math.abs(phase - 0.5)).toBeLessThan(0.03);
  });

  it("is near new at a known new moon", () => {
    // 2026-03-19 01:23 UTC.
    const { illumination } = moonPhase(utc(2026, 3, 19, 1, 23));
    expect(illumination).toBeLessThan(0.03);
  });

  it("keeps phase inside a single cycle", () => {
    for (let day = 1; day <= 28; day += 1) {
      const { phase } = moonPhase(utc(2026, 4, day));
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(1);
    }
  });

  it("waxes then wanes across a month", () => {
    const first = moonPhase(utc(2026, 3, 22)).illumination;
    const later = moonPhase(utc(2026, 3, 26)).illumination;
    expect(later).toBeGreaterThan(first);
  });
});

describe("moonPhaseName", () => {
  it("names the four exact phases", () => {
    expect(moonPhaseName(0)).toBe("New moon");
    expect(moonPhaseName(0.25)).toBe("First quarter");
    expect(moonPhaseName(0.5)).toBe("Full moon");
    expect(moonPhaseName(0.75)).toBe("Last quarter");
  });

  it("names the crescents and gibbous stretches between them", () => {
    expect(moonPhaseName(0.12)).toBe("Waxing crescent");
    expect(moonPhaseName(0.38)).toBe("Waxing gibbous");
    expect(moonPhaseName(0.62)).toBe("Waning gibbous");
    expect(moonPhaseName(0.88)).toBe("Waning crescent");
  });

  it("wraps rather than falling off the end", () => {
    expect(moonPhaseName(1)).toBe("New moon");
    expect(moonPhaseName(1.25)).toBe("First quarter");
  });
});

describe("daysUntilPhase", () => {
  it("counts forward to the next full moon", () => {
    expect(daysUntilPhase(0.25, 0.5)).toBeCloseTo(0.25 * SYNODIC_MONTH, 5);
  });

  it("wraps around the month rather than going backwards", () => {
    expect(daysUntilPhase(0.75, 0.5)).toBeCloseTo(0.75 * SYNODIC_MONTH, 5);
  });
});
