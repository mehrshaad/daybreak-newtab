import { useCallback, useMemo, useRef, useState } from "react";
import { usePointerExit } from "./usePointerExit";

// Hover state as JS rather than CSS: the design styles everything inline off
// CSS custom properties, so keeping hover here means each component has one
// source of truth for its look.
//
// onMouseLeave alone left hover states stuck on — a control that stopped being
// under the pointer without the pointer moving off it never got one, so it kept
// its hover background until something else happened to touch it. The same
// guards a tooltip needs apply here, so they are shared (see usePointerExit).
//
// The node comes off the mouseenter event rather than from a ref the caller has
// to wire up. Nothing that hovers needs a ref for any other reason, and putting
// one in the returned props would silently take over the ref of every caller
// that spreads them onto an element it already refs — which the board's tiles
// do.
export function useHover() {
  const [hovered, setHovered] = useState(false);
  const nodeRef = useRef(null);
  const clear = useCallback(() => setHovered(false), []);

  usePointerExit(nodeRef, hovered, clear);

  const bind = useMemo(
    () => ({
      onMouseEnter: (event) => {
        nodeRef.current = event.currentTarget;
        setHovered(true);
      },
      onMouseLeave: clear,
    }),
    [clear]
  );

  return [hovered, bind];
}

