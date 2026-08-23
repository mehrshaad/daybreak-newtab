import { useEffect, useRef, useState } from "react";

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
export function useMeasuredBox() {
  const ref = useRef(null);
  const [box, setBox] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => {
      // contentRect, not the border box: what a widget is deciding about is the
      // room it has to lay things out in, which is inside its own padding.
      const { width, height } = entry.contentRect;
      setBox((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, box];
}

// Most callers only branch on width, so they get it directly rather than
// unpacking a box and remembering that it can be null.
export function useMeasuredWidth() {
  const [ref, box] = useMeasuredBox();
  return [ref, box ? box.width : null];
}
