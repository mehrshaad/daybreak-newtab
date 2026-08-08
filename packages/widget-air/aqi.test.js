import { describe, expect, it } from "vitest";
import { aqiBand, aqiUrl, parseAirQuality } from "./aqi";

describe("aqiUrl", () => {
  it("targets the air-quality subdomain, not the weather one", () => {
    expect(aqiUrl({ latitude: 35.69, longitude: 51.42 })).toMatch(
      /^https:\/\/air-quality-api\.open-meteo\.com\//
    );
  });

  it("carries the coordinates and asks for the three current fields", () => {
    const url = aqiUrl({ latitude: 35.69, longitude: 51.42 });
    expect(url).toContain("latitude=35.69");
    expect(url).toContain("longitude=51.42");
    expect(url).toContain("current=us_aqi,pm2_5,pm10");
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
    expect(out).toEqual({ aqi: 70, pm25: 26.4, pm10: 33.5 });
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
