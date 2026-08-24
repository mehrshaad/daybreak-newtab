import { describe, expect, it } from "vitest";
import { aqiBand, aqiUrl, parseAirQuality, readingFor, SCALES } from "./aqi";

describe("aqiUrl", () => {
  it("targets the air-quality subdomain, not the weather one", () => {
    expect(aqiUrl({ latitude: 35.69, longitude: 51.42 })).toMatch(
      /^https:\/\/air-quality-api\.open-meteo\.com\//
    );
  });

  it("carries the coordinates and asks for both indices at once", () => {
    const url = aqiUrl({ latitude: 35.69, longitude: 51.42 });
    expect(url).toContain("latitude=35.69");
    expect(url).toContain("longitude=51.42");
    // Both, always. They cost nothing extra on the same call, and asking for
    // only the selected one would refetch the tile every time the scale is
    // switched — for a number the response already had.
    expect(url).toContain("current=us_aqi,european_aqi,pm2_5,pm10");
  });

  it("never carries a key", () => {
    expect(aqiUrl({ latitude: 1, longitude: 2 })).not.toMatch(/key|token|appid/i);
  });
});

describe("aqiBand", () => {
  it("classes the boundary values into the lower band", () => {
    expect(aqiBand(50).label).toBe("Good");
    expect(aqiBand(51).label).toBe("Moderate");
    expect(aqiBand(100).label).toBe("Moderate");
    expect(aqiBand(101).label).toBe("Unhealthy for sensitive groups");
  });

  it("classes zero as Good", () => {
    expect(aqiBand(0).label).toBe("Good");
  });

  it("has no ceiling — anything past 300 is Hazardous", () => {
    expect(aqiBand(500).label).toBe("Hazardous");
  });

  it("is null for missing input", () => {
    expect(aqiBand(null)).toBeNull();
    expect(aqiBand(undefined)).toBeNull();
    expect(aqiBand(NaN)).toBeNull();
  });
});

describe("parseAirQuality", () => {
  it("rounds the AQI to a whole number and the particulates to one decimal", () => {
    const out = parseAirQuality({ current: { us_aqi: 70.4, pm2_5: 26.42, pm10: 33.51 } });
    // Both indices are parsed now, and this payload only carried the US one.
    expect(out).toEqual({ aqi: 70, europeanAqi: null, pm25: 26.4, pm10: 33.5 });
  });

  it("carries a null particulate through rather than defaulting it to zero", () => {
    expect(parseAirQuality({ current: { us_aqi: 40, pm2_5: null, pm10: 12 } }).pm25).toBeNull();
  });

  it("is null when the payload has no current AQI", () => {
    expect(parseAirQuality({})).toBeNull();
    expect(parseAirQuality(null)).toBeNull();
    expect(parseAirQuality({ current: {} })).toBeNull();
  });
});

describe("the two scales", () => {
  it("reads the same air as two different verdicts, which is the whole point", () => {
    // 45 is still "good" on the US index and already "moderate" in Europe, and
    // 85 is merely "moderate" in the US while Europe calls it "very poor". A
    // tile showing the number without saying which index it is on is not
    // informing anybody.
    expect(aqiBand(45, "us").label).toBe("Good");
    expect(aqiBand(45, "european").label).toBe("Moderate");
    expect(aqiBand(85, "us").label).toBe("Moderate");
    expect(aqiBand(85, "european").label).toBe("Very poor");
  });

  it("puts European boundaries in the lower band, as the US ones are", () => {
    expect(aqiBand(20, "european").label).toBe("Good");
    expect(aqiBand(21, "european").label).toBe("Fair");
    expect(aqiBand(100, "european").label).toBe("Very poor");
    expect(aqiBand(101, "european").label).toBe("Extremely poor");
  });

  it("falls back to the US scale for an unknown name rather than crashing", () => {
    expect(aqiBand(55, "martian").label).toBe("Moderate");
  });

  it("gives every band a label and a colour, on both scales", () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      for (const band of scale.bands) {
        expect(band.label, name).toBeTruthy();
        expect(band.color, name).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});

describe("parseAirQuality with both indices", () => {
  const payload = (current) => ({ current });

  it("keeps both readings", () => {
    const parsed = parseAirQuality(payload({ us_aqi: 55.4, european_aqi: 31.6, pm2_5: 12.34, pm10: 20 }));
    expect(parsed).toEqual({ aqi: 55, europeanAqi: 32, pm25: 12.3, pm10: 20 });
  });

  it("still parses when the provider returned only one of them", () => {
    expect(parseAirQuality(payload({ european_aqi: 31 }))).toMatchObject({ aqi: null, europeanAqi: 31 });
    expect(parseAirQuality(payload({ us_aqi: 55 }))).toMatchObject({ aqi: 55, europeanAqi: null });
  });

  it("gives up only when neither is there", () => {
    expect(parseAirQuality(payload({ pm2_5: 12 }))).toBeNull();
  });
});

describe("readingFor", () => {
  const both = { aqi: 55, europeanAqi: 31 };

  it("takes the scale that was asked for", () => {
    expect(readingFor(both, "us")).toEqual({ value: 55, scale: "us" });
    expect(readingFor(both, "european")).toEqual({ value: 31, scale: "european" });
  });

  it("falls back to the other scale, and says which it fell back to", () => {
    // Showing the wrong-scale number silently would be worse than showing
    // nothing; the tile prints the scale it returns here.
    expect(readingFor({ aqi: null, europeanAqi: 31 }, "us")).toEqual({ value: 31, scale: "european" });
    expect(readingFor({ aqi: 55, europeanAqi: null }, "european")).toEqual({ value: 55, scale: "us" });
  });

  it("returns nothing when there is nothing to show", () => {
    expect(readingFor({ aqi: null, europeanAqi: null }, "us")).toBeNull();
    expect(readingFor(null, "us")).toBeNull();
  });
});
