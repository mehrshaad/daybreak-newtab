import { useCallback, useRef, useState } from "react";

// A widget's real content width, for the decisions that depend on it.
//
// Widgets branch on their grid span, and a span is not a width. The board is
// twelve 1fr tracks inside a container whose cap is a user setting, so the same
// three-column tile is 240px on a 1200px window and 580px on a full-width
// 2560px board. Measured:
//
//   span        comfortable (1560)   full (2560)   1200px window
//   2 columns              203px         370px            143px
//   3 columns              330px         580px            240px
//   4 columns              456px         789px            336px
//
// A two-column tile on a wide board is wider than a five-column tile on a
// narrow one. So "size[0] >= 4" means "wide" on the board it was written for and
// nothing anywhere else: it hid a row of detail that would have fitted, and
// showed one that did not.
//
// Height needs none of this. The board's rows are a fixed 96px, so a span of
// three rows is always the same height and `size[1]` is exact. Only width moves.
//
// Returns null until the first measurement, so a caller can fall back to its
// span for the first frame rather than flickering through a wrong layout.
//
// A callback ref, and that part is load-bearing. This used to be a plain ref
// observed from a mount effect with no dependencies, which quietly assumed the
// element it measured would live as long as the component. Several widgets put
// a `key` on the very element they measure, to crossfade when a mode changes —
// the clock does it for analog, seconds and the date line. Changing that key
// replaces the element, and the mount effect never runs again, so the observer
// was left watching a node that had been detached from the document. A detached
// node reports nothing, so the measurement froze at whatever it was before the
// toggle and every later change of size did nothing at all.
//
// A callback ref is told about both ends of that swap, so the observer follows
// the element that is actually on screen.
export function useMeasuredBox() {
  const [box, setBox] = useState(null);
  const observerRef = useRef(null);
  const nodeRef = useRef(null);

  const ref = useCallback((node) => {
    // React calls a callback ref with null before the new node on a swap, and
    // can call it again with the same node on an unrelated re-render.
    if (nodeRef.current === node) return;
    nodeRef.current = node;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(([entry]) => {
      // contentRect, not the border box: what a widget is deciding about is the
      // room it has to lay things out in, which is inside its own padding.
      const { width, height } = entry.contentRect;
      setBox((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    });
    ro.observe(node);
    observerRef.current = ro;
  }, []);

  // Deliberately not clearing `box` when the node goes: on a keyed swap the
  // replacement is the same size, and blanking the measurement in between would
  // flash one frame of the caller's fallback layout on every toggle.
  //
  // And deliberately no unmount effect to disconnect. There was one, and it
  // broke the analog clock faces: under StrictMode React runs every effect
  // setup, cleanup, setup again, while a callback ref is attached, detached and
  // re-attached in a separate pass. Whichever order those two interleave in
  // decides whether the disconnect lands on an observer that has already been
  // replaced (harmless) or on the live one the ref just created (fatal, and
  // nothing re-creates it). It came out differently for a component and one
  // nested inside it, which is why the digital clock measured fine while
  // BareFace never did and drew nothing at all.
  //
  // The callback ref already covers the whole lifecycle: React calls it with
  // null when the element goes away, including on unmount, and that branch
  // disconnects. One owner of the observer, no ordering to get wrong.

  return [ref, box];
}

// Most callers only branch on width, so they get it directly rather than
// unpacking a box and remembering that it can be null.
export function useMeasuredWidth() {
  const [ref, box] = useMeasuredBox();
  return [ref, box ? box.width : null];
}
