import { describe, expect, it } from "vitest";
import {
  chunkArray,
  faviconFromUrl,
  formatDate,
  greeting,
  wmoWeather,
} from "./index";

describe("chunkArray", () => {
  it("splits into chunks of the given size", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("returns empty for empty input", () => {
    expect(chunkArray([], 3)).toEqual([]);
  });
});

describe("wmoWeather", () => {
  it("maps known codes to condition + label", () => {
    expect(wmoWeather(0)).toEqual({ condition: "clear", label: "Clear" });
    expect(wmoWeather(3).condition).toBe("clouds");
    expect(wmoWeather(95).condition).toBe("thunderstorm");
    expect(wmoWeather(71).condition).toBe("snow");
  });
  it("falls back to a safe default for unknown codes", () => {
    expect(wmoWeather(999).condition).toBe("clear");
  });
});

describe("greeting", () => {
  it("includes the name when provided and ends with !", () => {
    expect(greeting("Mehr")).toContain("Mehr");
    expect(greeting("Mehr").endsWith("!")).toBe(true);
  });
  it("omits the name (no comma) when empty", () => {
    expect(greeting("")).not.toContain(",");
  });
  it("uses a time-of-day part", () => {
    expect(greeting("")).toMatch(/^Good (morning|afternoon|evening)!$/);
  });
});

describe("faviconFromUrl", () => {
  it("derives the site's own favicon URL", () => {
    expect(faviconFromUrl("https://github.com/mehrshaad")).toBe(
      "https://github.com/favicon.ico"
    );
  });
  it("returns null for invalid urls", () => {
    expect(faviconFromUrl("not a url")).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats to YYYY-MM-DD", () => {
    expect(formatDate("2026-07-23T10:00:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });
});
