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
