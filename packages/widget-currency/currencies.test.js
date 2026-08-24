import { describe, expect, it } from "vitest";
import { CURRENCIES, emojiFor, symbolFor } from "./currencies";
import manifest from "./manifest";
import clocks from "../widget-worldclocks/manifest";

describe("symbolFor", () => {
  it("returns the mapped symbol for a known code", () => {
    expect(symbolFor("USD")).toBe("$");
    expect(symbolFor("EUR")).toBe("€");
    expect(symbolFor("IRR")).toBe("﷼");
  });

  it("falls back to the code itself for anything unmapped", () => {
    expect(symbolFor("XYZ")).toBe("XYZ");
  });

  it("has a real symbol mapped for every currency in the bundled list", () => {
    // Every code here is expected to be in the SYMBOLS table already, not
    // silently falling back to its own code.
    for (const [code] of CURRENCIES) {
      expect(symbolFor(code)).not.toBe(code);
    }
  });
});

describe("emojiFor", () => {
  // Derived from the code, so this checks the derivation lands on the right
  // country one at a time rather than trusting the rule.
  const EXPECTED = {
    AUD: "🇦🇺", BRL: "🇧🇷", CAD: "🇨🇦",
    CHF: "🇨🇭", CNY: "🇨🇳", CZK: "🇨🇿",
    DKK: "🇩🇰", EUR: "🇪🇺", GBP: "🇬🇧",
    HKD: "🇭🇰", HUF: "🇭🇺", IDR: "🇮🇩",
    ILS: "🇮🇱", INR: "🇮🇳", IRR: "🦁",
    ISK: "🇮🇸", JPY: "🇯🇵", KRW: "🇰🇷",
    MXN: "🇲🇽", MYR: "🇲🇾", NOK: "🇳🇴",
    NZD: "🇳🇿", PHP: "🇵🇭", PLN: "🇵🇱",
    RON: "🇷🇴", SEK: "🇸🇪", SGD: "🇸🇬",
    THB: "🇹🇭", TRY: "🇹🇷", USD: "🇺🇸",
    ZAR: "🇿🇦",
  };

  it("gives the right flag for every currency offered", () => {
    for (const [code] of CURRENCIES) expect(emojiFor(code), code).toBe(EXPECTED[code]);
  });

  it("covers the whole list, with nothing left over", () => {
    // Add a currency above without adding it here and this is what says so.
    expect(Object.keys(EXPECTED).sort()).toEqual(CURRENCIES.map(([c]) => c).sort());
  });

  it("uses a lion for Iran rather than its flag, by request", () => {
    expect(emojiFor("IRR")).toBe("🦁");
    // And it is the one exception: everything else is a pair of indicators.
    for (const [code] of CURRENCIES) {
      if (code === "IRR") continue;
      expect([...emojiFor(code)], code).toHaveLength(2);
    }
  });

  it("never repeats one", () => {
    const used = CURRENCIES.map(([c]) => emojiFor(c));
    expect(new Set(used).size).toBe(used.length);
  });

  it("builds real regional indicators, not letters", () => {
    for (const ch of emojiFor("USD")) {
      expect(ch.codePointAt(0)).toBeGreaterThanOrEqual(0x1f1e6);
      expect(ch.codePointAt(0)).toBeLessThanOrEqual(0x1f1ff);
    }
  });

  it("says nothing rather than something wrong", () => {
    // A metal or a drawing right has no country, so it gets nothing instead of
    // a pair of tofu boxes.
    for (const junk of ["", null, undefined, "X", "1US", "$$$"]) {
      expect(emojiFor(junk), String(junk)).toBe("");
    }
  });

  it("is case-insensitive, since a stored config could hold either", () => {
    expect(emojiFor("usd")).toBe(emojiFor("USD"));
    expect(emojiFor("irr")).toBe(emojiFor("IRR"));
  });

  it("still has a symbol for every currency, since that moved rather than went", () => {
    for (const [code] of CURRENCIES) expect(symbolFor(code), code).toBeTruthy();
  });
});

describe("the two text sizes", () => {
  it("offers exactly two, with regular the default", () => {
    const o = manifest.options.find((x) => x.key === "textSize");
    expect(o.of).toEqual(["regular", "large"]);
    expect(o.default).toBe("regular");
    for (const v of o.of) expect(o.labels[v], v).toBeTruthy();
  });

  it("matches the shape World Clocks uses, so the two do not drift", () => {
    // Same key, same values, same default: two widgets offering "text size"
    // should mean the same thing by it.
    const mine = manifest.options.find((x) => x.key === "textSize");
    expect(mine.of).toEqual(clocks.options.find((x) => x.key === "textSize").of);
    expect(mine.default).toBe(clocks.options.find((x) => x.key === "textSize").default);
  });
});
