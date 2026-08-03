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

  useEffect(() => {
    if (open) {
      setPresent(true);
      setClosing(false);
      return undefined;
    }
    if (!present) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      setPresent(false);
      setClosing(false);
    }, exitMs);
    return () => clearTimeout(t);
  }, [open, present, exitMs]);

  return [present, closing];
}
