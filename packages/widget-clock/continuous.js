import { useRef } from "react";
import { continueAngle } from "./angles";

// Keeps a hand's rotation accumulating across the 360-degree seam, so a CSS
// transition on it never runs backwards. See continueAngle for why.
//
// The ref is written during render, which is normally a smell. It is safe here
// because the update is idempotent: React's StrictMode calls a component twice,
// and the second call sees `last === degrees`, so the delta is zero and the
// shown angle does not move twice.
export function useContinuousAngle(degrees) {
  const state = useRef({ shown: degrees, last: degrees });
  state.current = {
    shown: continueAngle(state.current.shown, state.current.last, degrees),
    last: degrees,
  };
  return state.current.shown;
}
