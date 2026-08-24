import { afterEach, describe, expect, it } from "vitest";
import {
  CURRENCIES,
  emojiFor,
  emojiGlyph,
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

describe("emojiGlyph", () => {
  // The mapping, independent of whether this machine can draw it.
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

  it("gives the right glyph for every currency offered", () => {
    for (const [code] of CURRENCIES) expect(emojiGlyph(code), code).toBe(EXPECTED[code]);
  });

  it("covers the whole list, with nothing left over", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(CURRENCIES.map(([c]) => c).sort());
  });

  it("uses a lion for Iran rather than its flag, by request", () => {
    expect(emojiGlyph("IRR")).toBe("🦁");
    // And it is the only one that is not a pair of regional indicators.
    for (const [code] of CURRENCIES) {
      if (code === "IRR") continue;
      expect([...emojiGlyph(code)], code).toHaveLength(2);
    }
  });

  it("never repeats one", () => {
    const used = CURRENCIES.map(([c]) => emojiGlyph(c));
    expect(new Set(used).size).toBe(used.length);
  });

  it("says nothing rather than something wrong", () => {
    for (const junk of ["", null, undefined, "X", "1US", "$$$"]) {
      expect(emojiGlyph(junk), String(junk)).toBe("");
    }
  });

  it("is case-insensitive, since a stored config could hold either", () => {
    expect(emojiGlyph("usd")).toBe(emojiGlyph("USD"));
    expect(emojiGlyph("irr")).toBe(emojiGlyph("IRR"));
  });
});

describe("emojiFor, which is what the row actually shows", () => {
  afterEach(() => setFlagSupport(null));

  it("shows the glyph where flags render", () => {
    setFlagSupport(true);
    for (const [code] of CURRENCIES) expect(emojiFor(code), code).toBe(emojiGlyph(code));
  });

  it("shows nothing at all where they do not, the lion included", () => {
    // The lion stands in for a flag; it is not a mark Iran gets and the others
    // do not. On Windows, where a regional-indicator pair comes out as its two
    // letters, no row gets one -- otherwise the column is blank except for a
    // single lion halfway down it, which reads as a bug rather than a choice.
    setFlagSupport(false);
    for (const [code] of CURRENCIES) expect(emojiFor(code), code).toBe("");
    expect(emojiFor("IRR")).toBe("");
  });

  it("keeps the lion and the flags together either way", () => {
    // Whatever the platform does, the answer for Iran and the answer for
    // everyone else agree about whether there is a mark at all.
    for (const supported of [true, false]) {
      setFlagSupport(supported);
      expect(!!emojiFor("IRR")).toBe(!!emojiFor("USD"));
    }
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
