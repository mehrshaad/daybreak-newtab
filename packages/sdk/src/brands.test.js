import { describe, expect, it } from "vitest";
import {
  BRANDS,
  brandFor,
  brandForLink,
  brandForUrl,
  inkSafeGradient,
  whiteContrast,
} from "./brands";

describe("brandForUrl", () => {
  it("reads the brand off a plain domain", () => {
    expect(brandForUrl("https://github.com")).toBe(BRANDS.github);
    expect(brandForUrl("https://www.youtube.com/feed")).toBe(BRANDS.youtube);
  });

  it("accepts an address with no scheme, the way the add form does", () => {
    expect(brandForUrl("figma.com")).toBe(BRANDS.figma);
  });

  it("prefers the longest host match, so a subdomain beats its parent", () => {
    expect(brandForUrl("https://mail.google.com/mail/u/0")).toBe(BRANDS.gmail);
    expect(brandForUrl("https://drive.google.com")).toBe(BRANDS.drive);
    expect(brandForUrl("https://google.com")).toBe(BRANDS.google);
  });

  it("looks past a subdomain that names nothing", () => {
    expect(brandForUrl("https://en.wikipedia.org/wiki/Chrome")).toBe(BRANDS.wikipedia);
    expect(brandForUrl("https://open.spotify.com/album/1")).toBe(BRANDS.spotify);
    expect(brandForUrl("https://gist.github.com/x")).toBe(BRANDS.github);
  });

  it("handles a two-part public suffix", () => {
    // The brand label is the one before "co.uk", not "co".
    expect(brandForUrl("https://www.bbc.co.uk")).toBe(null);
    expect(brandForUrl("https://amazon.co.uk")).toBe(BRANDS.amazon);
  });

  it("resolves short share domains to the site they belong to", () => {
    expect(brandForUrl("https://youtu.be/abc")).toBe(BRANDS.youtube);
    expect(brandForUrl("https://t.me/somechannel")).toBe(BRANDS.telegram);
    expect(brandForUrl("https://dev.to/post")).toBe(BRANDS.devto);
  });

  it("gives nothing rather than a borrowed mark", () => {
    expect(brandForUrl("https://example.com")).toBe(null);
    expect(brandForUrl("not a url at all ://")).toBe(null);
    expect(brandForUrl("")).toBe(null);
  });
});

describe("brandForLink", () => {
  it("lets the address win over whatever the link was called", () => {
    expect(brandForLink("https://github.com", "Work")).toBe(BRANDS.github);
  });

  it("falls back to the name when the address is unknown", () => {
    expect(brandForLink("https://mail.example.com", "Gmail")).toBe(BRANDS.gmail);
  });

  it("has nothing to offer for an unknown pair", () => {
    expect(brandForLink("https://example.com", "Scratch")).toBe(null);
  });
});

describe("brandFor", () => {
  it("still resolves a display name", () => {
    expect(brandFor("GitHub")).toBe(BRANDS.github);
    expect(brandFor("Google Drive")).toBe(BRANDS.drive);
  });
});

describe("inkSafeGradient", () => {
  // The property, not the output: every brand in the table has to end up able
  // to carry the white glyph the tile draws, whatever colour it started as.
  it("leaves every brand dark enough for a white glyph", () => {
    for (const [key, brand] of Object.entries(BRANDS)) {
      const safe = inkSafeGradient(brand.from, brand.to);
      expect(whiteContrast(safe.to), key).toBeGreaterThanOrEqual(3);
    }
  });

  it("leaves a brand that was already dark exactly as it was", () => {
    for (const key of ["github", "youtube", "docs", "sheets"]) {
      const brand = BRANDS[key];
      expect(inkSafeGradient(brand.from, brand.to), key).toEqual({
        from: brand.from,
        to: brand.to,
      });
    }
  });

  it("darkens the bright ones, and moves both stops together", () => {
    for (const key of ["drive", "slides", "keep", "snapchat", "buymeacoffee"]) {
      const brand = BRANDS[key];
      const safe = inkSafeGradient(brand.from, brand.to);
      expect(safe.to, key).not.toBe(brand.to);
      // One factor for both stops, so the gradient keeps its direction rather
      // than flattening as the darker end catches up with the lighter one.
      expect(whiteContrast(safe.from), key).toBeLessThan(whiteContrast(safe.to));
    }
  });

  it("holds the hue by keeping the channel ratios", () => {
    // #f4b400 has no blue at all, and a hue shift is exactly what would put
    // some there. Red and green must stay in the same proportion too.
    const safe = inkSafeGradient(BRANDS.drive.from, BRANDS.drive.to);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(safe.to.slice(i, i + 2), 16));
    expect(b).toBe(0);
    expect(r / g).toBeCloseTo(244 / 180, 1);
  });
});

describe("BRANDS", () => {
  it("gives every entry a real glyph and both gradient stops", () => {
    for (const [key, brand] of Object.entries(BRANDS)) {
      expect(brand.Glyph, key).toBeTruthy();
      expect(brand.from, key).toMatch(/^#[0-9a-f]{6}$/i);
      expect(brand.to, key).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
