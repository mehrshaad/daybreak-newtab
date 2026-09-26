import { useEffect, useState } from "react";
import { isFloating } from "@daybreak/sdk";

const isTypingTarget = (el) =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable);

// Whether a keystroke is somebody starting to type rather than reaching for a
// shortcut.
//
// One printable character, no modifier. `key.length === 1` is the whole test
// for printable and it is a better one than a character-class regex: it covers
// every alphabet and no named key, since those are all "Enter", "ArrowUp",
// "F5" and so on.
//
// Space is deliberately not included. With nothing focused, space is how you
// scroll a page, and a search that begins with a space is not a search anybody
// meant to start.
export function startsTyping(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key.length !== 1 || e.key === " ") return false;
  if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return false;
  // A menu has its own keyboard, and typing into one is how you jump to an
  // item in it. Stealing the keystroke would break that.
  if (isFloating(document.activeElement)) return false;
  return true;
}

// Global shortcuts. `enabled` mirrors the "Keyboard shortcuts" general toggle;
// Escape stays active regardless so overlays can always be dismissed.
export function useKeyboard({
  enabled = true,
  onEscape,
  onSearch,
  onType,
  onToggleEdit,
  onStore,
}) {
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
        return;
      }

      // Just typing. The character is handed over explicitly rather than left
      // to fall through to the newly focused field: moving focus during
      // keydown usually does deliver it, but "usually" is the wrong guarantee
      // for the first letter of every search somebody types.
      if (onType && startsTyping(e)) {
        e.preventDefault();
        onType(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onEscape, onSearch, onType, onToggleEdit, onStore]);
}

// Decides whether the header should be condensed. Pure, so the flicker it
// prevents can be tested without a DOM.
//
// The band has to be wider than the distance the scroll position slides when the
// state changes. Condensing takes about 25px off the header, which shortens the
// document, and Chrome's scroll anchoring pulls scrollY down by the same amount
// to keep the board visually still — measured in Chrome, scrolling to y=100
// condensed the header and left scrollY at 75.
//
// With 48 and 12 there is 36px of margin, so a 25px slide can never cross back
// over the threshold it just left. A narrower band oscillates: condense, get
// dragged below the release point, expand, get pushed back up, condense. That is
// the flicker seen just off the top of the page, and no amount of extra
// conditions fixes it — only a band wider than the slide does.
//
// It also covers the barely-scrollable case on its own: engaging needs y > 48, so
// the page must have more than 48px of overflow, and after losing 25 it still has
// more than the release point.
export function nextScrolled(was, y, on = 48, off = 12) {
  return was ? y > off : y > on;
}

// Tracks whether the page has scrolled past the threshold, for the condensing
// header. Uses a passive listener so scrolling stays smooth.
export function useScrolled(on = 48, off = 12) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Deliberately reads nothing but scrollY: measuring scrollHeight here would
    // force a layout on every scroll event.
    const update = () => {
      setScrolled((was) => nextScrolled(was, window.scrollY, on, off));
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
