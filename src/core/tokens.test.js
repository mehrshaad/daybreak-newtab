import { describe, expect, it } from "vitest";
import {
  ACCENTS,
  DEFAULTS,
  background,
  backgroundSwatch,
  baseColor,
  darkenFor,
  luminance,
  normalizeAccent,
  onAccentFor,
  tokens,
} from "./tokens";

const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

describe("normalizeAccent", () => {
  it("keeps valid 6-digit hex", () => {
    expect(normalizeAccent("#6f9bff")).toBe("#6f9bff");
    expect(normalizeAccent("#ABCDEF")).toBe("#ABCDEF");
  });

  it("falls back for anything that would break the alpha-suffix trick", () => {
    for (const bad of ["#fff", "red", "", null, undefined, "rgb(0,0,0)"]) {
      expect(normalizeAccent(bad)).toBe(DEFAULTS.accent);
    }
  });
});

describe("luminance", () => {
  it("anchors at black and white", () => {
    expect(luminance("#000000")).toBeCloseTo(0, 5);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("orders light above dark", () => {
    expect(luminance("#e8e6df")).toBeGreaterThan(luminance("#6f9bff"));
  });
});

describe("onAccentFor", () => {
  // The design hardcoded #ffffff for light theme, which is unreadable on the
  // pale swatches. Contrast-picking must beat that for every shipped accent.
  it("returns the dark ink for all six accents", () => {
    for (const a of ACCENTS) expect(onAccentFor(a)).toBe("#0a0b0e");
  });

  it("returns white on genuinely dark accents", () => {
    expect(onAccentFor("#1a1a2e")).toBe("#ffffff");
  });

  it("always picks the higher-contrast option", () => {
    for (const a of [...ACCENTS, "#1a1a2e", "#808080", "#000000", "#ffffff"]) {
      const L = luminance(a);
      const c = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      const chosen = onAccentFor(a);
      const chosenContrast = c(L, luminance(chosen));
      const otherContrast = c(
        L,
        luminance(chosen === "#0a0b0e" ? "#ffffff" : "#0a0b0e")
      );
      expect(chosenContrast).toBeGreaterThanOrEqual(otherContrast);
    }
  });
});

describe("darkenFor", () => {
  it("clears the default 4.5:1 target against a light background for every accent", () => {
    for (const a of ACCENTS) {
      const darkened = darkenFor(a);
      expect(contrast(luminance(darkened), luminance("#f3f3f1"))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("leaves an accent that already clears the target untouched", () => {
    expect(darkenFor("#1a1a2e")).toBe("#1a1a2e");
  });

  it("darkens the near-white accent noticeably", () => {
    const darkened = darkenFor("#e8e6df");
    expect(luminance(darkened)).toBeLessThan(luminance("#e8e6df"));
  });

  it("never returns undefined or breaks on black/white", () => {
    expect(darkenFor("#ffffff")).toMatch(/^#[0-9a-f]{6}$/);
    expect(darkenFor("#000000")).toBe("#000000");
  });

  it("falls back to the default accent for invalid input", () => {
    expect(darkenFor("nope")).toBe(darkenFor(DEFAULTS.accent));
  });
});

describe("tokens", () => {
  it("derives the accent ramp with alpha suffixes", () => {
    const t = tokens("dark", "#6f9bff");
    expect(t["--accent"]).toBe("#6f9bff");
    expect(t["--accentSoft"]).toBe("#6f9bff22");
    expect(t["--accentLine"]).toBe("#6f9bff55");
  });

  it("flips the text ramp between themes", () => {
    const d = tokens("dark", DEFAULTS.accent);
    const l = tokens("light", DEFAULTS.accent);
    expect(d["--fg"]).not.toBe(l["--fg"]);
    expect(d["--panel"]).not.toBe(l["--panel"]);
    expect(d["--danger"]).toBe("#ff8189");
    expect(l["--danger"]).toBe("#c0323c");
  });

  it("keeps --accentText as-is in dark theme but darkens it for light", () => {
    const paleAccent = "#e8e6df";
    const d = tokens("dark", paleAccent);
    const l = tokens("light", paleAccent);
    expect(d["--accentText"]).toBe(paleAccent);
    expect(l["--accentText"]).not.toBe(paleAccent);
    expect(contrast(luminance(l["--accentText"]), luminance("#f3f3f1"))).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it("emits every token as a CSS custom property name", () => {
    for (const key of Object.keys(tokens())) expect(key.startsWith("--")).toBe(true);
  });

  it("never emits undefined values", () => {
    for (const theme of ["dark", "light"]) {
      for (const a of ACCENTS) {
        for (const [k, v] of Object.entries(tokens(theme, a))) {
          expect(v, k).toBeTruthy();
          expect(String(v)).not.toContain("undefined");
        }
      }
    }
  });
});

describe("background", () => {
  it("Flat is the bare base color", () => {
    expect(background("dark", "#6f9bff", "Flat")).toBe("#0a0b0e");
    expect(background("light", "#6f9bff", "Flat")).toBe("#f3f3f1");
  });

  it("Mesh tints with the accent and ends on the base color", () => {
    const bg = background("dark", "#6f9bff", "Mesh");
    expect(bg).toContain("#6f9bff");
    expect(bg.endsWith("#0a0b0e")).toBe(true);
  });

  // The original values were so faint that all four options looked identical,
  // which read as "backgrounds don't work". Each must now carry enough alpha to
  // actually be seen, light theme especially.
  it("every non-flat background is strong enough to perceive", () => {
    const strongestAlpha = (css) => {
      const hexAlphas = [...css.matchAll(/#[0-9a-f]{6}([0-9a-f]{2})/gi)].map((m) =>
        parseInt(m[1], 16) / 255
      );
      return hexAlphas.length ? Math.max(...hexAlphas) : 0;
    };
    for (const theme of ["dark", "light"]) {
      for (const wall of ["Mesh", "Dusk", "Grain"]) {
        expect(strongestAlpha(background(theme, "#6f9bff", wall)), `${theme}/${wall}`)
          .toBeGreaterThan(0.1);
      }
    }
  });

  it("all four backgrounds are visually distinct per theme", () => {
    for (const theme of ["dark", "light"]) {
      const made = ["Flat", "Mesh", "Dusk", "Grain"].map((w) =>
        background(theme, "#6f9bff", w)
      );
      expect(new Set(made).size).toBe(4);
    }
  });

  it("swatches differ from each other too, so the picker is readable", () => {
    for (const theme of ["dark", "light"]) {
      const made = ["Flat", "Mesh", "Dusk", "Grain"].map((w) =>
        backgroundSwatch(theme, "#6f9bff", w)
      );
      expect(new Set(made).size).toBe(4);
    }
  });

  it("Dusk and Grain are distinct from Mesh and each other", () => {
    const made = ["Mesh", "Dusk", "Grain"].map((w) => background("dark", "#6f9bff", w));
    expect(new Set(made).size).toBe(3);
  });

  it("defaults unknown wallpapers to Mesh", () => {
    expect(background("dark", "#6f9bff", "nope")).toBe(
      background("dark", "#6f9bff", "Mesh")
    );
  });

  it("never leaks undefined into a gradient string", () => {
    for (const theme of ["dark", "light"]) {
      for (const w of ["Flat", "Mesh", "Dusk", "Grain"]) {
        expect(background(theme, "#7de2b8", w)).not.toContain("undefined");
      }
    }
  });
});

describe("baseColor", () => {
  it("matches the design's page base per theme", () => {
    expect(baseColor("dark")).toBe("#0a0b0e");
    expect(baseColor("light")).toBe("#f3f3f1");
  });
});
