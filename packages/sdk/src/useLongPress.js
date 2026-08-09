import { useCallback, useRef } from "react";

const DEFAULT_DELAY = 500;
const MOVE_TOLERANCE = 8;

// Fires onLongPress after a press is held for `delay`ms without moving more
// than `moveTolerance`px or releasing early. Ignores presses that start on an
// interactive control (or anything matching `ignoreSelector`), so holding a
// checkbox or a button never competes with what that control already does.
//
// Movement and release are tracked on window for the life of the press, the
// same way usePointerReorder tracks a drag, so the timer is cancelled
// reliably even if the pointer leaves the element it started on.
//
// Returns a single onPointerDown handler — spread it onto whatever should
// respond to being held.
export function useLongPress(
  onLongPress,
  { enabled = true, delay = DEFAULT_DELAY, ignoreSelector = "button, a, input, textarea, select" } = {}
) {
  const stateRef = useRef(null);

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled) return;
      if (event.button != null && event.button !== 0) return;
      if (event.target.closest(ignoreSelector)) return;

      const startX = event.clientX;
      const startY = event.clientY;

      const cancel = () => {
        clearTimeout(stateRef.current?.timer);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", cancel);
        window.removeEventListener("pointercancel", cancel);
        stateRef.current = null;
      };

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancel();
      };

      const timer = setTimeout(() => {
        cancel();
        onLongPress(event);
      }, delay);

      stateRef.current = { timer };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", cancel);
      window.addEventListener("pointercancel", cancel);
    },
    [enabled, delay, ignoreSelector, onLongPress]
  );

  return onPointerDown;
}
