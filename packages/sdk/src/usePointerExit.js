import { useEffect } from "react";

// "The pointer is no longer on this element", answered by watching the document
// rather than by waiting for the element's own mouseleave.
//
// mouseleave is the obvious signal and it is not enough. It fires when the
// pointer moves off an element, and every stuck hover in this app came from a
// case where that never happened:
//
//   - The element stopped being under the pointer without the pointer moving.
//     A double click swaps an EditableText's span for an input, entering edit
//     mode re-renders the chrome around a control, a reorder slides a
//     neighbour out from under the cursor, a dragged tile takes its handle
//     with it. React removed the node the pointer was on, so there was nothing
//     left to leave, and whatever it was showing stayed on screen for good.
//   - The pointer left the window altogether. Moving onto a second monitor, or
//     straight off the top of the screen, happens without a click, so the
//     window never blurs and no element ever reports a leave. This is the one
//     that only shows up on a multi-monitor desk, which is why it survived the
//     first round of fixes.
//
// So the question is put to the document instead, and only ever answered in
// the direction of leaving: these guards may close a hover, never keep one
// open. Deliberately narrow - it reports that the pointer is elsewhere and
// nothing more. What a caller does about a click or a keystroke is its own
// policy, and the two callers disagree: a tooltip should get out of the way of
// a click, a hover background should not.
export function usePointerExit(nodeRef, active, onExit) {
  useEffect(() => {
    if (!active) return undefined;

    // The pointer arriving anywhere else. This is the dependable signal:
    // mouseover is reported by whatever was entered next, so it tells the
    // truth even when the element was hidden rather than left, and unlike
    // :hover it does not wait on the browser re-running hit-testing. (:hover
    // was the first attempt and it reported true for an element that had been
    // hidden under a stationary pointer, so it could not be trusted at all.)
    const onOver = (event) => {
      const el = nodeRef.current;
      if (!el || !el.isConnected || !el.contains(event.target)) onExit();
    };

    // The pointer leaving the window. relatedTarget is null exactly when there
    // is nothing being entered, which is what crossing onto another screen
    // looks like from in here.
    const onOut = (event) => {
      if (!event.relatedTarget) onExit();
    };

    // A backstop for movement that never enters a new element: the pointer
    // sliding within one large region while the element under it was taken
    // away underneath.
    const onMove = () => {
      const el = nodeRef.current;
      if (!el || !el.isConnected) onExit();
    };

    // Capture phase, so a handler that stops propagation cannot keep a stale
    // hover alive.
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("visibilitychange", onExit);
    window.addEventListener("blur", onExit);

    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("visibilitychange", onExit);
      window.removeEventListener("blur", onExit);
    };
  }, [nodeRef, active, onExit]);
}
