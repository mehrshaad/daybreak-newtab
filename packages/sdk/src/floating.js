// The marker every floating surface carries, and the question it answers.
//
// A popover, a menu and a tooltip all portal themselves to <body> so no
// ancestor can clip them. That solves the clipping and creates a different
// problem: to anything that closes on an outside click, a portalled panel is
// outside, however plainly it belongs to the thing that opened it.
//
// That is not hypothetical. The settings drawer closes on a capture-phase
// pointer event on `document`, and a Popover opened from inside a settings
// panel is neither in the drawer's panel nor in the widget's tile, so clicking
// one closed the drawer — and, when the popover belonged to the drawer, took
// the popover down with it mid-edit. Picking a city, a date, a folder or a
// link's colour all failed the same way.
//
// A shared attribute is the fix because the relationship is not expressible in
// the DOM: the panel is a child of <body> and there is nothing linking it back.
// Anything that dismisses on an outside click asks isFloating() first, and a
// surface that sets this attribute is never mistaken for the page behind it.
export const FLOATING_ATTR = "data-floating";

// Whether an event target sits inside any floating surface.
//
// Tolerant of a target that is not an Element — a pointer event on a text node
// or on the document itself has no `closest`, and that is not a reason to throw
// inside somebody's dismiss handler.
export function isFloating(target) {
  return typeof target?.closest === "function" && target.closest(`[${FLOATING_ATTR}]`) != null;
}
