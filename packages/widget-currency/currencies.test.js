import { describe, expect, it } from "vitest";
import { CURRENCIES, symbolFor } from "./currencies";

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
