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

export function clampToViewport(x, y, width, height, edge = 12) {
  const space = available();
  return {
    left: Math.max(edge, Math.min(x, space.width - width - edge)),
    top: Math.max(edge, Math.min(y, space.height - height - edge)),
  };
}

