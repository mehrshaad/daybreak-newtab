import { useEffect, useRef } from "react";
import { onSyncQuotaError } from "@daybreak/sdk";
import { appVersion } from "./version";

// Three things the app knows and the user does not.
//
// Each of these was previously either silent or unknowable: a sync write that
// failed, a version that changed under you, and a page that is dropping frames
// because of an effect you could simply switch off.

const SEEN_VERSION = "daybreak.seenVersion";

// Below this, for this many consecutive sampled seconds, is a real problem and
// not a hiccup. One bad second happens whenever another tab does something
// expensive; three in a row while the user is actually dragging something does
// not.
const SLOW_FPS = 34;
const SLOW_RUN = 3;

export function useConditions({ notify, blurOn, onTurnOffBlur }) {
  // Held in a ref so the effects below never re-run just because a new closure
  // was made — resubscribing to storage on every render would be its own bug.
  const latest = useRef({ notify, blurOn, onTurnOffBlur });
  latest.current = { notify, blurOn, onTurnOffBlur };

  // Sync stopped working.
  useEffect(
    () =>
      onSyncQuotaError(() =>
        latest.current.notify({
          category: "sync",
          message: "Your settings are too large to sync. Saved on this device only.",
          // Sticky: this does not resolve itself, and a message that matters
          // until the user does something about it should not slide away while
          // they are reading it.
          duration: 0,
        })
      ),
    []
  );

  // The extension updated itself.
  useEffect(() => {
    const version = appVersion();
    if (!version) return;
    let seen = null;
    try {
      seen = localStorage.getItem(SEEN_VERSION);
    } catch {
      // Storage disabled. Nothing to compare against, so say nothing.
      return;
    }
    try {
      localStorage.setItem(SEEN_VERSION, version);
    } catch {
      /* cannot remember it; better to stay quiet than to repeat forever */
      return;
    }
    // A first run has nothing to compare against — announcing "updated to
    // 2.1.0" to someone who just installed 2.1.0 is nonsense.
    if (!seen || seen === version) return;
    latest.current.notify({
      category: "update",
      message: `Daybreak updated to ${version}.`,
    });
  }, []);

  // The page is struggling, and blur is the usual reason.
  useEffect(() => {
    if (!latest.current.blurOn) return undefined;
    if (typeof requestAnimationFrame !== "function") return undefined;

    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    let slowSeconds = 0;
    let done = false;

    const loop = (now) => {
      frames += 1;
      const elapsed = now - windowStart;
      if (elapsed >= 1000) {
        const fps = (frames * 1000) / elapsed;
        // Only counted while something is actually happening. A still page
        // legitimately renders almost nothing, and calling that "slow" would
        // flag every machine on earth.
        const busy = document.querySelector('[data-dragging="true"]') || document.body.dataset.busy;
        slowSeconds = busy && fps < SLOW_FPS ? slowSeconds + 1 : 0;
        frames = 0;
        windowStart = now;

        if (slowSeconds >= SLOW_RUN && !done) {
          done = true;
          latest.current.notify({
            category: "performance",
            message: "This is running slowly. Turning off the blur usually helps.",
            duration: 0,
            action: { label: "Turn off blur", run: () => latest.current.onTurnOffBlur?.() },
          });
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [blurOn]);
}
