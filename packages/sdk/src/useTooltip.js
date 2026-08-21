import { useCallback, useEffect, useRef, useState } from "react";

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

  // The ways a tooltip gets stuck, all of which are "mouseleave never arrived".
  //
  // onMouseLeave is the only thing that closed this, and it does not fire when
  // the anchor stops being under the pointer without the pointer moving off it:
  // a double-click swaps an EditableText's span for an input, entering edit
  // mode re-renders the chrome around it, a reorder slides the element out from
  // under the cursor, and a tile being dragged takes its handle with it. In
  // every one of those the element the pointer "left" no longer exists, so
  // nothing ever told the tooltip to go away and it sat there for good.
  //
  // Rather than patch each caller, the truth is checked directly: on any mouse
  // movement, if the anchor is gone from the document or no longer matches
  // :hover, close. Plus the obvious interruptions — a press, a keystroke, the
  // window losing focus, the tab being hidden.
  useEffect(() => {
    if (!open && !pending) return undefined;

    // The pointer arriving anywhere else. This is the dependable signal:
    // mouseover fires on whatever is entered next, so it reports the truth even
    // when the anchor was hidden rather than left — and unlike :hover it does
    // not depend on the browser re-running hit-testing.
    const onOver = (event) => {
      const el = anchorRef.current;
      if (!el || !el.isConnected || !el.contains(event.target)) hide();
    };

    // A backstop for movement that never enters a new element: the pointer
    // sliding within a large region while the anchor was taken away underneath.
    const onMove = () => {
      const el = anchorRef.current;
      if (!el || !el.isConnected) {
        hide();
        return;
      }
      try {
        // Only trusted to *close*, never to keep it open: :hover reflects the
        // browser's own hit-testing and can lag a layout change.
        if (!el.matches(":hover")) hide();
      } catch {
        hide();
      }
    };

    // Capture phase, so a handler that stops propagation cannot keep the
    // tooltip alive.
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", hide, true);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);

    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
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
