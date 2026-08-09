// Keeps a floating rectangle on screen. Shared by every popover-like surface —
// the context menu, and anything built on Popover — so there is one place that
// knows how to keep a box inside the viewport.
export function clampToViewport(x, y, width, height, edge = 12) {
  return {
    left: Math.max(edge, Math.min(x, window.innerWidth - width - edge)),
    top: Math.max(edge, Math.min(y, window.innerHeight - height - edge)),
  };
}
