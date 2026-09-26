import { describe, expect, it } from "vitest";
import { isScrollbarPress } from "./useLongPress";

// Reaching for a widget's scrollbar put the board into edit mode.
//
// Holding a tile is the gesture that starts arranging the board, and a
// scrollbar is not a DOM node: pressing one targets the scrolling element, so
// as far as the long press could tell you were holding the tile. Dragging the
// thumb does not save you either, because the press starts stationary and the
// 500ms lands before the pointer has gone anywhere.
//
// `offsetX` is measured from the padding edge and `clientWidth` excludes the
// scrollbar, so the gutter is everything past clientWidth.

// A scrolling box 200 wide with a 15px vertical scrollbar: 185 of content.
const scrollsDown = (offsetX, offsetY = 40) => ({
  target: { clientWidth: 185, clientHeight: 300, scrollWidth: 185, scrollHeight: 900 },
  offsetX,
  offsetY,
});

const scrollsAcross = (offsetY, offsetX = 40) => ({
  target: { clientWidth: 300, clientHeight: 185, scrollWidth: 900, scrollHeight: 185 },
  offsetX,
  offsetY,
});

describe("a press on a scrollbar", () => {
  it("is one, in the vertical gutter", () => {
    expect(isScrollbarPress(scrollsDown(192))).toBe(true);
  });

  it("is one, in the horizontal gutter", () => {
    expect(isScrollbarPress(scrollsAcross(192))).toBe(true);
  });

  it("is not one just short of the gutter", () => {
    // The boundary matters: one pixel of slack here would swallow presses on
    // whatever sits hard against the right edge of a tile.
    expect(isScrollbarPress(scrollsDown(185))).toBe(false);
    expect(isScrollbarPress(scrollsDown(184))).toBe(false);
  });

  it("is not one in the middle of the content", () => {
    expect(isScrollbarPress(scrollsDown(40))).toBe(false);
  });
});

describe("a press on a box with nothing to scroll", () => {
  it("is never a scrollbar press, however near the edge", () => {
    // No overflow means no gutter, and the right-hand edge of a tile is a
    // perfectly ordinary place to start holding it.
    const still = {
      target: { clientWidth: 185, clientHeight: 300, scrollWidth: 185, scrollHeight: 300 },
      offsetX: 400,
      offsetY: 400,
    };
    expect(isScrollbarPress(still)).toBe(false);
  });

  it("does not throw on a target that is not an element", () => {
    expect(isScrollbarPress({ target: null })).toBe(false);
    expect(isScrollbarPress({})).toBe(false);
    expect(isScrollbarPress(undefined)).toBe(false);
  });
});
