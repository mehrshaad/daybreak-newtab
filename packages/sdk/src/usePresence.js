import { useEffect, useState } from "react";

// Keeps something mounted for the length of its exit animation.
//
// React unmounts the moment a condition flips, which is why anything rendered
// as `cond ? <X/> : null` can animate in but only ever vanishes. This returns
// [present, closing]: render while `present`, and play the exit variant while
// `closing`.
export function usePresence(open, exitMs) {
  const [present, setPresent] = useState(open);
  const [closing, setClosing] = useState(false);

  // Mounting happens during render, not in an effect. An effect is a render
  // too late, and for a menu that is the difference between working and not:
  // whatever opens it puts focus on a row in its own open effect, and on the
  // render where `open` first went true the rows did not exist yet, so focus
  // stayed on the button and the arrow keys had nothing to move from.
  //
  // Calling a setter during render of the same component is the supported way
  // to do this — React throws the render away and immediately re-runs it, so
  // the mount lands in the same commit as the flag.
  if (open && !present) setPresent(true);
  if (open && closing) setClosing(false);

  // Unmounting still waits, because that is the whole point of the hook.
  useEffect(() => {
    if (open || !present) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      setPresent(false);
      setClosing(false);
    }, exitMs);
    return () => clearTimeout(t);
  }, [open, present, exitMs]);

  return [present, closing];
}
