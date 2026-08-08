import { describe, expect, it } from "vitest";
import { formatChange, formatPrice, parsePrices, priceUrl } from "./prices";

describe("priceUrl", () => {
  it("hits /coins/markets with sparkline and 24h change requested", () => {
    const url = priceUrl(["bitcoin"], "usd");
    expect(url).toContain("/coins/markets");
    expect(url).toContain("sparkline=true");
    expect(url).toContain("price_change_percentage=24h");
  });

  it("carries the coin ids and fiat", () => {
    const url = priceUrl(["bitcoin", "ethereum"], "eur");
    expect(url).toContain("ids=bitcoin%2Cethereum");
    expect(url).toContain("vs_currency=eur");
  });

  it("never carries a key", () => {
    expect(priceUrl(["bitcoin"], "usd")).not.toMatch(/key|token|appid/i);
  });
});

describe("parsePrices", () => {
  const data = [
    {
      id: "bitcoin",
      current_price: 64915,
      price_change_percentage_24h: 0.98,
      image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
      sparkline_in_7d: { price: [64000, 64500, 64915] },
    },
    {
      id: "ethereum",
      current_price: 1912.8,
      price_change_percentage_24h: -1.4,
      image: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png",
      sparkline_in_7d: { price: [1950, 1930, 1912.8] },
    },
  ];

  it("reads price, change, logo and sparkline for each requested coin", () => {
    const out = parsePrices(data, ["bitcoin", "ethereum"]);
    expect(out).toEqual([
      {
        id: "bitcoin",
        price: 64915,
        change: 0.98,
        image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
        sparkline: [64000, 64500, 64915],
      },
      {
        id: "ethereum",
        price: 1912.8,
        change: -1.4,
        image: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png",
        sparkline: [1950, 1930, 1912.8],
      },
    ]);
  });

  it("keeps the caller's watchlist order, not the response's", () => {
    expect(parsePrices(data, ["ethereum", "bitcoin"]).map((p) => p.id)).toEqual([
      "ethereum",
      "bitcoin",
    ]);
  });

  it("drops a coin the response did not return", () => {
    expect(parsePrices(data, ["bitcoin", "dogecoin"]).map((p) => p.id)).toEqual([
      "bitcoin",
    ]);
  });

  it("is null-safe for a missing sparkline or logo", () => {
    const bare = [{ id: "bitcoin", current_price: 64915 }];
    expect(parsePrices(bare, ["bitcoin"])[0]).toMatchObject({
      image: null,
      sparkline: null,
    });
  });

  it("is null for a missing or malformed payload", () => {
    expect(parsePrices(null, ["bitcoin"])).toBeNull();
    expect(parsePrices({ bitcoin: {} }, ["bitcoin"])).toBeNull();
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
