// How big the digital clock's digits should be, given the tile it is in.
//
// They used to be `clamp(28px, 3.6vw, 44px)` — sized off the *window*. A tile
// is not the window: the same four-column tile is 203px wide on the default
// board and 370px on a full-width one, and a wide tile in a small window got
// small digits with room to spare on every side. Which is what a clock reading
// 2:22 in 34px inside a 400x220 tile looks like: fine, and obviously too small
// for the space.
//
// So it is measured instead, the same way the analog faces are, and the answer
// is whichever of the two limits bites first.

// Advance width of a character relative to the font size. The digits render in
// the UI face with tabular-nums, so every digit is the same width and a colon
// is much narrower. Close enough for choosing a size that is then bounded on
// both sides; the exact metrics vary by face and are not worth loading.
const DIGIT_EM = 0.56;
const COLON_EM = 0.28;

// What the meridiem costs, in digit-font ems: the gap plus the mark itself,
// which is set in a smaller mono face beside the digits.
const MERIDIEM_EM = 0.62;

// Of the tile's height, how much the digits may claim. The rest is the date
// line below them and the air a clock needs above and below to not look
// wedged in.
const HEIGHT_SHARE_WITH_DATE = 0.5;
const HEIGHT_SHARE_ALONE = 0.72;

// Of the tile's width, how much the digits may claim.
const WIDTH_SHARE = 0.94;

// Cap height: the drawn height of a digit is this fraction of the font size, so
// filling a given box takes a font size larger than the box.
const CAP_HEIGHT = 0.72;

const MIN = 22;
const MAX = 132;

// The width of a time string, in ems of the digit font.
export function widthEm(digits, meridiem = false) {
  let em = 0;
  for (const ch of String(digits)) em += ch === ":" ? COLON_EM : DIGIT_EM;
  return em + (meridiem ? MERIDIEM_EM : 0);
}

export function digitFontSize(box, digits, { meridiem = false, date = false } = {}) {
  // Nothing measured yet — the caller keeps its viewport-based guess for the
  // first paint rather than flashing a wrong size.
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;

  const share = date ? HEIGHT_SHARE_WITH_DATE : HEIGHT_SHARE_ALONE;
  const byHeight = (box.height * share) / CAP_HEIGHT;
  const byWidth = (box.width * WIDTH_SHARE) / widthEm(digits, meridiem);

  return Math.round(Math.max(MIN, Math.min(MAX, Math.min(byHeight, byWidth))));
}
