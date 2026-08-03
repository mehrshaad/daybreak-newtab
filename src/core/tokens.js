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
    "--scrim": dark ? "rgba(6,7,10,.58)" : "rgba(240,240,238,.6)",
    "--codeBg": dark ? "rgba(0,0,0,.30)" : "rgba(20,22,28,.05)",
    "--danger": dark ? "#ff8189" : "#c0323c",
    "--ok": dark ? "oklch(0.78 0.15 155)" : "oklch(0.55 0.15 155)",
  };
}

export const baseColor = (theme) => (theme !== "light" ? "#0a0b0e" : "#f3f3f1");

export function background(
  theme = DEFAULTS.theme,
  accentInput = DEFAULTS.accent,
  wall = DEFAULTS.wall
) {
  const dark = theme !== "light";
  const base = baseColor(theme);
  const a = normalizeAccent(accentInput);
  if (wall === "Flat") return base;
  if (wall === "Dusk")
    return `linear-gradient(170deg, ${dark ? "#141826" : "#e9ecf5"}, ${base} 60%)`;
  if (wall === "Grain")
    return (
      `repeating-linear-gradient(135deg, ${dark ? "#ffffff08" : "#00000008"} 0 2px, ` +
      `transparent 2px 12px), ${base}`
    );
  // Mesh is the default.
  return (
    `radial-gradient(1100px 700px at 12% -10%, ${a}${dark ? "26" : "30"}, transparent 60%), ` +
    `radial-gradient(900px 600px at 92% 8%, ${dark ? "#ffffff14" : "#ffffffcc"}, transparent 55%), ` +
    base
  );
}

// Small swatch version of `background()` for the picker in settings.
export function backgroundSwatch(theme, accent, wall) {
  const dark = theme !== "light";
  const base = baseColor(theme);
  const a = normalizeAccent(accent);
  if (wall === "Flat") return base;
  if (wall === "Dusk")
    return `linear-gradient(170deg, ${dark ? "#141826" : "#e9ecf5"}, ${base})`;
  if (wall === "Grain")
    return (
      `repeating-linear-gradient(135deg, ${dark ? "#ffffff14" : "#00000012"} 0 2px, ` +
      `transparent 2px 8px), ${base}`
    );
  return `radial-gradient(60px 40px at 30% 20%, ${a}55, transparent 70%), ${base}`;
}
