import { describe, expect, it } from "vitest";
import { formatRate, parseRates, ratesUrl } from "./rates";

describe("ratesUrl", () => {
  it("asks the current Frankfurter host, not the old redirecting one", () => {
    expect(ratesUrl("USD", ["EUR", "GBP"])).toMatch(
      /^https:\/\/api\.frankfurter\.dev\/v1\/latest\?/
    );
  });

  it("carries the base and target list", () => {
    const url = ratesUrl("USD", ["EUR", "GBP"]);
    expect(url).toContain("from=USD");
    expect(url).toContain("to=EUR%2CGBP");
  });

  it("omits &to= with no targets", () => {
    expect(ratesUrl("USD", [])).not.toContain("to=");
  });

  it("never carries a key, token or similar", () => {
    expect(ratesUrl("USD", ["EUR"])).not.toMatch(/key|token|appid/i);
  });
});

describe("formatRate", () => {
  it("uses more decimals under 1", () => {
    expect(formatRate(0.0067)).toBe("0.0067");
  });

  it("uses two decimals between 1 and 100", () => {
    expect(formatRate(1.1535)).toBe("1.15");
  });

  it("uses no decimals at 100 or above", () => {
    expect(formatRate(157.32)).toBe("157");
  });

  it("is an em dash for missing or invalid input", () => {
    expect(formatRate(null)).toBe("—");
    expect(formatRate(undefined)).toBe("—");
    expect(formatRate(NaN)).toBe("—");
  });
});

describe("parseRates", () => {
  const data = { base: "EUR", date: "2026-08-07", rates: { USD: 1.1535, GBP: 0.85765 } };

  it("keeps the caller's target order, not the response's", () => {
    expect(parseRates(data, ["GBP", "USD"]).pairs.map((p) => p.code)).toEqual(["GBP", "USD"]);
  });

  it("falls back to the response's own keys with no targets given", () => {
    expect(parseRates(data, []).pairs.map((p) => p.code)).toEqual(["USD", "GBP"]);
  });

  it("drops a requested code the response did not return", () => {
    expect(parseRates(data, ["USD", "JPY"]).pairs.map((p) => p.code)).toEqual(["USD"]);
  });

  it("carries the base and date through", () => {
    const r = parseRates(data, ["USD"]);
    expect(r.base).toBe("EUR");
    expect(r.date).toBe("2026-08-07");
  });

  it("is null for a malformed payload", () => {
    expect(parseRates({}, ["USD"])).toBeNull();
    expect(parseRates(null, ["USD"])).toBeNull();
  });
});

describe("formatRate with a fixed number of places", () => {
  it("overrides the automatic choice at every magnitude", () => {
    // The point of the option: automatic gives 1.0834 two places and hides the
    // fourth, which is where a pair being watched closely actually moves.
    expect(formatRate(1.0834)).toBe("1.08");
    expect(formatRate(1.0834, "4")).toBe("1.0834");
    expect(formatRate(42000, "2")).toBe("42,000.00");
    expect(formatRate(0.0067, "2")).toBe("0.01");
  });

  it("falls back to automatic for anything that is not a number", () => {
    expect(formatRate(1.0834, "auto")).toBe("1.08");
    expect(formatRate(1.0834, undefined)).toBe("1.08");
    expect(formatRate(1.0834, "some nonsense")).toBe("1.08");
  });

  it("still has nothing to say about a missing rate", () => {
    expect(formatRate(null, "4")).toBe("—");
  });
});
