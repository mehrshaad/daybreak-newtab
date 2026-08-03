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
export const WALLPAPERS = [
  "Flat",
  "Mesh",
  "Dusk",
  "Grain",
  "Aurora",
  "Halo",
  "Ridge",
  "Nebula",
];

export const DEFAULTS = {
  // "system" follows the OS/browser colour scheme, which is what a new tab
  // page should do out of the box. Resolved by resolveTheme() before any
  // token lookup.
  theme: "system",
  accent: ACCENTS[0],
  wall: "Mesh",
  radius: 18,
  // Tile opacity is absolute now (100% is a solid card), so the default sits
  // where the tile still reads as glass and the blur behind it is visible.
  alpha: 50,
  pageZoom: 100,
  blur: true,
};

// Surfaces read their blur from these rather than hardcoding backdrop-filter,
// so switching blur off genuinely produces solid panels everywhere instead of
// leaving a few translucent ones behind.
export const BLUR = {
  tile: 18,
  panel: 22,
  sheet: 28,
  overlay: 28,
};

// Grid gap is fixed rather than configurable: it is the one grid dial that
// never improved a layout, and every value but the default made the board look
// either cramped or unmoored.
export const GRID_GAP = 14;

// Page zoom, as a percentage, applied with the CSS `zoom` property so the
// layout genuinely reflows the way Ctrl+ does rather than being scaled.
export const PAGE_ZOOM_MIN = 70;
export const PAGE_ZOOM_MAX = 150;

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

export function tokens(theme = DEFAULTS.theme, accentInput = DEFAULTS.accent, blur = true) {
  const dark = theme !== "light";
  const a = normalizeAccent(accentInput);
  // Blur-dependent surface values live in tokens so every panel, sheet and
  // menu picks them up from one place.
  // Sheer enough with blur on that the blur is plainly visible through every
  // panel, sheet and menu — at .86 the frost was there but invisible, which is
  // why the drawers and the dock looked solid while the tiles looked frosted.
  // With blur off these have to be opaque or text lands on the board.
  const sheet = blur
    ? dark
      ? "rgba(18,19,24,.60)"
      : "rgba(250,250,249,.66)"
    : dark
    ? "rgb(20,21,26)"
    : "rgb(250,250,249)";
  return {
    "--blur-tile": blur ? `blur(${BLUR.tile}px)` : "none",
    "--blur-panel": blur ? `blur(${BLUR.panel}px)` : "none",
    "--blur-sheet": blur ? `blur(${BLUR.sheet}px)` : "none",
    "--blur-overlay": blur ? `blur(${BLUR.overlay}px) saturate(140%)` : "none",
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
    "--sheet": sheet,
    "--storeBg": dark ? "rgba(10,11,14,.97)" : "rgba(244,244,242,.98)",
    // With blur on, the store's own fill is deliberately thinner so the blurred
    // board reads through it as depth. With blur off it has to be opaque, or
    // the board simply shows through sharp and competes with the content.
    "--storeScrim": blur
      ? dark
        ? "rgba(10,11,14,.70)"
        : "rgba(244,244,242,.76)"
      : dark
      ? "rgb(12,13,17)"
      : "rgb(246,246,244)",
    "--scrim": dark ? "rgba(6,7,10,.58)" : "rgba(240,240,238,.6)",
    "--codeBg": dark ? "rgba(0,0,0,.30)" : "rgba(20,22,28,.05)",
    "--danger": dark ? "#ff8189" : "#c0323c",
    "--ok": dark ? "oklch(0.78 0.15 155)" : "oklch(0.55 0.15 155)",
  };
}

export const baseColor = (theme) => (theme !== "light" ? "#0a0b0e" : "#f3f3f1");

// Shift a hex colour around the hue wheel, keeping its saturation and
// lightness. Used by the multi-hue backgrounds so they stay tied to the chosen
// accent instead of introducing arbitrary colours.
export function rotateHue(hex, degrees) {
  const h = normalizeAccent(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  hue = (((hue + degrees) % 360) + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(hue / 60) % 6;
  const rgb = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg].map((v) => Math.round((v + m) * 255));
  return `#${rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

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

  if (wall === "Aurora") {
    // Overlapping ribbons of accent and its complement, swept diagonally.
    const alt = rotateHue(a, 55);
    return (
      `radial-gradient(1200px 420px at 20% 8%, ${a}${dark ? "52" : "63"}, transparent 60%), ` +
      `radial-gradient(1000px 380px at 78% 26%, ${alt}${dark ? "45" : "57"}, transparent 62%), ` +
      `radial-gradient(900px 520px at 45% 96%, ${a}${dark ? "24" : "30"}, transparent 65%), ` +
      base
    );
  }

  if (wall === "Halo") {
    // A single soft ring centred behind the board.
    const ring = dark ? "42" : "52";
    return (
      `radial-gradient(circle 620px at 50% 34%, transparent 55%, ${a}${ring} 68%, transparent 82%), ` +
      `radial-gradient(circle 380px at 50% 34%, ${a}${dark ? "26" : "33"}, transparent 70%), ` +
      base
    );
  }

  if (wall === "Ridge") {
    // Wide diagonal bands — a coarser, more graphic cousin of Grain.
    const band = dark ? `${a}1c` : `${a}26`;
    return (
      `repeating-linear-gradient(115deg, ${band} 0 34px, transparent 34px 92px), ` +
      `radial-gradient(1100px 700px at 88% 0%, ${a}${dark ? "38" : "45"}, transparent 62%), ` +
      base
    );
  }

  if (wall === "Nebula") {
    // Three offset blooms in accent, +120° and -120°, for a fuller colour field.
    const b1 = rotateHue(a, 120);
    const b2 = rotateHue(a, -120);
    return (
      `radial-gradient(760px 620px at 16% 22%, ${a}${dark ? "4e" : "5e"}, transparent 64%), ` +
      `radial-gradient(700px 560px at 84% 14%, ${b1}${dark ? "38" : "45"}, transparent 62%), ` +
      `radial-gradient(820px 640px at 62% 100%, ${b2}${dark ? "33" : "40"}, transparent 66%), ` +
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
  if (wall === "Aurora") {
    const alt = rotateHue(a, 55);
    return (
      `radial-gradient(60px 26px at 26% 22%, ${a}80, transparent 65%), ` +
      `radial-gradient(52px 24px at 76% 62%, ${alt}75, transparent 65%), ${base}`
    );
  }
  if (wall === "Halo")
    return (
      `radial-gradient(circle 26px at 50% 45%, transparent 52%, ${a}90 70%, transparent 84%), ` +
      base
    );
  if (wall === "Ridge")
    return (
      `repeating-linear-gradient(115deg, ${a}${dark ? "30" : "3d"} 0 5px, transparent 5px 13px), ` +
      base
    );
  if (wall === "Nebula") {
    const b1 = rotateHue(a, 120);
    const b2 = rotateHue(a, -120);
    return (
      `radial-gradient(34px 30px at 24% 26%, ${a}85, transparent 66%), ` +
      `radial-gradient(30px 26px at 78% 24%, ${b1}70, transparent 66%), ` +
      `radial-gradient(34px 30px at 56% 92%, ${b2}66, transparent 66%), ${base}`
    );
  }
  return (
    `radial-gradient(46px 32px at 24% 12%, ${a}${dark ? "70" : "80"}, transparent 68%), ` +
    `radial-gradient(40px 30px at 88% 90%, ${a}40, transparent 65%), ${base}`
  );
}
