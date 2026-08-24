// Design tokens, ported from design/Daybreak.dc.html (its `tokens()` and
// `background()` methods). Everything visual in v2 reads these CSS custom
// properties, so a theme/accent change is a single style object swap on the
// app root rather than a re-render of styled components.

export const THEMES = ["dark", "light"];

// The accent swatches offered in the settings drawer.
//
// Sixteen, from the six the design shipped with. The six were a good set and
// too small a one: four of them sat between hue 160 and 345, so there was no
// red, no yellow, no green, no cyan and no magenta to pick, and anyone who
// wanted one of those had no way to get it.
//
// Every one of them stays in the same register as the original six — light,
// unsaturated, closer to a pastel than to a primary. That is not decoration:
// the whole token ramp is derived from this one value, and a fully saturated
// accent makes --accentSoft and --accentLine shout at every panel edge on the
// board. The first six are unchanged and in their original order, so nobody's
// stored accent moves.
//
// Readability is derived rather than assumed. On the light theme darkenFor
// steps the swatch down until it clears 4.5:1 as text; on dark the raw swatch
// is used, which is why every one of these has to be light enough to read on
// near-black in the first place. Both directions are asserted for all sixteen
// in tokens.test.js, which is what makes adding a seventeenth safe.
export const ACCENTS = [
  // The original six.
  "#6f9bff", // blue
  "#7de2b8", // mint
  "#ffb26f", // orange
  "#ff8fb1", // pink
  "#c79bff", // violet
  "#e8e6df", // paper
  // Filling the wheel: the hues that had no swatch at all.
  "#ff8f8f", // red
  "#f5d979", // yellow
  "#b6dd7f", // lime
  "#86d99a", // green
  "#6fd6e5", // cyan
  "#8fb0c9", // steel
  "#9b96ff", // indigo
  "#ef92dc", // magenta
  "#adb8c6", // slate
  "#dcc9a4", // sand
];

// What each swatch is called, for the picker's accessible names. A screen
// reader saying "Accent #6f9bff" is reading out a number nobody can picture;
// with six swatches that was merely unhelpful and with sixteen it is useless.
// Kept beside the list rather than folded into it so ACCENTS stays a plain
// array of the values actually stored.
export const ACCENT_NAMES = {
  "#6f9bff": "blue",
  "#7de2b8": "mint",
  "#ffb26f": "orange",
  "#ff8fb1": "pink",
  "#c79bff": "violet",
  "#e8e6df": "paper",
  "#ff8f8f": "red",
  "#f5d979": "yellow",
  "#b6dd7f": "lime",
  "#86d99a": "green",
  "#6fd6e5": "cyan",
  "#8fb0c9": "steel",
  "#9b96ff": "indigo",
  "#ef92dc": "magenta",
  "#adb8c6": "slate",
  "#dcc9a4": "sand",
};

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
  "Prism",
  "Lattice",
  "Tide",
  "Spot",
];

export const DEFAULTS = {
  // "system" follows the OS/browser colour scheme, which is what a new tab
  // page should do out of the box. Resolved by resolveTheme() before any
  // token lookup.
  theme: "system",
  accent: ACCENTS[0],
  wall: "Nebula",
  radius: 18,
  // Tile opacity is absolute now (100% is a solid card), so the default sits
  // where the tile still reads as glass and the blur behind it is visible.
  alpha: 50,
  pageZoom: 100,
  // Off by default. backdrop-filter is the single most expensive thing on the
  // page — every tile, panel, sheet and menu is a separate blurred surface, and
  // on a modest machine that is the difference between a new tab that appears
  // and one that fades in. It is the better-looking setting and not the better
  // default, so the welcome card offers it as a choice and this is where the
  // choice starts.
  blur: false,
  tileLabels: "both",
  boardWidth: "comfortable",
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
// A tile's own background colour.
//
// The accent already tints the whole board; this is the other half of the
// request — the tiles themselves. Same sixteen colours, because they are already
// named and already checked for readability in both themes, and because a board
// whose tiles and accent come from one palette looks deliberate where two
// palettes look like two features.
//
// A tint is a *wash*, not a fill: the theme's own panel colour moved a fraction
// of the way toward the chosen hue. That is what makes it safe. Text on a tile
// is --fg, and the surface never travels toward --fg, so a tinted tile cannot
// become unreadable however saturated the swatch — it only ever becomes a
// slightly green dark card or a slightly green white one. Painting the swatch on
// directly would have needed a contrast check per colour per theme and would
// still have looked like a sticker sheet.
//
// Light theme takes a little less of it. The panel is near-white and the eye
// reads a small shift from white as colour more readily than the same shift
// from near-black.
//
// The first values here were half these, and on screen the tiles were barely
// distinguishable — the default tile opacity is 50%, so whatever is mixed in
// gets washed out again over the wallpaper before anybody sees it. These are
// what actually reads as a coloured tile, with the contrast test below holding
// the ceiling.
const TINT_MIX = { dark: 0.34, light: 0.28 };

// The tint palette: the accents, plus one that is a tint and not an accent.
//
// Seventeen rather than sixteen because the picker lays out nine to a row with
// "none" taking the first cell, so sixteen colours left the second row one
// short and the grid looked unfinished. Eighteen cells is two full rows.
//
// Added here rather than to ACCENTS because the accent picker is eight to a row
// and two clean rows of eight is exactly what sixteen gives it: a seventeenth
// accent would fix this grid by breaking that one. And teal earns a place among
// tints more than among accents on its own merits — as a wash it reads clearly
// apart from both mint and cyan, while as an accent, driving buttons and links
// and the wallpaper, it would sit very close to what cyan already does.
export const TINT_EXTRA = "#74d1c4";

export const TINTS = [...ACCENTS, TINT_EXTRA];

export const TINT_NAMES = { ...ACCENT_NAMES, [TINT_EXTRA]: "teal" };

// The theme's untinted panel surface, which is also what a tint moves away from.
const PANEL_RGB = { dark: [28, 30, 38], light: [255, 255, 255] };

function mixToward(base, hex, amount) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (rgb.some((v) => Number.isNaN(v))) return base;
  return base.map((v, i) => Math.round(v * (1 - amount) + rgb[i] * amount));
}

// The tile's background, as a single rgba(). `alpha` is the opacity slider and
// passes straight through whether or not there is a tint, so tinting a tile
// never quietly changes how much of the wallpaper shows through it.
export function tileFill(theme, alpha = 100, tint = null) {
  const dark = theme !== "light";
  const key = dark ? "dark" : "light";
  const base = PANEL_RGB[key];
  const rgb = tint ? mixToward(base, tint, TINT_MIX[key]) : base;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha / 100})`;
}

// The surfaces *inside* a tinted tile.
//
// --panel and --panel2 are what every widget paints its inputs, buttons and
// rows with, and they are translucent whites layered over the tile. On the dark
// theme that is fine: white at 5% over a green-dark tile gives a slightly
// lighter green-dark. On the light theme they are 62% and 92% white, which
// swamps the tint completely — a stark white input box sitting on a lilac tile,
// which is what the tiles looked like as soon as they could be coloured.
//
// So the white gets the same treatment the tile did: mixed toward the tint
// before being laid on. The alphas are untouched, so the depth and the layering
// are exactly as they were and only the hue follows the tile.
//
// Returned as CSS custom properties for the tile element, which means widgets
// need no changes at all: they already say var(--panel), and inside a tinted
// tile that now resolves to a tinted panel.
export function tileSurfaces(theme, tint) {
  if (!tint) return null;
  const dark = theme !== "light";
  const key = dark ? "dark" : "light";
  const [r, g, b] = mixToward([255, 255, 255], tint, TINT_MIX[key]);
  const wash = (alpha) => `rgba(${r},${g},${b},${alpha})`;
  return dark
    ? {
        "--panel": wash(0.05),
        "--panel2": wash(0.1),
        "--sheetHover": wash(0.1),
      }
    : {
        "--panel": wash(0.62),
        "--panel2": wash(0.92),
        // The light theme's row highlight is a dark wash rather than a white
        // one, so it is left alone: tinting it would lighten the one surface
        // whose whole job is to be darker than what it sits on.
      };
}

export const GRID_GAP = 14;

// The rest of the board's geometry, in one place because more than the board
// depends on it. A widget that has to know how much room a tile really gives it
// — the icon grids, deciding how big an icon can be — was otherwise reading
// these numbers off Board.jsx and tileStyle.js by eye, and a test of the fit
// would have been checking a copy against a copy.
export const ROW_HEIGHT = 96;
export const TILE_PAD = { x: 18, y: 16 };
// The label row above a widget. `max` is the cap the row animates against when
// labels are switched off; `line` is what it actually occupies, which is set by
// the label's own line box and is nothing like the cap. Taking the cap for the
// real height is a mistake worth naming: it understated a two-row tile's body
// by 26px, which is a whole row of anything.
export const TILE_HEADER = { max: 40, gap: 12, line: 14 };

// A couple of pixels held back, because this is a model of a layout rather than
// the layout. Measured against a real tile it lands within 2px, and erring
// small means anything that passes a fit check here fits on screen too.
const SLACK = 2;

// The height a widget actually gets inside a tile of `rows` rows.
export function tileBodyHeight(rows, { header = true } = {}) {
  const outer = ROW_HEIGHT * rows + GRID_GAP * (rows - 1);
  const chrome = 2 * TILE_PAD.y + (header ? TILE_HEADER.line + TILE_HEADER.gap : 0);
  return outer - chrome - SLACK;
}

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

// Darkens an accent by stepping down its HSL lightness until it clears a WCAG
// contrast target against a background, or lightness bottoms out. The near-
// white accent swatch is unreadable as text on the light theme's base — this
// is what keeps it (and every other pale accent) legible there while dark
// theme, where the raw accent already reads fine, is untouched.
export function darkenFor(hex, bg = "#f3f3f1", target = 4.5) {
  const a = normalizeAccent(hex);
  if (contrast(luminance(a), luminance(bg)) >= target) return a;

  const h = a.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  hue = (((hue % 360) + 360) % 360);

  const atLightness = (lightness) => {
    const c = (1 - Math.abs(2 * lightness - 1)) * s;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness - c / 2;
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
  };

  let candidate = a;
  while (l > 0) {
    l = Math.max(0, l - 0.02);
    candidate = atLightness(l);
    if (contrast(luminance(candidate), luminance(bg)) >= target) break;
  }
  return candidate;
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
    "--accentText": dark ? a : darkenFor(a),
    "--onAccent": onAccentFor(a),
    "--fg": dark ? "oklch(0.96 0.004 260)" : "oklch(0.22 0.01 260)",
    "--dim": dark ? "oklch(0.72 0.012 260)" : "oklch(0.46 0.012 260)",
    "--faint": dark ? "oklch(0.56 0.012 260)" : "oklch(0.60 0.012 260)",
    "--line": dark ? "rgba(255,255,255,.10)" : "rgba(20,22,28,.10)",
    "--panel": dark ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.62)",
    "--panel2": dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.92)",
    "--sheet": sheet,
    // A row highlight for things sitting *on* a sheet — menus, dropdowns,
    // popovers. --panel2 cannot do this job: it lifts a surface off the board
    // by whitening it, which in light mode is near-opaque white, and a sheet
    // is already near-white. Hovering a context-menu item painted white on
    // white and simply did not show.
    "--sheetHover": dark ? "rgba(255,255,255,.10)" : "rgba(20,22,28,.06)",
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
export function hslOf(hex) {
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
  return [(((hue % 360) + 360) % 360), s, l];
}

function hexOfHsl(hue, s, l) {
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

export function rotateHue(hex, degrees) {
  const [hue, s, l] = hslOf(hex);
  return hexOfHsl((((hue + degrees) % 360) + 360) % 360, s, l);
}

// A wallpaper is the accent laid over the base, so an accent already close to
// the base has nothing to show: on the light theme every option built from the
// near-white neutral came out the same plain page, whatever the gradients did.
//
// Only the lightness moves, and only downward — hue and saturation are left
// alone, so a neutral accent stays neutral and simply becomes visible instead
// of turning into a colour the user did not pick.
//
// How far down is measured rather than estimated. The first version capped
// lightness at a ceiling that scaled with saturation, on the reasoning that a
// saturated colour still reads where a grey has vanished. True for most hues
// and not for yellow: yellow is intrinsically bright — green alone carries 71%
// of the luminance sum — so a saturated yellow sits near white at a lightness
// where a saturated blue is plainly visible. That ceiling let the yellow swatch
// through at 1.28:1 against the page, which is the exact "plain white page"
// this function exists to prevent.
//
// So the ceiling is kept and a floor is added under it. The ceiling is what
// makes a light-theme wallpaper read as a backdrop rather than as a wash, and
// it was reviewed on screen; replacing it outright would have made the pink,
// violet and paper wallpapers paler than the ones already signed off, which is
// the complaint that prompted it. The floor then catches what the ceiling
// cannot see — a colour that is still too close to the page after being
// capped — and steps it down until the contrast is actually there.
//
// Monotone by construction: nothing the ceiling darkened comes back lighter,
// and only the swatches that need more get more.
const WALL_MIN_CONTRAST = 1.45;

export function wallTint(accent, dark) {
  const hex = normalizeAccent(accent);
  // The dark base is far from every accent offered, so there is nothing to fix.
  if (dark) return hex;
  const base = baseColor("light");
  const against = (candidate) => contrast(luminance(candidate), luminance(base));

  const [hue, s, l] = hslOf(hex);
  const ceiling = 0.58 + 0.14 * Math.min(1, s);
  let lightness = Math.min(l, ceiling);
  let candidate = lightness === l ? hex : hexOfHsl(hue, s, lightness);

  while (lightness > 0 && against(candidate) < WALL_MIN_CONTRAST) {
    lightness = Math.max(0, lightness - 0.02);
    candidate = hexOfHsl(hue, s, lightness);
  }
  return candidate;
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
  // Floored so a near-white accent still produces a visible page.
  const a = wallTint(accentInput, dark);

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

  if (wall === "Prism") {
    // Colour that changes with angle rather than with distance — the one
    // option here not built out of blooms. The conic runs the accent through
    // both of its thirds, and a radial closes it back to the base at the
    // edges so it reads as light rather than as a colour wheel.
    //
    // Its origin sits above the viewport on purpose: every conic converges to
    // a hard point at its centre, and on-screen that point is a visible pinch
    // with all three hues meeting at it. Off the top edge, only the smooth
    // part of the sweep is ever in view.
    const b1 = rotateHue(a, 120);
    const b2 = rotateHue(a, -120);
    const s = dark ? "3a" : "46";
    return (
      `radial-gradient(1500px 1000px at 50% -18%, transparent 30%, ${base} 86%), ` +
      `conic-gradient(from 232deg at 50% -18%, ${a}${s}, ${b1}${s}, ${b2}${s}, ${a}${s}), ` +
      base
    );
  }

  if (wall === "Lattice") {
    // Fine ruling in both directions, lit from one corner. Grain and Ridge
    // both run diagonally; this is the square one.
    const line = dark ? `${a}1a` : `${a}24`;
    return (
      `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 28px), ` +
      `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 28px), ` +
      `radial-gradient(1000px 700px at 12% 6%, ${a}${dark ? "34" : "42"}, transparent 62%), ` +
      base
    );
  }

  if (wall === "Tide") {
    // Light along the bottom edge instead of the top, so the board sits above
    // the glow rather than inside it.
    const alt = rotateHue(a, -35);
    return (
      `radial-gradient(1400px 420px at 50% 104%, ${a}${dark ? "52" : "60"}, transparent 68%), ` +
      `radial-gradient(900px 300px at 14% 112%, ${alt}${dark ? "3a" : "46"}, transparent 66%), ` +
      `linear-gradient(0deg, ${a}${dark ? "14" : "1c"}, transparent 46%), ` +
      base
    );
  }

  if (wall === "Spot") {
    // One core behind the board closing to the base at the edges. Halo is a
    // ring with its middle left empty; this is the filled version of it.
    return (
      `radial-gradient(900px 700px at 50% 26%, ${a}${dark ? "44" : "54"}, transparent 62%), ` +
      `radial-gradient(1500px 1100px at 50% 30%, transparent 38%, ` +
      `${dark ? "#00000066" : "#0b13261a"} 92%), ` +
      base
    );
  }

  // Mesh is what an unrecognised name falls back to: two accent blooms plus a
  // counter-light.
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
  // Same flooring as the full page, so the picker cannot promise a
  // background the page will not deliver.
  const a = wallTint(accent, dark);
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
  if (wall === "Prism") {
    const b1 = rotateHue(a, 120);
    const b2 = rotateHue(a, -120);
    return `conic-gradient(from 200deg at 50% 40%, ${a}90, ${b1}90, ${b2}90, ${a}90), ${base}`;
  }
  if (wall === "Lattice") {
    const line = `${a}${dark ? "3a" : "48"}`;
    return (
      `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 8px), ` +
      `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 8px), ${base}`
    );
  }
  if (wall === "Tide")
    return `radial-gradient(60px 22px at 50% 98%, ${a}95, transparent 68%), ${base}`;
  if (wall === "Spot")
    return `radial-gradient(30px 26px at 50% 42%, ${a}95, transparent 70%), ${base}`;
  return (
    `radial-gradient(46px 32px at 24% 12%, ${a}${dark ? "70" : "80"}, transparent 68%), ` +
    `radial-gradient(40px 30px at 88% 90%, ${a}40, transparent 65%), ${base}`
  );
}
