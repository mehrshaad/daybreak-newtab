// Design tokens, ported from design/Daybreak.dc.html (its `tokens()` and
// `background()` methods). Everything visual in v2 reads these CSS custom
// properties, so a theme/accent change is a single style object swap on the
// app root rather than a re-render of styled components.

export const THEMES = ["dark", "light"];

// The six accent swatches offered in the settings drawer.
export const ACCENTS = [
  "#6f9bff",
  "#7de2b8",
  "#ffb26f",
  "#ff8fb1",
  "#c79bff",
  "#e8e6df",
];

// Procedural backgrounds. v2 has no photo wallpapers, so these are generated
// from the accent + theme and cost nothing to ship.
export const WALLPAPERS = ["Flat", "Mesh", "Dusk", "Grain"];

export const DEFAULTS = {
  theme: "dark",
  accent: ACCENTS[0],
  wall: "Mesh",
  gap: 14,
  radius: 18,
  alpha: 100,
};

const HEX6 = /^#[0-9a-f]{6}$/i;

// Fall back to the default accent for anything that is not a 6-digit hex, so
// the `accent + alpha-suffix` trick below can never emit a broken color.
export function normalizeAccent(accent) {
  return HEX6.test(String(accent || "")) ? String(accent) : DEFAULTS.accent;
}

// WCAG relative luminance of a 6-digit hex color.
export function luminance(hex) {
  const h = normalizeAccent(hex).slice(1);
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

const contrast = (a, b) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Text color to place on top of the accent. The design hardcoded this per
// theme (#0a0b0e dark / #ffffff light), which renders white-on-cream for the
// pale accents in light mode. Picking by contrast keeps every accent readable
// and still resolves to #0a0b0e for all six swatches, matching the design's
// dark-theme appearance exactly.
export function onAccentFor(accent) {
  const L = luminance(accent);
  return contrast(L, luminance("#0a0b0e")) >= contrast(L, luminance("#ffffff"))
    ? "#0a0b0e"
    : "#ffffff";
}

export function tokens(theme = DEFAULTS.theme, accentInput = DEFAULTS.accent) {
  const dark = theme !== "light";
  const a = normalizeAccent(accentInput);
  return {
    "--accent": a,
    "--accentSoft": `${a}22`,
    "--accentLine": `${a}55`,
    "--onAccent": onAccentFor(a),
    "--fg": dark ? "oklch(0.96 0.004 260)" : "oklch(0.22 0.01 260)",
    "--dim": dark ? "oklch(0.72 0.012 260)" : "oklch(0.46 0.012 260)",
    "--faint": dark ? "oklch(0.56 0.012 260)" : "oklch(0.60 0.012 260)",
    "--line": dark ? "rgba(255,255,255,.10)" : "rgba(20,22,28,.10)",
    "--panel": dark ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.62)",
    "--panel2": dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.92)",
    "--sheet": dark ? "rgba(18,19,24,.94)" : "rgba(250,250,249,.97)",
    "--storeBg": dark ? "rgba(10,11,14,.97)" : "rgba(244,244,242,.98)",
    // The store sits on a blur, so its own fill is deliberately thinner than
    // --storeBg: opaque enough to read text on, sheer enough that the blurred
    // board still shows through as depth.
    "--storeScrim": dark ? "rgba(10,11,14,.82)" : "rgba(244,244,242,.86)",
    "--scrim": dark ? "rgba(6,7,10,.58)" : "rgba(240,240,238,.6)",
    "--codeBg": dark ? "rgba(0,0,0,.30)" : "rgba(20,22,28,.05)",
    "--danger": dark ? "#ff8189" : "#c0323c",
    "--ok": dark ? "oklch(0.78 0.15 155)" : "oklch(0.55 0.15 155)",
  };
}

export const baseColor = (theme) => (theme !== "light" ? "#0a0b0e" : "#f3f3f1");

// The design's own values were far too weak to read as different backgrounds:
// in light theme Mesh resolved to an accent at 0.19 alpha over #f3f3f1 and
// Grain to black at 0.03, so all four looked like the same flat page. These are
// pushed to where each option is plainly distinguishable while still reading as
// a backdrop rather than decoration.
export function background(
  theme = DEFAULTS.theme,
  accentInput = DEFAULTS.accent,
  wall = DEFAULTS.wall
) {
  const dark = theme !== "light";
  const base = baseColor(theme);
  const a = normalizeAccent(accentInput);

  if (wall === "Flat") return base;

  if (wall === "Dusk") {
    // A deep vertical wash, tinted by the accent at the horizon.
    return dark
      ? `linear-gradient(168deg, #1b2338 0%, #12151f 42%, ${base} 100%), ` +
          `radial-gradient(1200px 620px at 50% 108%, ${a}2e, transparent 70%), ${base}`
      : `linear-gradient(168deg, #dfe6f6 0%, #eef0f6 46%, ${base} 100%), ` +
          `radial-gradient(1200px 620px at 50% 108%, ${a}3d, transparent 70%), ${base}`;
  }

  if (wall === "Grain") {
    // Fine diagonal hatch. Light theme needs roughly 4x the alpha of dark to
    // register at all against a near-white page.
    const line = dark ? "#ffffff12" : "#0b132622";
    return (
      `repeating-linear-gradient(135deg, ${line} 0 1px, transparent 1px 7px), ` +
      `radial-gradient(1000px 700px at 15% 0%, ${a}${dark ? "1f" : "26"}, transparent 65%), ` +
      base
    );
  }

  // Mesh is the default: two accent blooms plus a counter-light.
  return (
    `radial-gradient(1100px 720px at 8% -12%, ${a}${dark ? "4a" : "5c"}, transparent 62%), ` +
    `radial-gradient(900px 640px at 96% 4%, ${a}${dark ? "2b" : "38"}, transparent 58%), ` +
    `radial-gradient(1000px 800px at 50% 120%, ${dark ? "#ffffff10" : "#ffffffdd"}, transparent 60%), ` +
    base
  );
}

// Small swatch version of `background()` for the picker in settings. Scaled to
// the swatch, but tuned to read the same way the full page does.
export function backgroundSwatch(theme, accent, wall) {
  const dark = theme !== "light";
  const base = baseColor(theme);
  const a = normalizeAccent(accent);
  if (wall === "Flat") return base;
  if (wall === "Dusk")
    return dark
      ? `linear-gradient(168deg, #1b2338, #12151f 55%, ${base}), ${base}`
      : `linear-gradient(168deg, #dfe6f6, #eef0f6 55%, ${base}), ${base}`;
  if (wall === "Grain")
    return (
      `repeating-linear-gradient(135deg, ${dark ? "#ffffff1f" : "#0b132630"} 0 1px, ` +
      `transparent 1px 5px), ${base}`
    );
  return (
    `radial-gradient(46px 32px at 24% 12%, ${a}${dark ? "70" : "80"}, transparent 68%), ` +
    `radial-gradient(40px 30px at 88% 90%, ${a}40, transparent 65%), ${base}`
  );
}
