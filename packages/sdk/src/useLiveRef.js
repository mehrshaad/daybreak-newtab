import { useMemo, useRef } from "react";

// A ref that looks its element up again every time it is read.
//
// For anchoring a floating surface to something that can be replaced under it.
// A normal ref holds the node it was given, and a node that React unmounts
// keeps answering getBoundingClientRect with zeroes rather than throwing — so
// a popover anchored to it recomputes its position from a 0x0 box at the
// origin, works out that a 228px panel centred on that starts at -114, and
// clamps itself to the top-left corner of the window.
//
// Which is exactly what happened when a Quick Link was filed into a folder
// from its own editor: the link moves to a different group, that group is a
// different IconGrid, so the icon is unmounted from one and mounted in the
// other. Same link, same key, new element, and the popover jumped to the
// corner while the person was still typing the folder's name.
//
// Resolving on read makes that a non-event: the popover reads the anchor, gets
// whichever element currently carries the key, and stays put.
export function useLiveRef(resolve) {
  const latest = useRef(resolve);
  latest.current = resolve;
  // Identity has to be stable, or every render hands consumers a new "ref" and
  // any effect keyed on it re-runs forever.
  return useMemo(
    () => ({
      get current() {
        return latest.current() || null;
      },
    }),
    []
  );
}
