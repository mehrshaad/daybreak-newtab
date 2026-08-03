import { describe, expect, it } from "vitest";
import {
  SEARCH_ENGINES,
  clamp,
  classNames,
  formatDate,
  greeting,
  uid,
  wmoWeather,
} from "./index";

describe("classNames", () => {
  it("joins truthy classes and drops the rest", () => {
    expect(classNames("a", undefined, "b", false, null, "", "c")).toBe("a b c");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(classNames(undefined, false)).toBe("");
  });
});

describe("wmoWeather", () => {
  it("maps known WMO codes", () => {
    expect(wmoWeather(0)).toEqual({ condition: "clear", label: "Clear" });
    expect(wmoWeather(95).condition).toBe("thunderstorm");
    expect(wmoWeather(71).condition).toBe("snow");
  });

  it("falls back for unknown codes", () => {
    expect(wmoWeather(1234)).toEqual({ condition: "clear", label: "—" });
  });
});

describe("greeting", () => {
  const at = (h) => new Date(2026, 0, 1, h, 0, 0);

  it("picks the daypart", () => {
    expect(greeting("", at(9))).toBe("Good morning");
    expect(greeting("", at(13))).toBe("Good afternoon");
    expect(greeting("", at(20))).toBe("Good evening");
  });

  it("personalizes when a name is set", () => {
    expect(greeting("Sara", at(9))).toBe("Good morning, Sara");
  });

  it("ignores whitespace-only names", () => {
    expect(greeting("   ", at(9))).toBe("Good morning");
  });

  it("covers the daypart boundaries", () => {
    expect(greeting("", at(0))).toBe("Good morning");
    expect(greeting("", at(11))).toBe("Good morning");
    expect(greeting("", at(12))).toBe("Good afternoon");
    expect(greeting("", at(17))).toBe("Good afternoon");
    expect(greeting("", at(18))).toBe("Good evening");
    expect(greeting("", at(23))).toBe("Good evening");
  });
});

describe("formatDate", () => {
  it("pads to YYYY-MM-DD", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDate(new Date(2026, 11, 25))).toBe("2026-12-25");
  });
});

describe("SEARCH_ENGINES", () => {
  it("every engine has a label and an https query url", () => {
    for (const [key, e] of Object.entries(SEARCH_ENGINES)) {
      expect(e.label, key).toBeTruthy();
      expect(e.url.startsWith("https://"), key).toBe(true);
      expect(e.url.endsWith("="), key).toBe(true);
    }
  });
});

describe("clamp", () => {
  it("bounds both ends and passes through the middle", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("uid", () => {
  it("produces distinct ids", () => {
    const ids = new Set(Array.from({ length: 200 }, uid));
    expect(ids.size).toBe(200);
  });
});
