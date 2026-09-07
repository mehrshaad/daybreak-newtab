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
  sand: { from: "#dcc9a4", to: "#a8874a" },
  graphite: { from: "#7a7a80", to: "#2c2c31" },
};

// The order the picker shows them in: round the wheel, then the two neutrals.
// A named order rather than Object.keys, so adding one is a decision about
// where it goes.
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

export function tileColor(name) {
  return TILE_COLORS[name] || null;
}
