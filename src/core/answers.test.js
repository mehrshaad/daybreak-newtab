import { describe, expect, it } from "vitest";
import { answerFor, convert, evaluate, formatNumber, parseQuantity } from "./answers";

describe("evaluate", () => {
  it("respects precedence", () => {
    expect(evaluate("2+3*4")).toBe(14);
    expect(evaluate("2*3+4")).toBe(10);
    expect(evaluate("1+2*3-4/2")).toBe(5);
    expect(evaluate("10-2-3")).toBe(5); // left associative, not 11
  });

  it("respects parentheses", () => {
    expect(evaluate("(2+3)*4")).toBe(20);
    expect(evaluate("2*(3+(4-1))")).toBe(12);
    expect(evaluate("((7))")).toBe(7);
  });

  it("handles unary minus", () => {
    expect(evaluate("-5+2")).toBe(-3);
    expect(evaluate("2*-3")).toBe(-6);
    expect(evaluate("-(3+4)")).toBe(-7);
    expect(evaluate("--4")).toBe(4);
    expect(evaluate("+7")).toBe(7);
  });

  it("makes ^ right associative and binds unary minus outside it", () => {
    expect(evaluate("2^3^2")).toBe(512); // 2^(3^2), not (2^3)^2
    expect(evaluate("-2^2")).toBe(-4); // -(2^2), as in a spreadsheet
    expect(evaluate("2^-2")).toBe(0.25);
    expect(evaluate("(-2)^2")).toBe(4);
    expect(evaluate("9^0.5")).toBe(3);
  });

  it("treats % as modulo inside an expression", () => {
    expect(evaluate("17%5")).toBe(2);
    expect(evaluate("17 % 5")).toBe(2);
    expect(evaluate("10%3*2")).toBe(2); // same precedence as *, left to right
  });

  it("knows pi and e", () => {
    expect(evaluate("2*pi")).toBeCloseTo(Math.PI * 2, 12);
    expect(evaluate("PI/2")).toBeCloseTo(Math.PI / 2, 12);
    expect(evaluate("e^2")).toBeCloseTo(Math.E ** 2, 12);
    expect(evaluate("2*π")).toBeCloseTo(Math.PI * 2, 12);
  });

  it("accepts grouped thousands separators and rejects ungrouped commas", () => {
    expect(evaluate("1,000*2")).toBe(2000);
    expect(evaluate("1,234,567+1")).toBe(1234568);
    // A European decimal comma must not silently become 15.
    expect(evaluate("1,5+1")).toBe(null);
    expect(evaluate("1,00*2")).toBe(null);
  });

  it("accepts unicode operators, ** and a trailing =", () => {
    expect(evaluate("6×7")).toBe(42);
    expect(evaluate("84÷2")).toBe(42);
    expect(evaluate("2**8")).toBe(256);
    expect(evaluate("2+2=")).toBe(4);
    expect(evaluate("=2+2")).toBe(4);
    expect(evaluate("5−3")).toBe(2); // U+2212 minus
  });

  it("rejects malformed input rather than guessing", () => {
    for (const bad of ["2+", "*2", "(2+3", "2+3)", "()", "2 3", "2 pi", "", "   ", "2!3", "2&3"]) {
      expect(evaluate(bad)).toBe(null);
    }
  });

  it("rejects results that are not finite", () => {
    expect(evaluate("1/0")).toBe(null);
    expect(evaluate("0/0")).toBe(null);
    expect(evaluate("(-8)^0.5")).toBe(null);
    expect(evaluate("9^9^9")).toBe(null); // overflows to Infinity
  });
});

describe("formatNumber", () => {
  it("prints integers in full with thousands separators", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(-1234)).toBe("-1,234");
    expect(formatNumber(1e12)).toBe("1,000,000,000,000");
  });

  it("trims float padding and dust", () => {
    expect(formatNumber(0.5)).toBe("0.5");
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(formatNumber(1 / 3)).toBe("0.333333");
    expect(formatNumber(-2.5)).toBe("-2.5");
    expect(formatNumber(1234.5)).toBe("1,234.5");
  });

  it("falls back to exponent form outside the readable window", () => {
    // An exact integer is printed in full up to 2^53, so the exponent form is
    // for the far side of that and for anything too small to show.
    expect(formatNumber(1e16)).toBe("1e+16");
    expect(formatNumber(1234567890123.5)).toBe("1.2346e+12");
    expect(formatNumber(2e-9)).toBe("2e-9");
    expect(formatNumber(1.23e-7)).toBe("1.23e-7");
  });

  it("returns null for anything not a finite number", () => {
    for (const bad of [Infinity, -Infinity, NaN, null, undefined, "5"]) {
      expect(formatNumber(bad)).toBe(null);
    }
  });
});

describe("convert", () => {
  it("converts length against known values", () => {
    expect(convert(1, "mi", "km")).toBeCloseTo(1.609344, 9);
    expect(convert(1, "in", "cm")).toBeCloseTo(2.54, 9);
    expect(convert(1, "ft", "in")).toBeCloseTo(12, 9);
    expect(convert(1, "yd", "ft")).toBeCloseTo(3, 9);
    expect(convert(1000, "mm", "m")).toBeCloseTo(1, 9);
    expect(convert(1, "km", "m")).toBeCloseTo(1000, 9);
  });

  it("converts mass against known values", () => {
    expect(convert(1, "kg", "g")).toBeCloseTo(1000, 9);
    expect(convert(1, "lb", "oz")).toBeCloseTo(16, 9);
    expect(convert(1, "st", "lb")).toBeCloseTo(14, 9);
    expect(convert(1, "kg", "lb")).toBeCloseTo(2.2046226218, 8);
    expect(convert(1000, "mg", "g")).toBeCloseTo(1, 9);
  });

  it("converts data, decimal and binary kept apart", () => {
    expect(convert(1, "kb", "b")).toBe(1000);
    expect(convert(1, "kib", "b")).toBe(1024);
    expect(convert(1, "gib", "mib")).toBe(1024);
    expect(convert(1, "tb", "gb")).toBeCloseTo(1000, 9);
    expect(convert(1, "gib", "gb")).toBeCloseTo(1.073741824, 9);
  });

  it("converts time", () => {
    expect(convert(1, "h", "min")).toBeCloseTo(60, 9);
    expect(convert(1, "wk", "h")).toBeCloseTo(168, 9);
    expect(convert(1, "d", "s")).toBeCloseTo(86400, 9);
    expect(convert(2500, "ms", "s")).toBeCloseTo(2.5, 9);
  });

  it("converts speed", () => {
    expect(convert(1, "kn", "kmh")).toBeCloseTo(1.852, 9);
    expect(convert(60, "mph", "kmh")).toBeCloseTo(96.56064, 9);
    expect(convert(100, "kmh", "ms")).toBeCloseTo(27.777777777, 8);
    expect(convert(1, "mph", "kmh")).toBeCloseTo(1.609344, 9);
  });

  it("converts temperature both ways, offset included", () => {
    expect(convert(0, "c", "f")).toBeCloseTo(32, 9);
    expect(convert(100, "c", "f")).toBeCloseTo(212, 9);
    expect(convert(-40, "c", "f")).toBeCloseTo(-40, 9);
    expect(convert(98.6, "f", "c")).toBeCloseTo(37, 9);
    expect(convert(0, "c", "k")).toBeCloseTo(273.15, 9);
    expect(convert(300, "k", "c")).toBeCloseTo(26.85, 9);
    expect(convert(32, "f", "k")).toBeCloseTo(273.15, 9);
  });

  it("refuses to cross families", () => {
    expect(convert(1, "kg", "cm")).toBe(null);
    expect(convert(1, "km", "s")).toBe(null);
    expect(convert(1, "c", "kg")).toBe(null);
    expect(convert(1, "mb", "min")).toBe(null);
    expect(convert(1, "km", "nonsense")).toBe(null);
  });
});

describe("parseQuantity", () => {
  it("reads single and compound quantities", () => {
    expect(parseQuantity("12 km")).toEqual([{ value: 12, unit: "km" }]);
    expect(parseQuantity("93f")).toEqual([{ value: 93, unit: "f" }]);
    expect(parseQuantity("5ft 7in")).toEqual([
      { value: 5, unit: "ft" },
      { value: 7, unit: "in" },
    ]);
    expect(parseQuantity("-40 °C")).toEqual([{ value: -40, unit: "°c" }]);
    expect(parseQuantity("1,500 kg")).toEqual([{ value: 1500, unit: "kg" }]);
  });

  it("rejects anything with prose or a stray token in it", () => {
    // "10 000 km" is space-grouped thousands: the gap before "000 km" is what
    // stops it being read as 0 km.
    const bad = ["how many cm", "12", "km", "1 day in the life", "10 000 km", "12 km!", ""];
    for (const q of bad) expect(parseQuantity(q), q).toBe(null);
  });
});

// Displayed to six significant figures, not six decimal places: six decimals is
// right for 0.000123 and absurd for a temperature. That is why the expectations
// below carry the digits they do.
describe("answerFor: calculations", () => {
  it("answers a sum with the value, the display and the echoed input", () => {
    expect(answerFor("2+3*4")).toEqual({
      kind: "calc",
      value: 14,
      display: "14",
      detail: "2 + 3 × 4",
    });
  });

  it("echoes the input in canonical form", () => {
    expect(answerFor("(2+3)*4").detail).toBe("(2 + 3) × 4");
    expect(answerFor("100/8").detail).toBe("100 ÷ 8");
    expect(answerFor("2*-3").detail).toBe("2 × -3"); // a prefix sign stays glued on
    expect(answerFor("1,000*2").detail).toBe("1,000 × 2");
    expect(answerFor("2*pi").detail).toBe("2 × π");
  });

  it("formats the answer for a search-box row", () => {
    expect(answerFor("100/8").display).toBe("12.5");
    expect(answerFor("2^10").display).toBe("1,024");
    expect(answerFor("2*pi").display).toBe("6.28319");
    expect(answerFor("2+2=").display).toBe("4");
  });
});

describe("answerFor: percentages", () => {
  it("answers '15% of 240'", () => {
    expect(answerFor("15% of 240")).toEqual({
      kind: "percent",
      value: 36,
      display: "36",
      detail: "15% of 240",
    });
  });

  it("answers a percentage of an expression", () => {
    expect(answerFor("15% of 2*120")).toMatchObject({ value: 36, detail: "15% of 2 × 120" });
    expect(answerFor("7.5% of 1,000")).toMatchObject({ value: 75 });
  });

  it("answers '240 + 15%' and '240 - 15%'", () => {
    expect(answerFor("240 + 15%")).toEqual({
      kind: "percent",
      value: 276,
      display: "276",
      detail: "240 + 15%",
    });
    expect(answerFor("240 - 15%")).toMatchObject({ value: 204 });
    expect(answerFor("(20*3) + 10%")).toMatchObject({ value: 66, detail: "(20 × 3) + 10%" });
  });

  it("does not read a percentage where there is no question", () => {
    for (const bad of ["15%", "100%", "% of 240", "15% of", "up 5%", "15% of bread"]) {
      expect(answerFor(bad)).toBe(null);
    }
  });
});

describe("answerFor: conversions", () => {
  it("answers '12 km in mi'", () => {
    expect(answerFor("12 km in mi")).toEqual({
      kind: "convert",
      value: convert(12, "km", "mi"),
      display: "7.45645 mi",
      detail: "12 km",
    });
  });

  it("answers a temperature in either direction", () => {
    expect(answerFor("93f to c")).toMatchObject({ display: "33.8889 °C", detail: "93 °F" });
    expect(answerFor("100 c in f")).toMatchObject({ display: "212 °F", detail: "100 °C" });
    expect(answerFor("-40 c in f")).toMatchObject({ value: -40, display: "-40 °F" });
    expect(answerFor("21°c in f")).toMatchObject({ display: "69.8 °F" });
    expect(answerFor("300 kelvin in celsius")).toMatchObject({ display: "26.85 °C" });
  });

  it("answers a compound quantity", () => {
    expect(answerFor("5ft 7in in cm")).toEqual({
      kind: "convert",
      value: convert(5, "ft", "cm") + convert(7, "in", "cm"),
      display: "170.18 cm",
      detail: "5 ft 7 in",
    });
    // The last "in" is the separator, the earlier one is inches.
    expect(answerFor("12 in in mm")).toMatchObject({ display: "304.8 mm", detail: "12 in" });
    expect(answerFor("1 h 30 min in min")).toMatchObject({
      display: "90 min",
      detail: "1 h 30 min",
    });
    // Mixing families inside a compound is not a quantity.
    expect(answerFor("5ft 7kg in cm")).toBe(null);
  });

  it("accepts every separator form", () => {
    const forms = ["in", "to", "into", "as"].map((word) => `12 km ${word} mi`);
    for (const q of [...forms, "12km->mi", "12km=>mi", "12km>mi", "12 km → mi"]) {
      expect(answerFor(q), q).toMatchObject({ display: "7.45645 mi" });
    }
  });

  it("answers one known value per family", () => {
    expect(answerFor("1 mi in km").display).toBe("1.60934 km");
    expect(answerFor("100 lb in kg").display).toBe("45.3592 kg");
    expect(answerFor("1 gib in mib").display).toBe("1,024 MiB");
    expect(answerFor("1 kb in b").display).toBe("1,000 B");
    expect(answerFor("90 min in h").display).toBe("1.5 h");
    expect(answerFor("60 mph in kmh").display).toBe("96.5606 km/h");
    expect(answerFor("1 stone in kg").display).toBe("6.35029 kg");
  });

  it("resolves the ms ambiguity from the other side of the conversion", () => {
    expect(answerFor("100 ms in s")).toMatchObject({ value: 0.1, display: "0.1 s" });
    expect(answerFor("10 ms in kmh")).toMatchObject({ value: 36, display: "36 km/h" });
  });

  it("refuses a conversion that does not mean anything", () => {
    for (const bad of ["1 kg in cm", "12 m in s", "5 c in kg", "1 mb in min", "20 c 30 f in k"]) {
      expect(answerFor(bad)).toBe(null);
    }
  });
});

describe("answerFor: not an answer", () => {
  it("leaves ordinary searches alone", () => {
    const searches = [
      "how to make bread",
      "3 idiots",
      "e2e tests",
      "42",
      "1,000",
      "-5",
      "3.14",
      "pi",
      "e",
      "weather",
      "gmail",
      "windows 11",
      "python 3.11",
      "top 10 movies",
      "2 for 1",
      "back to school",
      "1 day in the life",
      "one in a million",
      "in n out",
      "half life 2",
      "how many cm in 12 km",
      "10 minutes in the shower",
      "5 to 10",
      "1 in 3",
      "12 in mm",
      "cm to in",
      "m to f",
      "2 x 3",
      "s&p 500 + 2%",
      "(42)",
      "",
      "   ",
    ];
    for (const q of searches) expect(answerFor(q), q).toBe(null);
  });

  it("leaves dates and the slash idioms alone", () => {
    expect(answerFor("9/11")).toBe(null);
    expect(answerFor("24/7")).toBe(null);
    expect(answerFor("1/2/2024")).toBe(null);
    expect(answerFor("9/11/2001")).toBe(null);
    // Spacing it out is the way to ask for the division anyway.
    expect(answerFor("9 / 11")).toMatchObject({ kind: "calc", display: "0.818182" });
    // Other two-number slash forms are still divisions — blocking every one of
    // them would cost far more than the two idioms above.
    expect(answerFor("100/8")).toMatchObject({ value: 12.5 });
    expect(answerFor("22/7")).toMatchObject({ display: "3.14286" });
  });

  // The most expensive false positive of the lot: these already have a row of
  // their own ("Go to site"), and a dotted host is only digits and dots away
  // from looking like arithmetic.
  it("leaves addresses to the Go to site row", () => {
    for (const q of [
      "google.com",
      "news.ycombinator.com",
      "localhost:3000",
      "192.168.1.1",
      "8.8.8.8",
      "1.5.2",
      "chrome://flags",
    ]) {
      expect(answerFor(q), q).toBe(null);
    }
  });

  it("does not read 'e' as an exponent marker", () => {
    expect(answerFor("1e3")).toBe(null);
    expect(answerFor("2e2 in mm")).toBe(null);
  });

  it("does not answer a query long enough to be prose", () => {
    expect(answerFor(`${"1+".repeat(80)}1`)).toBe(null);
  });

  it("survives non-string input", () => {
    expect(answerFor(null)).toBe(null);
    expect(answerFor(undefined)).toBe(null);
    expect(answerFor(42)).toBe(null); // a bare number is a search
    expect(answerFor({})).toBe(null);
  });
});
