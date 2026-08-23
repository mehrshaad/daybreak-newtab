// How big the digital clock's digits should be, given the tile it is in.
//
// They used to be `clamp(28px, 3.6vw, 44px)` — sized off the *window*. A tile
// is not the window: the same four-column tile is 203px wide on the default
// board and 370px on a full-width one, and a wide tile in a small window got
// small digits with room to spare on every side. Which is what a clock reading
// 2:22 in 34px inside a 400x220 tile looks like: fine, and obviously too small
// for the space.
//
// So it is measured instead, the same way the analog faces are. The shape of
// the answer is: work out the largest size that still fits the tile, then take
// a share of it. The size setting picks the share.
//
// Sharing the ceiling rather than multiplying a "comfortable" size is what
// makes all five steps mean something. A plain multiplier bunches up at the
// top — on a tile whose comfortable size is already near the limit, Large,
// Larger and Largest all clamp to the same number and three of the five
// options do nothing. Shares of the ceiling are distinct on every tile by
// construction, and the largest one genuinely fills it.

// Advance width of a character relative to the font size. The digits render in
// the UI face with tabular-nums, so every digit is the same width and a colon
// is much narrower. Close enough for choosing a size that is then bounded on
// both sides; the exact metrics vary by face and are not worth loading.
const DIGIT_EM = 0.56;
const COLON_EM = 0.28;

// What the meridiem costs, in digit-font ems: the gap plus the mark itself,
// which is set in a smaller mono face beside the digits.
const MERIDIEM_EM = 0.62;

// Cap height: the drawn height of a digit is this fraction of the font size, so
// filling a given box takes a font size larger than the box.
const CAP_HEIGHT = 0.72;

// What the date line underneath costs, in digit-font ems, plus the fixed gap
// above it. The date is sized from the digits (see the widget), so its height
// scales with them and belongs in the same equation rather than being
// subtracted as a guess.
const DATE_EM = 0.32;
const DATE_GAP = 10;

// Never quite to the edge. Two per cent of the tile on each axis, so the
// largest step still has a hair of air around it rather than touching.
const EDGE = 0.98;

// The five steps, as a share of the size that would fill the tile. Medium is
// 0.78 because that is where the measured-fit version of this file already
// landed on the default board — so the middle step is not a new look, it is
// the look this replaces, and the other four are the room either side of it.
export const TEXT_SIZES = ["s", "m", "l", "xl", "xxl"];

const SHARES = { s: 0.62, m: 0.78, l: 0.88, xl: 0.95, xxl: 1 };

// A floor for legibility and a backstop against absurdity. The tile itself is
// meant to be the real bound; MAX only exists so a bogus measurement cannot ask
// for 4000px type. It has to sit above anything a real tile can want, or it
// silently becomes the bound instead and the top steps stop differing: at 200
// a 560x300 tile showing 2:22 clamped both XL and XXL to the same number.
// Below MIN readability wins over fitting: a box too small for 22px type is not
// a tile anyone has.
const MIN = 22;
const MAX = 320;

// The width of a time string, in ems of the digit font.
export function widthEm(digits, meridiem = false) {
  let em = 0;
  for (const ch of String(digits)) em += ch === ":" ? COLON_EM : DIGIT_EM;
  return em + (meridiem ? MERIDIEM_EM : 0);
}

// The largest the digits could be and still fit, on whichever axis runs out
// first. This is the ceiling the size setting takes a share of.
export function fitFontSize(box, digits, { meridiem = false, date = false } = {}) {
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;

  const byWidth = (box.width * EDGE) / widthEm(digits, meridiem);
  // With a date line the two share the height, and the line's own height is a
  // multiple of the digit size, so they solve together.
  const byHeight = date
    ? (box.height * EDGE - DATE_GAP) / (CAP_HEIGHT + DATE_EM)
    : (box.height * EDGE) / CAP_HEIGHT;

  return Math.min(byWidth, byHeight);
}

export function digitFontSize(box, digits, options = {}) {
  const { size = "m" } = options;
  const fit = fitFontSize(box, digits, options);
  // Nothing measured yet — the caller keeps its viewport-based guess for the
  // first paint rather than flashing a size it is about to change.
  if (fit == null) return null;

  const share = SHARES[size] ?? SHARES.m;
  return Math.round(Math.max(MIN, Math.min(MAX, fit * share)));
}
