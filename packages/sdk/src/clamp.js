// Keeps a floating rectangle on screen. Shared by every popover-like surface —
// the context menu, the tooltip, and anything built on Popover — so there is
// one place that knows how to keep a box inside the viewport.
//
// Measured against the document element rather than window.innerWidth, which
// counts the scrollbar as usable space. The board is taller than the viewport
// often enough to have one, and a box pushed in from the right edge was landing
// with its last dozen pixels underneath it. clientWidth is the space actually
// available to paint in, so falling back to innerWidth only matters where there
// is no document element at all.
function available() {
  const root = typeof document === "undefined" ? null : document.documentElement;
  return {
    width: root?.clientWidth || window.innerWidth,
    height: root?.clientHeight || window.innerHeight,
  };
}

// `zoom` is the page-zoom factor — see zoom.js. clientWidth is a visual
// measurement and the box being placed is in layout pixels, so the space has
// to be converted before the two are compared, or a 90% zoom would clamp
// everything into the left ten per cent of a viewport it thought was narrow.
export function clampToViewport(x, y, width, height, edge = 12, zoom = 1) {
  const space = available();
  const w = space.width / zoom;
  const h = space.height / zoom;
  return {
    left: Math.max(edge, Math.min(x, w - width - edge)),
    top: Math.max(edge, Math.min(y, h - height - edge)),
  };
}

