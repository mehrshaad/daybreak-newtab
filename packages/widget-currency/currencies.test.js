import { afterEach, describe, expect, it } from "vitest";
import {
  CURRENCIES,
  flagFor,
  flagGlyph,
  setFlagSupport,
  symbolFor,
} from "./currencies";
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

describe("flagFor", () => {
  // The derivation is only safe because every currency this widget offers
  // starts with its own ISO 3166 country code. Checked one by one rather than
  // trusted, since the first code that breaks the rule would otherwise render
  // two letter boxes and nobody would know why.
  const EXPECTED = {
    AUD: "🇦🇺", BRL: "🇧🇷", CAD: "🇨🇦", CHF: "🇨🇭", CNY: "🇨🇳", CZK: "🇨🇿",
    DKK: "🇩🇰", EUR: "🇪🇺", GBP: "🇬🇧", HKD: "🇭🇰", HUF: "🇭🇺", IDR: "🇮🇩",
    ILS: "🇮🇱", INR: "🇮🇳", IRR: "🇮🇷", ISK: "🇮🇸", JPY: "🇯🇵", KRW: "🇰🇷",
    MXN: "🇲🇽", MYR: "🇲🇾", NOK: "🇳🇴", NZD: "🇳🇿", PHP: "🇵🇭", PLN: "🇵🇱",
    RON: "🇷🇴", SEK: "🇸🇪", SGD: "🇸🇬", THB: "🇹🇭", TRY: "🇹🇷", USD: "🇺🇸",
    ZAR: "🇿🇦",
  };

  it("gives the right flag for every currency offered", () => {
    for (const [code] of CURRENCIES) {
      expect(flagGlyph(code), code).toBe(EXPECTED[code]);
    }
  });

  it("covers the whole list, with nothing left over", () => {
    // If a currency is added above and not here, this is what says so.
    expect(Object.keys(EXPECTED).sort()).toEqual(CURRENCIES.map(([c]) => c).sort());
  });

  it("returns two regional indicators, not letters", () => {
    const flag = [...flagGlyph("USD")];
    expect(flag).toHaveLength(2);
    for (const ch of flag) {
      expect(ch.codePointAt(0)).toBeGreaterThanOrEqual(0x1f1e6);
      expect(ch.codePointAt(0)).toBeLessThanOrEqual(0x1f1ff);
    }
  });

  it("says nothing rather than something wrong", () => {
    // A metal or a drawing right has no country, so it gets no flag instead of
    // a pair of tofu boxes.
    for (const junk of ["", null, undefined, "X", "1US", "$$$"]) {
      expect(flagGlyph(junk), String(junk)).toBe("");
    }
  });

  it("still has a symbol for every currency, since that moved rather than went", () => {
    for (const [code] of CURRENCIES) expect(symbolFor(code), code).toBeTruthy();
  });
});

describe("where flags cannot be drawn", () => {
  afterEach(() => setFlagSupport(null));

  it("shows nothing rather than the country code in letters", () => {
    // Windows has no flag glyphs and paints the two regional indicators as
    // "US", so the row read "US USD": the same thing twice, looking broken.
    setFlagSupport(false);
    for (const [code] of CURRENCIES) expect(flagFor(code), code).toBe("");
  });

  it("shows the flag where it does render", () => {
    setFlagSupport(true);
    expect(flagFor("USD")).toBe(flagGlyph("USD"));
    expect(flagFor("JPY")).toBe(flagGlyph("JPY"));
  });

  it("keeps the mapping testable either way", () => {
    // flagGlyph answers what a code maps to; flagFor answers what to show here.
    setFlagSupport(false);
    expect(flagGlyph("GBP")).toBeTruthy();
    expect(flagFor("GBP")).toBe("");
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
