// How much a page zoom is scaling everything, so a floating surface can put
// itself where it means to.
//
// The bug this exists for. A tooltip is positioned from its anchor's
// getBoundingClientRect and then placed with `left`, and those two are not the
// same units once anything up the tree has a `zoom`: the rect comes back in
// visual pixels, already multiplied, while `left` is read as layout pixels and
// multiplied again on the way to the screen. Measured in Chrome at 125% body
// zoom, an element with `left: 500px` reports a rect x of 625 and an
// offsetWidth of 40 against a rect width of 50.
//
// So a tooltip landed at x * zoom instead of x — to the right above 100% and
// to the left below it, by more the further across the page it was, and with
// the same error in y where the page had scrolled far enough for anyone to
// notice. It was reported as a tooltip sitting 10 to 20 pixels left of its
// icon on one machine and nowhere else, which is exactly what a page zoom of
// 90 or 95 per cent does and nothing else in the app would explain.
//
// Read off document.body rather than off the surface being positioned. A
// surface has a transform of its own for the length of its entrance animation
// — db-menu scales from 0.96 — and getBoundingClientRect includes that, so
// measuring there returned 0.864 for a real zoom of 0.9 on the one frame it
// mattered. Body carries the zoom and never carries a transform.
//
// Self-calibrating rather than reading `appearance.pageZoom`: the SDK has no
// access to the host's settings, and a ratio is right whatever sets the zoom
// and wherever it is set.
export function pageZoomFactor() {
  if (typeof document === "undefined") return 1;
  const body = document.body;
  const layout = body?.offsetWidth;
  if (!layout) return 1;
  const factor = body.getBoundingClientRect().width / layout;
  // Anything outside this is not a page zoom — a mid-animation measurement, a
  // detached node, a division that came out NaN — and 1 is the safe answer.
  return factor > 0.2 && factor < 5 ? factor : 1;
}

// An anchor's rectangle in the coordinate space a `left`/`top` written onto a
// sibling of it will actually be read in.
export function layoutRect(el, zoom = pageZoomFactor()) {
  const r = el.getBoundingClientRect();
  if (zoom === 1) return r;
  return {
    left: r.left / zoom,
    top: r.top / zoom,
    right: r.right / zoom,
    bottom: r.bottom / zoom,
    width: r.width / zoom,
    height: r.height / zoom,
  };
}
