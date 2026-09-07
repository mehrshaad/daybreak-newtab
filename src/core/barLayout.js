// How much of the toolbar's chrome fits, given the window.
//
// The bar has three jobs competing for one line: say where you are, search, and
// hold the board's controls. It used to keep every one of them at full size at
// every width, which is fine on the wide monitor it was designed on and cramps
// the search on anything narrower — the field is the reason the bar exists, so
// it is the last thing that should give way.
//
// So the chrome sheds detail instead, in the order it can most afford to lose
// it. The numbers are where the layout actually stops fitting, measured with
// the widest labels in place, not round numbers picked for looking tidy.
export const BAR_TIERS = [
  // Everything: wordmark, time, both actions spelled out.
  { min: 1180, labels: true, clock: true, wordmark: true },
  // The two action buttons become icons. They are the pair a person learns
  // once and then recognises by position, and giving up ~150px here buys the
  // search field its full width back.
  { min: 900, labels: false, clock: true, wordmark: true },
  // The time goes. Any board that wants a clock has a clock widget, so this is
  // the one piece of the bar that is genuinely duplicated elsewhere.
  { min: 680, labels: false, clock: false, wordmark: true },
  // Only the search and the controls survive.
  { min: 0, labels: false, clock: false, wordmark: false },
];

export function barTier(width) {
  return BAR_TIERS.find((t) => width >= t.min);
}

// How wide the search field is allowed to get. Focus widens it, scrolling
// narrows it along with the rest of the bar, and it never asks for more than
// the window can give once the controls have taken their share.
export function searchWidth(viewportWidth, { active, scrolled }) {
  const wanted = active ? 640 : scrolled ? 440 : 560;
  // The chrome on both sides, plus the bar's own padding. Below this the field
  // would start pushing the controls off the edge instead of shrinking.
  const reserved = viewportWidth >= 900 ? 420 : 260;
  return Math.max(180, Math.min(wanted, viewportWidth - reserved));
}

// The bar's own padding and the gap between its three columns, so the width
// arithmetic below is derived from the layout rather than repeating it.
export const BAR_PAD_X = 28;
export const BAR_GAP = 20;

// What each end column actually gets, given the bar's own width and how much
// the search field is asking for. The columns are minmax(0, 1fr), so they take
// what is left after the field and split it.
export function endColumnWidth(barWidth, searchPx) {
  const usable = barWidth - 2 * BAR_PAD_X - 2 * BAR_GAP;
  return Math.max(0, Math.round((usable - searchPx) / 2));
}

// Measured, not guessed: the labelled right-hand group is 253px of "Edit
// layout", "Store" and two round controls. Under this it does not clip -- it is
// right-aligned inside a column that may shrink to nothing, so it overflows
// leftwards and draws on top of the search field, which is exactly what was
// reported. 270 leaves a little room for a longer label.
export const BAR_LABELS_MIN = 270;

// Whether the two action buttons may spell themselves out.
//
// Two conditions, and the second is the one that was missing. The tier says
// whether the window is wide enough to bother; the column width says whether
// the group will actually fit where it is being put. They come apart whenever
// something else has taken width away from the bar -- an open drawer -- and it
// was the second that the collision needed.
export function barLabels(barWidth, searchPx, tier) {
  return !!tier?.labels && endColumnWidth(barWidth, searchPx) >= BAR_LABELS_MIN;
}

// The hint block in the hero — "Custom layout · 9 widgets", and the line about
// right-clicking. It sits opposite the greeting in a wrapping flex row, so when
// the room runs out it does not shrink, it drops onto its own line and sits
// there as a stray left-aligned paragraph under the heading. Hidden below the
// width where that happens: it is a hint, and a hint that has rearranged the
// page to be seen has stopped being worth its place.
//
// 820 rather than the measured wrap point of about 740, because the greeting is
// as long as the name in it and "Good evening, Konstantinos" needs more room
// than the default does.
export const HERO_HINTS_MIN = 820;

export const showHeroHints = (width) => width >= HERO_HINTS_MIN;

// How much room the toolbar's left group needs before the profile chip may
// spell its name out.
//
// The chip is the one thing in the bar whose width depends on data rather than
// on the design: a board called "Main" and one called "Personal projects" are
// not the same size. Its column is minmax(0, 1fr), so it does not get to push
// anything aside — it gets squeezed, and the name inside it truncates. At the
// narrow end that produced a chip reading "M…", which is not a label, it is a
// stub where a label used to be. Below this, the chip drops to its emoji, which
// still says which board you are on and asks for a third of the room.
//
// Measured: the chip with a short name and the clock beside it come to 111px
// together. 140 leaves room for a name longer than "Main" before the ellipsis
// does the work instead.
export const PROFILE_NAME_MIN = 140;

// `available` is the end column's width, which is a share of the free space
// rather than a fit to the chip's contents — so this cannot feed back into
// itself. Before the first measurement the bar tier is the best guess there is.
export function profileShowsName(available, { labels }) {
  if (!labels) return false;
  if (available == null) return true;
  return available >= PROFILE_NAME_MIN;
}
