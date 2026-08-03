import { useEffect, useState } from "react";

const isTypingTarget = (el) =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable);

// Global shortcuts. `enabled` mirrors the "Keyboard shortcuts" general toggle;
// Escape stays active regardless so overlays can always be dismissed.
export function useKeyboard({ enabled = true, onEscape, onSearch, onToggleEdit, onStore }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      if (!enabled) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === "k") {
        e.preventDefault();
        onSearch?.();
        return;
      }
      // Alt-based shortcuts must not fire while the user is typing.
      if (e.altKey && !isTypingTarget(e.target)) {
        if (key === "e") {
          e.preventDefault();
          onToggleEdit?.();
        } else if (key === "a") {
          e.preventDefault();
          onStore?.();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onEscape, onSearch, onToggleEdit, onStore]);
}

// Decides whether the header should be condensed. Pure, so the flicker it
// prevents can be tested without a DOM.
//
// Two guards, both for the same flicker:
//
// - Hysteresis. The state engages at `on` and only releases below `off`. With a
//   single value, resting near it made the header and search bar flip between
//   sizes.
// - A minimum amount of scrollable page. Condensing takes ~20px off the header,
//   which makes the document shorter. On a board that is only just scrollable
//   that removes the overflow completely: the scroll position snaps to 0, the
//   header expands, the page overflows again, and it oscillates — exactly the
//   glitch seen at a scroll position close to zero but not zero. Hysteresis
//   cannot help, because the position really does return to 0 each time. So a
//   page with barely anything to scroll never condenses at all.
export const MIN_SCROLLABLE = 48;

export function nextScrolled(was, y, scrollable, on = 24, off = 6) {
  if (scrollable < MIN_SCROLLABLE) return false;
  return was ? y > off : y > on;
}

// Tracks whether the page has scrolled past the threshold, for the condensing
// header. Uses a passive listener so scrolling stays smooth.
export function useScrolled(on = 24, off = 6) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setScrolled((was) => nextScrolled(was, window.scrollY, scrollable, on, off));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [on, off]);

  return scrolled;
}
