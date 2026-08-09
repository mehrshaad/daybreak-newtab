import { describe, expect, it } from "vitest";
import { BOARD_MAX, BOARD_PAD, boardShift } from "./useColumns";

// Where the board's right edge sits inside a content area of a given width —
// capped, centred, inside its own side padding. Written out here so the
// expectations below are geometry rather than a restatement of the code.
const boardRight = (area) => area / 2 + Math.min(BOARD_MAX, area - BOARD_PAD * 2) / 2;

describe("boardShift", () => {
  it("is nothing with no drawer open", () => {
    expect(boardShift(1440, 0)).toBe(0);
  });

  it("is nothing on a window wide enough that the drawer clears the board", () => {
    const wide = 2600;
    expect(boardRight(wide)).toBeLessThan(wide - 400);
    expect(boardShift(wide, 400)).toBe(0);
  });

  // The old rule only inset below 1600px, so every width in this range had a
  // drawer sitting on top of the widgets.
  it("insets across the range the old 1600px cutoff missed", () => {
    for (const w of [1700, 1900, 2100, 2300]) {
      expect(boardShift(w, 400), `${w}px`).toBe(400);
    }
  });

  it("leaves the board clear of the drawer at every width", () => {
    for (const w of [900, 1100, 1280, 1440, 1700, 1900, 2100, 2300, 2560, 3000]) {
      const inset = boardShift(w, 400);
      // What the board actually gets to lay out in, once the inset is applied.
      expect(boardRight(w - inset), `${w}px`).toBeLessThanOrEqual(w - 400 + 0.5);
    }
  });

  it("insets by the narrower widget drawer's own width", () => {
    expect(boardShift(2100, 340)).toBe(340);
    expect(boardRight(2100 - 340)).toBeLessThanOrEqual(2100 - 340 + 0.5);
  });

  it("survives a missing viewport", () => {
    expect(boardShift(0, 400)).toBe(0);
  });
});
