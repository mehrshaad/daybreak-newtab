import { useMemo, useState } from "react";

// Hover state as JS rather than CSS: the design styles everything inline off
// CSS custom properties, so keeping hover here means each component has one
// source of truth for its look.
export function useHover() {
  const [hovered, setHovered] = useState(false);
  const bind = useMemo(
    () => ({
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    }),
    []
  );
  return [hovered, bind];
}
