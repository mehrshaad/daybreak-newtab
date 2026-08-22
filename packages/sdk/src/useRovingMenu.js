import { useCallback, useEffect } from "react";

// Keyboard for a menu whose highlight is the browser's own focus.
//
// Extracted the second time it was needed rather than the third: the toolbar's
// engine picker shipped as a menu that could be opened and then not left —
// Escape did nothing and the items could not be reached at all — and the next
// menu built the same way would have shipped the same way. There is nothing
// clever here; the point is that there is now one copy of it.
//
// Roving focus rather than a tracked index. The focused element *is* the
// highlight, so there is no second piece of state that can disagree with what
// the browser thinks, and a screen reader is told about the move for free.
export function useRovingMenu(menuRef, { open, onClose, itemSelector = "[role=menuitemradio]" }) {
  // Opening puts focus on the checked item, which is what makes the arrows work
  // at all — they move from wherever focus is.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    const items = [...menu.querySelectorAll(itemSelector)];
    (items.find((i) => i.getAttribute("aria-checked") === "true") || items[0])?.focus();
  }, [open, menuRef, itemSelector]);

  return useCallback(
    (event) => {
      const menu = menuRef.current;
      const items = [...(menu?.querySelectorAll(itemSelector) || [])];
      const at = items.indexOf(document.activeElement);
      if (event.key === "Escape") {
        // Stopped here so a second Escape can reach whatever is behind this,
        // rather than one keystroke closing both.
        event.stopPropagation();
        onClose(true);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        // Wraps, so holding one direction reaches everything without having to
        // know which end you started from.
        items[(at + step + items.length) % items.length]?.focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        (event.key === "Home" ? items[0] : items[items.length - 1])?.focus();
      } else if (event.key === "Tab") {
        // Tabbing out closes it rather than leaving a menu hanging over the
        // board with focus somewhere else entirely.
        onClose(false);
      }
    },
    [menuRef, onClose, itemSelector]
  );
}
