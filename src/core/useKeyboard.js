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

// Tracks whether the page has scrolled past a threshold, for the condensing
// header. Uses a passive listener so scrolling stays smooth.
export function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
