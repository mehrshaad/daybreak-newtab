import { describe, expect, it } from "vitest";
import { formatChange, formatPrice, parsePrices, priceUrl } from "./prices";

describe("priceUrl", () => {
  it("uses include_24hr_change, not the 24h spelling", () => {
    expect(priceUrl(["bitcoin"], "usd")).toContain("include_24hr_change=true");
  });

  it("carries the coin ids and fiat", () => {
    const url = priceUrl(["bitcoin", "ethereum"], "eur");
    expect(url).toContain("ids=bitcoin%2Cethereum");
    expect(url).toContain("vs_currencies=eur");
  });

  it("never carries a key", () => {
    expect(priceUrl(["bitcoin"], "usd")).not.toMatch(/key|token|appid/i);
  });
});

describe("parsePrices", () => {
  const data = {
    bitcoin: { usd: 64915, usd_24h_change: 0.98 },
    ethereum: { usd: 1912.8, usd_24h_change: -1.4 },
  };

  it("reads price and change for each requested coin", () => {
    const out = parsePrices(data, ["bitcoin", "ethereum"], "usd");
    expect(out).toEqual([
      { id: "bitcoin", price: 64915, change: 0.98 },
      { id: "ethereum", price: 1912.8, change: -1.4 },
    ]);
  });

  it("keys the change field off the actual fiat, not a hardcoded usd", () => {
    const eurData = { bitcoin: { eur: 56150, eur_24h_change: 2.1 } };
    expect(parsePrices(eurData, ["bitcoin"], "eur")[0].change).toBe(2.1);
  });

  it("drops a coin the response did not return", () => {
    expect(parsePrices(data, ["bitcoin", "dogecoin"], "usd").map((p) => p.id)).toEqual([
      "bitcoin",
    ]);
  });

  it("is null for a missing payload", () => {
    expect(parsePrices(null, ["bitcoin"], "usd")).toBeNull();
  });
});

describe("formatPrice", () => {
  it("uses six decimals under 1", () => {
    expect(formatPrice(0.06992, "usd")).toBe("$0.069920");
  });

  it("uses two decimals between 1 and 100", () => {
    expect(formatPrice(45.58, "usd")).toBe("$45.58");
  });

  it("uses no decimals at 100 or above", () => {
    expect(formatPrice(64915, "usd")).toBe("$64,915");
  });

  it("uses the fiat's own symbol", () => {
    expect(formatPrice(100, "eur")).toBe("€100");
    expect(formatPrice(100, "gbp")).toBe("£100");
  });

  it("is an em dash for missing input", () => {
    expect(formatPrice(null, "usd")).toBe("—");
    expect(formatPrice(NaN, "usd")).toBe("—");
  });
});

describe("formatChange", () => {
  it("signs a positive change", () => {
    expect(formatChange(1.02)).toBe("+1.0%");
  });

  it("keeps the sign a negative change already has", () => {
    expect(formatChange(-1.4)).toBe("-1.4%");
  });

  it("is null for missing input, not a placeholder string", () => {
    expect(formatChange(null)).toBeNull();
    expect(formatChange(undefined)).toBeNull();
  });
});
