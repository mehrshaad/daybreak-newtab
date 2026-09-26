import { describe, expect, it } from "vitest";
import { startsTyping } from "./useKeyboard";

// Typing on the board goes to the search field, the way it does on Chrome's
// own new tab. The whole question is which keystrokes count, because getting
// it wrong means swallowing somebody's shortcut or their scroll.

const press = (key, over = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: document.body,
  ...over,
});

describe("what counts as starting to type", () => {
  it("is a printable character", () => {
    for (const key of ["a", "Z", "7", "?", "ü", "ب", "字"]) {
      expect(startsTyping(press(key)), key).toBe(true);
    }
  });

  it("is not a named key", () => {
    // key.length === 1 is the whole test, and this is why: every named key is
    // longer, in every alphabet, with no list to keep up to date.
    for (const key of ["Enter", "Tab", "ArrowDown", "Escape", "F5", "Backspace", "Home"]) {
      expect(startsTyping(press(key)), key).toBe(false);
    }
  });

  it("is not a shortcut", () => {
    expect(startsTyping(press("k", { ctrlKey: true }))).toBe(false);
    expect(startsTyping(press("k", { metaKey: true }))).toBe(false);
    expect(startsTyping(press("e", { altKey: true }))).toBe(false);
  });

  it("is not space", () => {
    // With nothing focused, space is how you scroll a page. And a search that
    // starts with a space is not a search anybody meant to start.
    expect(startsTyping(press(" "))).toBe(false);
  });
});

describe("where the keystroke came from", () => {
  const withActive = (el, fn) => {
    const spy = Object.getOwnPropertyDescriptor(Document.prototype, "activeElement");
    Object.defineProperty(document, "activeElement", { value: el, configurable: true });
    try {
      return fn();
    } finally {
      if (spy) Object.defineProperty(document, "activeElement", spy);
    }
  };

  it("is ignored while typing in a field", () => {
    const input = document.createElement("input");
    expect(startsTyping(press("a", { target: input }))).toBe(false);
  });

  it("is ignored in a textarea or a contenteditable", () => {
    const area = document.createElement("textarea");
    expect(startsTyping(press("a", { target: area }))).toBe(false);
    const note = document.createElement("div");
    note.isContentEditable = true;
    expect(startsTyping(press("a", { target: note }))).toBe(false);
  });

  it("is ignored when focus is in a field even if the event came from elsewhere", () => {
    // Scratchpad and the widget settings both put focus in a box the event may
    // not be targeted at. The active element is the one that decides.
    const input = document.createElement("input");
    expect(withActive(input, () => startsTyping(press("a")))).toBe(false);
  });

  it("is ignored inside an open menu", () => {
    // A menu has its own keyboard — typing into one is how you jump to an
    // item. Stealing that would break it.
    const menu = document.createElement("div");
    menu.setAttribute("data-floating", "menu");
    const row = document.createElement("button");
    menu.appendChild(row);
    document.body.appendChild(menu);
    try {
      expect(withActive(row, () => startsTyping(press("a")))).toBe(false);
    } finally {
      menu.remove();
    }
  });

  it("is taken on the board itself", () => {
    // The guard on the guard: if every branch above said false this would too,
    // and the feature would silently do nothing.
    expect(withActive(document.body, () => startsTyping(press("a")))).toBe(true);
  });
});
