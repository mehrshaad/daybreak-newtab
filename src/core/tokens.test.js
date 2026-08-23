import { describe, expect, it } from "vitest";
import {
  ACCENT_NAMES,
  ACCENTS,
  hslOf,
  tileFill,
  wallTint,
  DEFAULTS,
  background,
  backgroundSwatch,
  baseColor,
  darkenFor,
  luminance,
  normalizeAccent,
  onAccentFor,
  tokens,
  WALLPAPERS,
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
  it("returns the dark ink for every shipped accent", () => {
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

  // The per-wallpaper checks above predate half the list. These cover whatever
  // WALLPAPERS holds, so a new one cannot be added as a near-duplicate of an
  // existing one or as something too faint to see.
  it("every wallpaper in the list is distinct, in both themes and in the picker", () => {
    for (const theme of ["dark", "light"]) {
      const full = WALLPAPERS.map((w) => background(theme, "#6f9bff", w));
      expect(new Set(full).size, `${theme} backgrounds`).toBe(WALLPAPERS.length);
      const swatches = WALLPAPERS.map((w) => backgroundSwatch(theme, "#6f9bff", w));
      expect(new Set(swatches).size, `${theme} swatches`).toBe(WALLPAPERS.length);
    }
  });

  it("every wallpaper but Flat carries enough alpha to be seen", () => {
    const strongest = (css) => {
      const alphas = [...css.matchAll(/#[0-9a-f]{6}([0-9a-f]{2})/gi)].map(
        (m) => parseInt(m[1], 16) / 255
      );
      return alphas.length ? Math.max(...alphas) : 0;
    };
    for (const theme of ["dark", "light"]) {
      for (const wall of WALLPAPERS.filter((w) => w !== "Flat")) {
        expect(strongest(background(theme, "#6f9bff", wall)), `${theme}/${wall}`).toBeGreaterThan(
          0.1
        );
      }
    }
  });

  it("the default wallpaper is one the list actually offers", () => {
    expect(WALLPAPERS).toContain(DEFAULTS.wall);
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

describe("every accent, in both themes", () => {
  // The whole point of deriving the ramp instead of hardcoding it: a swatch is
  // only safe to ship if it reads in both themes, and that has to be checked
  // per swatch rather than assumed from how it looks in the picker. This is
  // what makes adding a seventeenth accent a two-line change.
  const contrast = (a, b) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);

  it("names every one of them, and names nothing that is not one", () => {
    // The picker reads these out. A swatch with no name would announce itself
    // as a hex string, which is what having names is meant to fix.
    for (const a of ACCENTS) expect(ACCENT_NAMES[a], a).toBeTruthy();
    expect(Object.keys(ACCENT_NAMES).sort()).toEqual([...ACCENTS].sort());
    expect(new Set(Object.values(ACCENT_NAMES)).size).toBe(ACCENTS.length);
  });

  it("has sixteen of them, all distinct, all valid hex", () => {
    expect(ACCENTS).toHaveLength(16);
    expect(new Set(ACCENTS).size).toBe(16);
    for (const a of ACCENTS) expect(a).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("keeps the original six first and unmoved, so no stored accent shifts", () => {
    expect(ACCENTS.slice(0, 6)).toEqual([
      "#6f9bff",
      "#7de2b8",
      "#ffb26f",
      "#ff8fb1",
      "#c79bff",
      "#e8e6df",
    ]);
  });

  it("reads as text on the dark theme, where the raw swatch is used", () => {
    // Nothing darkens the accent on dark theme — --accentText is the swatch
    // itself — so each one has to clear the bar against near-black unaided.
    for (const a of ACCENTS) {
      const text = tokens("dark", a)["--accentText"];
      expect(text).toBe(a);
      expect(contrast(text, baseColor("dark")), a).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("reads as text on the light theme, after being stepped down", () => {
    for (const a of ACCENTS) {
      const text = tokens("light", a)["--accentText"];
      expect(contrast(text, baseColor("light")), a).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("carries readable ink when used as a fill", () => {
    // Buttons and pills paint --onAccent on --accent. 4.5 rather than 3:1
    // because that pairing carries button labels, which are body-sized text.
    for (const a of ACCENTS) {
      expect(contrast(onAccentFor(a), a), a).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("stays in the pale register the whole ramp is built for", () => {
    // --accentSoft and --accentLine are the accent at 13% and 33% alpha. A
    // fully saturated swatch turns every panel edge on the board into a shout,
    // so the set is deliberately held to light, unsaturated colours.
    for (const a of ACCENTS) {
      expect(luminance(a), a).toBeGreaterThan(0.25);
    }
  });
});

describe("wallpapers on every accent", () => {
  // A wallpaper is the accent laid over the base, so an accent near the base
  // has nothing to show — on the light theme every option built from the pale
  // neutral came out as the same plain page. wallTint exists to fix that, and
  // with sixteen accents including three near-neutral ones, it has to hold for
  // all of them rather than for the one that was reported.
  const contrast = (a, b) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);

  it("is visible against the light base whichever accent is chosen", () => {
    for (const a of ACCENTS) {
      const tint = wallTint(a, false);
      expect(contrast(tint, baseColor("light")), `${ACCENT_NAMES[a]} (${a})`).toBeGreaterThan(1.35);
    }
  });

  it("leaves the dark theme alone, where every accent already reads", () => {
    for (const a of ACCENTS) expect(wallTint(a, true)).toBe(a);
  });

  it("keeps a neutral accent neutral instead of inventing a colour", () => {
    // Only lightness moves, so hue and saturation come out where they went in.
    // Saturation is the right invariant and absolute channel spread is not: at
    // a fixed HSL saturation the spread widens as lightness falls, so a grey
    // stepped down is a darker grey with a wider raw spread and the same
    // saturation. Asserting the spread instead is how I first got this wrong.
    for (const a of ["#e8e6df", "#adb8c6", "#8fb0c9", "#dcc9a4"]) {
      const tint = wallTint(a, false);
      const [hue, s] = hslOf(a);
      const [tintHue, tintS] = hslOf(tint);
      expect(tintS, a).toBeCloseTo(s, 1);
      // A degree of slack, not none: the round trip out to an 8-bit hex and
      // back cannot land exactly, and #e8e6df comes back 0.6 degrees along.
      // That is rounding, not the function moving the hue.
      expect(Math.abs(tintHue - hue), a).toBeLessThan(1.5);
    }
  });

  it("gives every accent a full set of distinct wallpapers in both themes", () => {
    for (const theme of ["dark", "light"]) {
      for (const a of ACCENTS) {
        const made = WALLPAPERS.map((w) => background(theme, a, w));
        expect(new Set(made).size, `${theme}/${ACCENT_NAMES[a]}`).toBe(WALLPAPERS.length);
      }
    }
  });
});

describe("tileFill", () => {
  const rgb = (css) => css.match(/[\d.]+/g).map(Number);

  it("is the plain panel when there is no tint", () => {
    expect(tileFill("dark", 100, null)).toBe("rgba(28,30,38,1)");
    expect(tileFill("light", 100, null)).toBe("rgba(255,255,255,1)");
  });

  it("passes the opacity slider straight through, tinted or not", () => {
    // Tinting a tile must not quietly change how much wallpaper shows through
    // it — the two settings are independent and have to stay that way.
    for (const tint of [null, "#86d99a", "#f5d979"]) {
      for (const alpha of [0, 35, 50, 100]) {
        expect(rgb(tileFill("dark", alpha, tint))[3], `${tint}@${alpha}`).toBeCloseTo(alpha / 100, 5);
      }
    }
  });

  it("moves the panel toward the colour without becoming it", () => {
    // The safety argument for the whole feature: a tint is a wash over the
    // theme's own panel, so a dark tile stays dark and a light one stays light
    // however saturated the swatch. If this ever became a fill, text on the
    // tile would have to be re-checked per colour.
    for (const tint of ACCENTS) {
      const [r, g, b] = rgb(tileFill("dark", 100, tint));
      const [lr, lg, lb] = rgb(tileFill("light", 100, tint));
      // Dark stays nearer the dark panel than the swatch.
      expect(Math.max(r, g, b), tint).toBeLessThan(140);
      // Light stays near white.
      expect(Math.min(lr, lg, lb), tint).toBeGreaterThan(200);
    }
  });

  it("keeps body text readable on every tinted tile, in both themes", () => {
    // --fg is near-white on dark and near-black on light. 4.5:1 on the opaque
    // tile, which is the worst case for the darker theme and the realistic one
    // for a solid tile.
    const contrast = (a, b) =>
      (Math.max(luminance(a), luminance(b)) + 0.05) /
      (Math.min(luminance(a), luminance(b)) + 0.05);
    const hex = (css) =>
      `#${rgb(css).slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

    for (const tint of [null, ...ACCENTS]) {
      const onDark = contrast("#f4f4f6", hex(tileFill("dark", 100, tint)));
      const onLight = contrast("#2a2c33", hex(tileFill("light", 100, tint)));
      expect(onDark, `dark ${tint}`).toBeGreaterThanOrEqual(4.5);
      expect(onLight, `light ${tint}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives every swatch a visibly different tile from the plain one", () => {
    // A tint nobody can see is a setting that does nothing.
    const plain = tileFill("dark", 100, null);
    const tinted = ACCENTS.map((c) => tileFill("dark", 100, c));
    for (const [i, css] of tinted.entries()) {
      expect(css, ACCENTS[i]).not.toBe(plain);
    }
    // And from each other, so sixteen swatches are sixteen choices.
    expect(new Set(tinted).size).toBe(ACCENTS.length);
  });

  it("ignores a malformed tint rather than emitting a broken colour", () => {
    expect(tileFill("dark", 100, "not-a-colour")).toBe("rgba(28,30,38,1)");
  });
});
