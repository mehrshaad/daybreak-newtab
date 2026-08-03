import { describe, expect, it } from "vitest";
import { forecastUrl, formatHour, parseForecast, pickNextHours } from "./forecast";

const hourly = {
  time: [
    "2026-08-02T20:00",
    "2026-08-02T21:00",
    "2026-08-02T22:00",
    "2026-08-02T23:00",
    "2026-08-03T00:00",
    "2026-08-03T01:00",
    "2026-08-03T02:00",
  ],
  temperature_2m: [21.4, 20.8, 20.2, 19.6, 19.1, 18.7, 18.2],
  weather_code: [2, 3, 61, 61, 0, 0, 45],
};

describe("pickNextHours", () => {
  it("starts at the current hour, not the start of the day", () => {
    const out = pickNextHours(hourly, "2026-08-02T22:00", 3);
    expect(out.map((h) => h.time)).toEqual([
      "2026-08-02T22:00",
      "2026-08-02T23:00",
      "2026-08-03T00:00",
    ]);
  });

  it("rounds temperatures", () => {
    expect(pickNextHours(hourly, "2026-08-02T20:00", 1)[0].temp).toBe(21);
  });

  it("carries each hour's condition code for the taller layouts", () => {
    expect(pickNextHours(hourly, "2026-08-02T22:00", 2).map((h) => h.code)).toEqual([
      61, 61,
    ]);
  });

  it("leaves the code undefined when the series does not have one", () => {
    const noCodes = { time: hourly.time, temperature_2m: hourly.temperature_2m };
    expect(pickNextHours(noCodes, "2026-08-02T22:00", 1)[0].code).toBeUndefined();
  });

  it("crosses midnight without wrapping back", () => {
    const out = pickNextHours(hourly, "2026-08-02T23:00", 4);
    expect(out.map((h) => h.time)).toEqual([
      "2026-08-02T23:00",
      "2026-08-03T00:00",
      "2026-08-03T01:00",
      "2026-08-03T02:00",
    ]);
  });

  it("returns what is left near the end of the series", () => {
    expect(pickNextHours(hourly, "2026-08-03T01:00", 5)).toHaveLength(2);
  });

  it("is empty when the series is exhausted or missing", () => {
    expect(pickNextHours(hourly, "2026-08-04T00:00")).toEqual([]);
    expect(pickNextHours(null, "2026-08-02T22:00")).toEqual([]);
    expect(pickNextHours({ time: [] }, "2026-08-02T22:00")).toEqual([]);
  });

  it("skips gaps in the temperature series", () => {
    const gappy = {
      time: ["2026-08-02T22:00", "2026-08-02T23:00", "2026-08-03T00:00"],
      temperature_2m: [20.2, null, 19.1],
    };
    expect(pickNextHours(gappy, "2026-08-02T22:00", 3).map((h) => h.temp)).toEqual([
      20, 19,
    ]);
  });
});

describe("formatHour", () => {
  it("formats 12-hour with a compact suffix", () => {
    expect(formatHour("2026-08-02T00:00", false)).toBe("12a");
    expect(formatHour("2026-08-02T09:00", false)).toBe("9a");
    expect(formatHour("2026-08-02T12:00", false)).toBe("12p");
    expect(formatHour("2026-08-02T22:00", false)).toBe("10p");
  });

  it("formats 24-hour zero-padded", () => {
    expect(formatHour("2026-08-02T00:00", true)).toBe("00");
    expect(formatHour("2026-08-02T09:00", true)).toBe("09");
    expect(formatHour("2026-08-02T22:00", true)).toBe("22");
  });

  it("is blank for malformed input", () => {
    expect(formatHour("nonsense", true)).toBe("");
  });
});

describe("forecastUrl", () => {
  it("asks Open-Meteo for the right unit and no API key", () => {
    const c = { latitude: 35.69, longitude: 51.42 };
    expect(forecastUrl(c, false)).toContain("temperature_unit=celsius");
    expect(forecastUrl(c, true)).toContain("temperature_unit=fahrenheit");
    expect(forecastUrl(c, false)).toContain("latitude=35.69");
    expect(forecastUrl(c, false)).not.toMatch(/key|token|appid/i);
  });

  it("asks for is_day, so the icon can tell noon from midnight", () => {
    expect(forecastUrl({ latitude: 1, longitude: 2 }, false)).toContain("is_day");
  });

  it("asks for hourly codes, for the per-hour icons", () => {
    expect(forecastUrl({ latitude: 1, longitude: 2 }, false)).toContain(
      "hourly=temperature_2m,weather_code"
    );
  });

  it("only ever targets Open-Meteo", () => {
    expect(forecastUrl({ latitude: 1, longitude: 2 }, false)).toMatch(
      /^https:\/\/api\.open-meteo\.com\//
    );
  });
});

describe("parseForecast", () => {
  const data = {
    current: {
      time: "2026-08-02T22:00",
      temperature_2m: 20.2,
      apparent_temperature: 19.4,
      weather_code: 2,
    },
    daily: { temperature_2m_max: [26.7], temperature_2m_min: [17.2] },
    hourly,
  };

  it("maps current conditions and the hourly strip", () => {
    const f = parseForecast(data, false);
    expect(f.temp).toBe(20);
    expect(f.feels).toBe(19);
    expect(f.high).toBe(27);
    expect(f.low).toBe(17);
    expect(f.label).toBe("Partly cloudy");
    expect(f.condition).toBe("clouds");
    expect(f.hours[0]).toEqual({ t: "10p", v: "20°", c: "rain" });
    // A full run is parsed so the bigger sizes have hours to show; this fixture
    // only carries five from 22:00.
    expect(f.hours).toHaveLength(5);
  });

  it("honours the 24-hour preference in the strip", () => {
    expect(parseForecast(data, true).hours[0].t).toBe("22");
  });

  it("reads day and night from the location's own clock", () => {
    expect(parseForecast({ ...data, current: { ...data.current, is_day: 1 } }, false).isDay).toBe(
      true
    );
    expect(parseForecast({ ...data, current: { ...data.current, is_day: 0 } }, false).isDay).toBe(
      false
    );
  });

  it("assumes day when is_day is missing, rather than showing a moon at noon", () => {
    expect(parseForecast(data, false).isDay).toBe(true);
  });

  it("returns null when the payload has no current block", () => {
    expect(parseForecast({}, false)).toBeNull();
    expect(parseForecast(null, false)).toBeNull();
  });
});
