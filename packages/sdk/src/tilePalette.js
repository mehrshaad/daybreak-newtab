import { whiteContrast } from "./brands";

// Colours a person can put on an icon tile themselves.
//
// A Quick Link gets its colour from its brand where one is known and from a
// hash of its name where none is, which is right nearly always and wrong in
// the two cases people notice: an intranet whose monogram came out an
// arbitrary purple, and two links that hashed to almost the same hue and now
// look like the same site.
//
// Why this is not the accent list. The accents are pale on purpose — the whole
// token ramp derives from one of them, and a saturated accent shouts at every
// panel edge on the board. An icon tile is the opposite job: it is a small
// saturated square carrying a white mark, the same treatment the brand tiles
// get. A pale mint app icon with a white glyph on it is illegible. So these
// are the accent *hues* at app-icon saturation, which is what "matching the
// theme" means for something that has to read at 40 pixels.
//
// Stored as the same { from, to } pairs BRANDS uses, so a chosen colour goes
// through inkSafeGradient exactly like a brand's own does and cannot end up
// too light to carry its mark.

export const TILE_COLORS = {
  blue: { from: "#6f9bff", to: "#2b62e0" },
  indigo: { from: "#9b96ff", to: "#4f46e0" },
  violet: { from: "#c79bff", to: "#8a3ff0" },
  magenta: { from: "#ef92dc", to: "#c22ba0" },
  pink: { from: "#ff8fb1", to: "#e04a80" },
  red: { from: "#ff8f8f", to: "#de2b2b" },
  orange: { from: "#ffb26f", to: "#e57a1f" },
  yellow: { from: "#ffd76f", to: "#d99b00" },
  lime: { from: "#b6dd7f", to: "#6fae1f" },
  green: { from: "#6fe08a", to: "#1fa84a" },
  teal: { from: "#4fd8c4", to: "#14a08c" },
  cyan: { from: "#6fd6e5", to: "#1f9fc4" },
  steel: { from: "#8fb0c9", to: "#4a6f8c" },
  // Sixteenth, so the picker is three whole rows of six once "automatic"
  // and the custom swatch are counted. Measured at 32.0 from its nearest
  // neighbour in CIE Lab, where the tightest pair already here (indigo
  // against violet) is 17.4 — slate came in at 16.9 and was dropped.
  navy: { from: "#5a6bab", to: "#26356e" },
  sand: { from: "#dcc9a4", to: "#a8874a" },
  graphite: { from: "#7a7a80", to: "#2c2c31" },
};

// The order the picker shows them in: round the wheel, then the two neutrals.
// A named order rather than Object.keys, so adding one is a decision about
// where it goes.
// Six to a row, which with "automatic" at the front and the custom swatch at
// the end makes eighteen cells in three full rows. A picker that leaves a hole
// on its last row looks unfinished, so the count and the column width are
// decided together rather than one being left to the browser.
export const TILE_COLOR_COLUMNS = 6;

export const TILE_COLOR_ORDER = [
  "blue",
  "indigo",
  "violet",
  "magenta",
  "pink",
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "steel",
  "navy",
  "sand",
  "graphite",
];

// Ink is two answers and not three. "Automatic" would have meant white, which
// is what light already is, and an option whose default duplicates another
// option is a control that reads as broken.
export const TILE_INKS = ["light", "dark"];

// Dark ink, for the pale end of the palette. Not pure black: a tile is a
// small bright square and #000 on it reads as a hole.
export const DARK_INK = "#1c1c22";

// --- any colour at all ---------------------------------------------------
//
// The presets are the quick answers, not the only ones. A colour picked from
// the OS wheel arrives as a bare "#rrggbb" and has to become the same kind of
// two-stop gradient every preset and every brand already is, or one tile in
// the grid would be a flat square among gradients — which is exactly what the
// favicon tiles used to look like.
//
// Lightened in HSL rather than by scaling the channels. Scaling toward white
// desaturates as it goes: #2b62e0 multiplied up loses its blue long before it
// gets light enough, and the two stops end up a different colour rather than
// the same colour twice. Holding hue and saturation and moving lightness is
// what the presets do by hand.
const LIGHTEN = 16;

function toHsl(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  if (Number.isNaN(n)) return null;
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const span = max - min;
  if (!span) return { h: 0, s: 0, l: l * 100 };
  const s = span / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / span) % 6;
  else if (max === g) h = (b - r) / span + 2;
  else h = (r - g) / span + 4;
  return { h: ((h * 60) % 360 + 360) % 360, s: s * 100, l: l * 100 };
}

const HEX = /^#[0-9a-f]{6}$/i;

// A preset's pair, or a pair derived from a raw hex. Anything unrecognised
// comes back null, which is what "automatic" is.
export function gradientFor(value) {
  if (!value) return null;
  if (TILE_COLORS[value]) return TILE_COLORS[value];
  if (!HEX.test(value)) return null;
  const hsl = toHsl(value);
  if (!hsl) return null;
  const light = Math.min(92, hsl.l + LIGHTEN);
  return {
    from: `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(light)}%)`,
    to: value,
  };
}

// Which ink a colour wants, before anybody overrides it.
//
// White on a saturated tile, dark on a pale one. The alternative was white on
// everything with inkSafeGradient darkening whatever could not carry it — fine
// for a brand, wrong for a colour somebody chose, because picking pale yellow
// and getting a dark mustard tile is not what they asked for. Below the
// threshold the honest move is to keep their colour and change the ink.
const WHITE_READS = 3;

export function defaultInk(value) {
  const pair = gradientFor(value);
  if (!pair) return "light";
  // `to` is the darker stop and the one a glyph sits over most of.
  const solid = HEX.test(pair.to) ? pair.to : value;
  return HEX.test(solid) && whiteContrast(solid) >= WHITE_READS ? "light" : "dark";
}

export function tileColor(name) {
  return gradientFor(name);
}
