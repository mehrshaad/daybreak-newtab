import { describe, expect, it } from "vitest";
import {
  ACCENTS,
  DEFAULTS,
  background,
  baseColor,
  luminance,
  normalizeAccent,
  onAccentFor,
  tokens,
} from "./tokens";

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
    expect(bg).toContain("#6f9bff26");
    expect(bg.endsWith("#0a0b0e")).toBe(true);
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
