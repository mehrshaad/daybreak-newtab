import { useEffect, useRef, useState } from "react";

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
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Dropping the label takes the hover handlers away with it, so nothing is
  // left to close this: a reveal already counting down still fires, and a
  // tooltip already open has no way back down. Whatever was in flight is
  // abandoned here instead, so a caller that suppresses its label part-way
  // through a hover — the drag handle does, for the length of a drag — comes
  // back closed rather than showing the moment the label returns.
  useEffect(() => {
    if (label) return;
    clearTimeout(timerRef.current);
    setOpen(false);
  }, [label]);

  const show = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), SHOW_DELAY);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
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
