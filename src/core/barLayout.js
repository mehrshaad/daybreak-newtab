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
