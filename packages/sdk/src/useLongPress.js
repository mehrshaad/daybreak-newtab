import { useCallback, useRef } from "react";

const DEFAULT_DELAY = 500;
const MOVE_TOLERANCE = 8;

// Whether a pointer went down on an element's own scrollbar.
//
// A scrollbar is not a DOM node, so the event target is the scrolling element
// itself and nothing in `ignoreSelector` can describe it. `offsetX` is measured
// from the padding edge and `clientWidth` excludes the scrollbar, so a press
// past that width is a press on the gutter.
//
// Guarded on the element actually scrolling in that direction: on a box that
// does not scroll there is no gutter, and a press near the right edge is just
// a press near the right edge.
export function isScrollbarPress(event) {
  const el = event?.target;
  if (!el || typeof el.clientWidth !== "number") return false;
  if (el.scrollHeight > el.clientHeight && event.offsetX > el.clientWidth) return true;
  if (el.scrollWidth > el.clientWidth && event.offsetY > el.clientHeight) return true;
  return false;
}

// Fires onLongPress after a press is held for `delay`ms without moving more
// than `moveTolerance`px or releasing early. Ignores presses that start on an
// interactive control (or anything matching `ignoreSelector`), so holding a
// checkbox or a button never competes with what that control already does.
//
// Also ignores a press on a scrollbar. Reaching for a widget's scrollbar and
// holding it — which is what dragging a scrollbar is — put the board into edit
// mode, because the gutter belongs to the tile as far as the DOM is concerned
// and the press never moved far enough to cancel.
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
      if (isScrollbarPress(event)) return;

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
