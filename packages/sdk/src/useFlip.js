import { useLayoutEffect, useRef } from "react";

// CSS grid reflow is not animatable: when a tile changes span, or is added,
// removed or reordered, every other tile jumps to its new slot. FLIP fixes
// that — measure where things were (First), let the browser lay out the new
// state (Last), then Invert the delta as a transform and Play it back to zero.
//
// Elements opt in with `data-flip-id`. The id must be stable across the change,
// which is why board tiles use their instance id.
//
// Only DIRECT children are considered. Icon grids inside widgets use the same
// attribute for their own reordering, and a descendant query would let the
// board treat individual app icons as though they were tiles.

export const FLIP_DURATION = 380;
export const FLIP_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";
export const ENTER_DURATION = 260;

export const FLIP_ITEMS = ":scope > [data-flip-id]";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// getBoundingClientRect reports an element's *transformed* box, so a tile
// being positioned by hand (the one under the pointer, moved by
// usePointerReorder) would measure wherever it currently appears rather than
// where it is laid out. Clearing and restoring the transform inside one task
// means nothing is painted in between — the same trick usePointerReorder uses
// for exactly this reason.
function measure(container) {
  const map = new Map();
  for (const node of container.querySelectorAll(FLIP_ITEMS)) {
    const applied = node.style.transform;
    if (applied) node.style.transform = "";
    map.set(node.dataset.flipId, node.getBoundingClientRect());
    if (applied) node.style.transform = applied;
  }
  return map;
}

export function useFlip(containerRef, deps, options = {}) {
  const { disabled = false, skipId = null } = options;
  const previous = useRef(null);
  // Track running animations so a change mid-flight cancels cleanly instead of
  // fighting the new one.
  const running = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cancel anything still in flight BEFORE measuring, not while walking the
    // nodes below. A running FLIP is mid-transform, and the measurement above
    // would report that transform as the tile's position — which then gets
    // cached as `previous` and becomes the next change's starting point. A
    // drag crosses slots far faster than FLIP_DURATION, so those animations
    // routinely overlap: the tile was inverted from a position it never
    // actually occupied, jumped, then resolved back to its real slot.
    for (const anim of running.current.values()) anim.cancel();
    running.current.clear();

    const next = measure(container);
    const before = previous.current;
    previous.current = next;

    if (disabled || !before || prefersReducedMotion()) return;

    for (const node of container.querySelectorAll(FLIP_ITEMS)) {
      const id = node.dataset.flipId;
      // The dragged tile is following the pointer; leave its transform alone.
      if (id === skipId) continue;

      const last = next.get(id);
      const first = before.get(id);

      if (!last || last.width === 0) continue;

      // New arrival: nothing to invert, so introduce it instead.
      if (!first) {
        const anim = node.animate(
          [
            { opacity: 0, transform: "scale(.94)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: ENTER_DURATION, easing: FLIP_EASING, fill: "none" }
        );
        running.current.set(id, anim);
        continue;
      }

      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = first.width / last.width;
      const sy = first.height / last.height;

      const moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
      const resized = Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01;
      if (!moved && !resized) continue;

      const anim = node.animate(
        [
          {
            transformOrigin: "top left",
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
          },
          { transformOrigin: "top left", transform: "none" },
        ],
        { duration: FLIP_DURATION, easing: FLIP_EASING, fill: "none" }
      );
      running.current.set(id, anim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Play a tile out before it is unmounted, so removal is not an instant pop.
// Resolves when the animation finishes (or immediately if motion is reduced).
export function animateExit(node) {
  if (!node || prefersReducedMotion() || !node.animate) return Promise.resolve();
  return node.animate(
    [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "scale(.92)" },
    ],
    { duration: 170, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
  ).finished.catch(() => {});
}
