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
  it("gives every currency one", () => {
    for (const [code] of CURRENCIES) expect(emojiFor(code), code).toBeTruthy();
  });

  it("never repeats one", () => {
    // Two rows carrying the same mark is worse than no marks at all: the mark
    // is there to tell them apart. India's elephant is why Thailand has a
    // tuk-tuk, and Iran's lion is why Singapore has a skyline.
    const used = CURRENCIES.map(([c]) => emojiFor(c));
    expect(new Set(used).size).toBe(used.length);
  });

  it("uses a lion for Iran, as asked", () => {
    expect(emojiFor("IRR")).toBe("🦁");
  });

  it("uses no flags at all", () => {
    // Why this is a table and not derived from the code: Windows has no flag
    // glyphs and paints a regional-indicator pair as two letters, so "US USD"
    // was the code twice. Nothing in here may be one.
    for (const [code] of CURRENCIES) {
      for (const ch of emojiFor(code)) {
        const cp = ch.codePointAt(0);
        expect(cp < 0x1f1e6 || cp > 0x1f1ff, code + " " + ch).toBe(true);
      }
    }
  });

  it("says nothing for something that is not a currency here", () => {
    for (const junk of ["", null, undefined, "XAU", "nonsense"]) {
      expect(emojiFor(junk), String(junk)).toBe("");
    }
  });

  it("is case-insensitive, since a stored config could hold either", () => {
    expect(emojiFor("usd")).toBe(emojiFor("USD"));
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
