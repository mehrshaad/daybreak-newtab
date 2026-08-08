import { describe, expect, it } from "vitest";
import { crossToBase, parseErApi, parseTgju } from "./irr";

describe("parseTgju", () => {
  it("parses the comma-formatted price string", () => {
    expect(parseTgju({ current: { price_dollar_rl: { p: "1,861,900" } } })).toBe(1861900);
  });

  it("parses a value with no commas", () => {
    expect(parseTgju({ current: { price_dollar_rl: { p: "1861900" } } })).toBe(1861900);
  });

  it("rejects a missing payload", () => {
    expect(parseTgju(null)).toBeNull();
    expect(parseTgju({})).toBeNull();
    expect(parseTgju({ current: {} })).toBeNull();
  });

  it("rejects a non-string price", () => {
    expect(parseTgju({ current: { price_dollar_rl: { p: 1861900 } } })).toBeNull();
  });

  it("rejects junk that doesn't parse to a positive number", () => {
    expect(parseTgju({ current: { price_dollar_rl: { p: "n/a" } } })).toBeNull();
    expect(parseTgju({ current: { price_dollar_rl: { p: "-5" } } })).toBeNull();
    expect(parseTgju({ current: { price_dollar_rl: { p: "0" } } })).toBeNull();
  });
});

describe("parseErApi", () => {
  it("reads rates.IRR", () => {
    expect(parseErApi({ rates: { IRR: 1319000 } })).toBe(1319000);
  });

  it("rejects a missing or invalid rate", () => {
    expect(parseErApi(null)).toBeNull();
    expect(parseErApi({})).toBeNull();
    expect(parseErApi({ rates: {} })).toBeNull();
    expect(parseErApi({ rates: { IRR: "1319000" } })).toBeNull();
    expect(parseErApi({ rates: { IRR: -1 } })).toBeNull();
    expect(parseErApi({ rates: { IRR: 0 } })).toBeNull();
  });
});

describe("crossToBase", () => {
  it("passes the USD rate through unchanged when base is USD", () => {
    expect(crossToBase(1861900, 1)).toBe(1861900);
  });

  it("crosses through a non-USD base rate", () => {
    // 1 EUR = 1.08 USD, so 1 EUR should be worth 1.08x the USD rate in IRR.
    expect(crossToBase(1861900, 1.08)).toBeCloseTo(2010852, 0);
  });

  it("is null-safe for non-finite inputs", () => {
    expect(crossToBase(null, 1.08)).toBeNull();
    expect(crossToBase(1861900, null)).toBeNull();
    expect(crossToBase(NaN, 1.08)).toBeNull();
  });
});
