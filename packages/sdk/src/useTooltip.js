import { useCallback, useEffect, useRef, useState } from "react";
import { usePointerExit } from "./usePointerExit";

const SHOW_DELAY = 400;

// Drives a Tooltip on a delay, so it doesn't flash on a quick pass-through —
// the same restraint a native title attribute has.
//
// Usage: spread `anchorProps` onto the element that should show it (this is
// what starts/stops the hover timer) and keep the real accessible name on
// that element's own aria-label — then render <Tooltip {...rest} /> as a
// sibling, never a wrapper, so it never changes the anchor's own layout.
export function useTooltip(label) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  // Whether a reveal is counting down. Tracked in state, not only in the timer,
  // because the guards below have to be able to cancel a pending tooltip as
  // well as close an open one.
  const [pending, setPending] = useState(false);
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setPending(false);
    setOpen(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Dropping the label takes the hover handlers away with it, so nothing is
  // left to close this: a reveal already counting down still fires, and a
  // tooltip already open has no way back down. Whatever was in flight is
  // abandoned here instead, so a caller that suppresses its label part-way
  // through a hover — the drag handle does, for the length of a drag — comes
  // back closed rather than showing the moment the label returns.
  useEffect(() => {
    if (label) return;
    hide();
  }, [label, hide]);

  // Every way the pointer can end up somewhere else, including the ones that
  // never fire a mouseleave. See usePointerExit — the anchor being replaced
  // under a stationary pointer, and the pointer crossing onto another monitor,
  // are both handled there rather than patched per caller.
  usePointerExit(anchorRef, open || pending, hide);

  // The tooltip's own dismissal policy, on top of that: a label is help for
  // something you have not done yet, so starting to do anything takes it away.
  // Deliberately not part of usePointerExit, because a hover background wants
  // the opposite — it should survive the click that happens on top of it.
  useEffect(() => {
    if (!open && !pending) return undefined;
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", hide, true);
    return () => {
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
    };
  }, [open, pending, hide]);

  const show = () => {
    clearTimeout(timerRef.current);
    setPending(true);
    timerRef.current = setTimeout(() => {
      setPending(false);
      setOpen(true);
    }, SHOW_DELAY);
  };

  if (!label) {
    return { anchorRef, open: false, label, anchorProps: {} };
  }

  return {
    anchorRef,
    open,
    label,
    anchorProps: { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide },
  };
}

