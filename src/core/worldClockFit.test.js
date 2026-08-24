import { LIST_ROW_HEIGHT } from "@daybreak/sdk";
import { describe, expect, it } from "vitest";
import { tileBodyHeight } from "./tokens";
import manifest from "../../packages/widget-worldclocks/manifest";
import { MAX_ZONES } from "../../packages/widget-worldclocks/zones";

// Do World Clocks' rows fit the tile, at both text sizes and every tile size
// the widget offers.
//
// App-side, because it needs the board's geometry, and the version of this that
// lived next to the widget kept its own copy of that geometry — wrongly. It
// read the label row's 40px maxHeight as the row's height when the row occupies
// 14, so it understated every tile's body by 26px and concluded the widget
// already overflowed at the regular size. It does not.

// A row is its tallest line plus the listRow padding, floored at
// LIST_ROW_HEIGHT. Mirrors the `type` map in the widget.
const ROW_PAD = 10;
const LINE = 1.4;
const ROW_GAP = 2;

const rowHeight = (big, tall) =>
  Math.max(
    LIST_ROW_HEIGHT,
    Math.ceil(Math.max((big ? 16 : 13) * LINE, ((tall ? 19 : 15) + (big ? 4 : 0)) * LINE)) + ROW_PAD
  );

const stack = (zones, big, tall) => zones * rowHeight(big, tall) + (zones - 1) * ROW_GAP;

const CASES = manifest.sizes.flatMap(([cols, rows]) =>
  [true, false].flatMap((header) =>
    [false, true].flatMap((big) =>
      [2, 3, MAX_ZONES].map((zones) => ({
        cols,
        rows,
        header,
        big,
        zones,
        needs: stack(zones, big, rows >= 3),
        avail: tileBodyHeight(rows, { header }),
      }))
    )
  )
);

const where = (c) =>
  `${c.cols}x${c.rows} header:${c.header ? "y" : "n"} ${c.big ? "large" : "regular"} ${
    c.zones
  } cities (needs ${c.needs}, has ${c.avail})`;

describe("world clock rows", () => {
  it("covers every size, both text sizes and every city count", () => {
    expect(CASES).toHaveLength(manifest.sizes.length * 2 * 2 * 3);
  });

  it("fits without scrolling at the regular size, everywhere", () => {
    // This is the claim the widget-side copy of the geometry got wrong. Four
    // cities in the shortest tile need 130px and have 146.
    for (const c of CASES.filter((x) => !x.big)) {
      expect(c.needs, where(c)).toBeLessThanOrEqual(c.avail);
    }
  });

  it("needs to scroll only for a full house at the large size in a short tile", () => {
    const overflowing = CASES.filter((c) => c.needs > c.avail);
    // If this set ever empties the scroller can go; if it grows, something got
    // taller without anyone noticing.
    expect(overflowing.map(where)).toEqual([
      "3x2 header:y large 4 cities (needs 154, has 146)",
      "4x2 header:y large 4 cities (needs 154, has 146)",
    ]);
  });

  it("gives large text more room than regular, at every tile height", () => {
    for (const rows of [2, 3]) {
      expect(rowHeight(true, rows >= 3)).toBeGreaterThan(rowHeight(false, rows >= 3));
    }
  });
});
