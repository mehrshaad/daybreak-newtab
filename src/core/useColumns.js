import { useEffect, useState } from "react";

// The design assumes a wide window and hardcodes a 12-column grid. On a
// narrow one, a 3-column tile becomes unreadably thin, so the grid itself
// narrows and tile spans are clamped to fit (see tileStyle).
export const BREAKPOINTS = [
  { min: 1100, columns: 12 },
  { min: 760, columns: 8 },
  { min: 0, columns: 4 },
];

export function columnsForWidth(width) {
  return BREAKPOINTS.find((b) => width >= b.min).columns;
}

export function useColumns() {
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined" ? 12 : columnsForWidth(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => setColumns(columnsForWidth(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return columns;
}

// Board.jsx's own numbers: the grid is capped at this width, centred, inside
// this much side padding.
export const BOARD_MAX = 1560;
export const BOARD_PAD = 28;

// How wide the board is allowed to get. The cap exists so a line of text never
// runs the whole width of a very wide monitor, but on a 2560px screen it leaves
// roughly 40% of the page unused, and some people would rather have the room.
// "full" still keeps the side padding — edge-to-edge tiles read as broken.
export const BOARD_WIDTHS = {
  comfortable: BOARD_MAX,
  wide: 2000,
  full: Infinity,
};

export function boardMaxWidth(width) {
  const value = BOARD_WIDTHS[width] ?? BOARD_MAX;
  return Number.isFinite(value) ? `${value}px` : "none";
}

// The inset the app shell takes on its right while a drawer is open, so the
// board reflows into what is left instead of sitting under the panel.
//
// The test was "under 1600px", which let the drawer cover the widgets across
// the whole range from 1600 up to about 2360 — where a 400px panel still
// reaches a centred 1560px board. It is a comparison between two edges, so
// compare the two edges.
//
// The inset is the drawer's full width rather than the measured overlap:
// insetting narrows the content area, which re-centres the board and moves its
// right edge again, and anything short of the full width does not converge —
// at 1700px, insetting by the 330px overlap leaves the board's edge 42px
// under the panel still. A full-width inset always clears it exactly.
export function boardShift(viewportWidth, drawerWidth, boardWidth = "comfortable") {
  if (!drawerWidth || !viewportWidth) return 0;
  // The cap is a setting now, so the overlap test has to use whichever one is
  // in force — a "full" board reaches the drawer at every window size.
  const cap = BOARD_WIDTHS[boardWidth] ?? BOARD_MAX;
  const half = Math.min(cap, viewportWidth - BOARD_PAD * 2) / 2;
  const covered = viewportWidth / 2 + half > viewportWidth - drawerWidth;
  return covered ? drawerWidth : 0;
}

export function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerWidth
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}
