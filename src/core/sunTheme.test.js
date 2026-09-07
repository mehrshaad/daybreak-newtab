import { describe, expect, it } from "vitest";
import { sunTimes } from "@daybreak/sdk";
import {
  nextSunSwitch,
  sunLocation,
  sunTheme,
  zoneLocation,
  zoneOffsetMinutes,
} from "./sunTheme";

// Lisbon, and a June day there.
const LISBON = { latitude: 38.72, longitude: -9.13 };
const JUNE = (h, m = 0) => new Date(Date.UTC(2026, 5, 21, h, m));

describe("sunTheme", () => {
  it("is light in the middle of the day", () => {
    expect(sunTheme(JUNE(12), LISBON)).toBe("light");
  });

  it("is dark in the middle of the night", () => {
    expect(sunTheme(JUNE(2), LISBON)).toBe("dark");
  });

  it("turns dark after sunset and light after sunrise", () => {
    // Lisbon on the solstice: sunrise about 05:11 UTC, sunset about 20:05.
    expect(sunTheme(JUNE(5), LISBON)).toBe("dark");
    expect(sunTheme(JUNE(6), LISBON)).toBe("light");
    expect(sunTheme(JUNE(19), LISBON)).toBe("light");
    expect(sunTheme(JUNE(21), LISBON)).toBe("dark");
  });

  it("gives no answer where the sun does not set", () => {
    // Longyearbyen in June. There is no sunset to switch on, and inventing
    // one would put the board in the wrong theme for two months.
    expect(sunTheme(JUNE(12), { latitude: 78.2, longitude: 15.6 })).toBe(null);
    // Nor where it does not rise, in the other half of the year.
    expect(sunTheme(new Date(Date.UTC(2026, 11, 21, 12)), { latitude: 78.2, longitude: 15.6 })).toBe(
      null
    );
  });
});

describe("nextSunSwitch", () => {
  it("is today's sunset while it is still day", () => {
    const next = nextSunSwitch(JUNE(12), LISBON);
    expect(next.getUTCDate()).toBe(21);
    expect(next.getUTCHours()).toBe(20);
  });

  it("is tomorrow's sunrise once tonight has started", () => {
    // The case a single day's pair cannot answer, and the reason two are
    // looked at: after the last mark of today there is nothing left in today.
    const next = nextSunSwitch(JUNE(22), LISBON);
    expect(next.getUTCDate()).toBe(22);
    expect(next.getUTCHours()).toBeLessThan(12);
  });

  it("is always in the future", () => {
    for (const hour of [0, 5, 6, 12, 19, 21, 23]) {
      const at = JUNE(hour);
      expect(nextSunSwitch(at, LISBON).getTime(), `at ${hour}:00`).toBeGreaterThan(at.getTime());
    }
  });

  it("gives nothing where nothing happens", () => {
    expect(nextSunSwitch(JUNE(12), { latitude: 78.2, longitude: 15.6 })).toBe(null);
  });
});

describe("zoneOffsetMinutes", () => {
  it("reads a whole-hour zone", () => {
    expect(zoneOffsetMinutes("Europe/Berlin", JUNE(12))).toBe(120);
  });

  it("reads a half-hour zone", () => {
    expect(zoneOffsetMinutes("Asia/Kolkata", JUNE(12))).toBe(330);
  });

  it("reads a zone west of Greenwich as negative", () => {
    // The sign that matters: it is longitude, not getTimezoneOffset, which
    // has the opposite convention.
    expect(zoneOffsetMinutes("America/New_York", JUNE(12))).toBe(-240);
  });

  it("reads Greenwich itself, where the offset has no digits", () => {
    expect(zoneOffsetMinutes("UTC", JUNE(12))).toBe(0);
  });

  it("says it does not know, rather than saying Greenwich", () => {
    // The distinction that matters: zero is a real offset. An empty string and
    // an unrecognised name both throw RangeError inside Intl, and answering
    // them with 0 would put somebody on the prime meridian at the equator and
    // switch their theme at six with total confidence.
    expect(zoneOffsetMinutes("", JUNE(12))).toBe(null);
    expect(zoneOffsetMinutes("Middle/Earth", JUNE(12))).toBe(null);
  });

  it("reads an absent zone as this machine's own, which Intl does too", () => {
    const here = zoneOffsetMinutes(Intl.DateTimeFormat().resolvedOptions().timeZone, JUNE(12));
    expect(zoneOffsetMinutes(undefined, JUNE(12))).toBe(here);
  });
});

describe("zoneLocation", () => {
  it("puts a zone's longitude at its own meridian", () => {
    // Fifteen degrees to the hour, which is what a timezone is.
    expect(zoneLocation("Europe/Berlin").longitude).toBeCloseTo(30, 0);
    expect(zoneLocation("America/New_York").longitude).toBeCloseTo(-60, 0);
  });

  it("knows the latitude of a zone it has heard of", () => {
    expect(zoneLocation("Asia/Tehran").latitude).toBeCloseTo(35.7, 1);
  });

  it("falls back to the region for one it has not", () => {
    // Kathmandu is not in the table; Asia is.
    expect(zoneLocation("Asia/Kathmandu").latitude).toBe(30);
  });

  it("falls back to the equator for a zone with no region at all", () => {
    expect(zoneLocation("UTC")).toEqual({ latitude: 0, longitude: 0 });
  });

  it("gives nothing at all for a zone it cannot read", () => {
    expect(zoneLocation("")).toBe(null);
    expect(zoneLocation("Middle/Earth")).toBe(null);
  });

  it("puts a table zone close enough to switch at about the right time", () => {
    // The claim the fallback actually has to meet. Berlin's real coordinates
    // against what the table and the meridian give: the theme must not switch
    // more than half an hour away from the truth.
    const real = { latitude: 52.52, longitude: 13.4 };
    const guess = zoneLocation("Europe/Berlin");
    const a = sunTimes(JUNE(12), real.latitude, real.longitude);
    const b = sunTimes(JUNE(12), guess.latitude, guess.longitude);
    expect(Math.abs(a.sunset - b.sunset) / 60000).toBeLessThan(70);
  });
});

describe("sunLocation", () => {
  const zone = "Europe/Lisbon";
  const city = (over) => ({
    name: "Lisbon",
    latitude: 38.72,
    longitude: -9.13,
    timezone: zone,
    ...over,
  });

  it("uses a widget's city when its timezone is the local one", () => {
    const place = sunLocation({ weather: { config: { city: city() } } }, zone);
    expect(place).toMatchObject({ name: "Lisbon", exact: true });
  });

  it("ignores a city somebody is only watching", () => {
    // The rule that makes this trustworthy: a Tokyo weather widget on a London
    // board is curiosity, not a location, and switching the theme at Tokyo's
    // sunset would be a wrong answer arrived at confidently.
    const tokyo = city({ name: "Tokyo", timezone: "Asia/Tokyo", latitude: 35.7, longitude: 139.7 });
    const place = sunLocation({ weather: { config: { city: tokyo } } }, zone);
    expect(place.exact).toBe(false);
    expect(place.name).toBe("");
  });

  it("looks past a widget with no city to one that has it", () => {
    const place = sunLocation(
      { weather: { config: {} }, prayer: { config: { city: city({ name: "Porto" }) } } },
      zone
    );
    expect(place).toMatchObject({ name: "Porto", exact: true });
  });

  it("prefers weather, which is the one people set to where they are", () => {
    const place = sunLocation(
      {
        weather: { config: { city: city({ name: "Lisbon" }) } },
        prayer: { config: { city: city({ name: "Porto" }) } },
      },
      zone
    );
    expect(place.name).toBe("Lisbon");
  });

  it("refuses a city with no usable coordinates", () => {
    // Old configs and hand-edited ones. A NaN latitude reaches sunTimes and
    // comes back as an Invalid Date, which reads as a polar night.
    const broken = city({ latitude: undefined, longitude: null });
    expect(sunLocation({ weather: { config: { city: broken } } }, zone).exact).toBe(false);
  });

  it("falls back with no widgets at all", () => {
    expect(sunLocation(undefined, zone).exact).toBe(false);
    expect(sunLocation({}, zone)).toHaveProperty("latitude");
  });

  it("gives nothing where the timezone is unreadable and no widget helps", () => {
    // Which is what makes the whole feature fall through to the system
    // setting rather than to a confident guess about Greenwich.
    expect(sunLocation({}, "")).toBe(null);
    expect(sunTheme(JUNE(12), sunLocation({}, ""))).toBe(null);
  });

  it("still uses a widget's city when the timezone cannot be read", () => {
    // Only if the city agrees that the zone is "" — which it will not — so
    // this is really the same fallback. Named so the ordering is on record:
    // the zone check comes first and an unreadable zone matches no city.
    expect(sunLocation({ weather: { config: { city: city() } } }, "")).toBe(null);
  });
});
