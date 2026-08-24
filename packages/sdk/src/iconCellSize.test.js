import { describe, expect, it } from "vitest";
import { ICON_STEPS, iconCellSize, iconGridSize } from "./iconCellSize";

describe("iconGridSize", () => {
  it("does not shrink when the tile gets wider", () => {
    // The bug this replaced: 150 / columnSpan, so a 5-wide tile drew smaller
    // icons than a 3-wide one and growing the widget shrank its contents.
    const widths = [2, 3, 4, 5, 6, 8, 12];
    const sizes = widths.map((w) => iconGridSize([w, 2]));
    expect(new Set(sizes).size, "width must not affect icon size").toBe(1);
  });

  it("grows with the tile's height, which is what actually constrains it", () => {
    expect(iconGridSize([4, 3])).toBeGreaterThan(iconGridSize([4, 2]));
    expect(iconGridSize([4, 4])).toBeGreaterThan(iconGridSize([4, 3]));
  });

  it("gives the icon the label's space when labels are off", () => {
    expect(iconGridSize([4, 2], { hideLabels: true })).toBeGreaterThan(iconGridSize([4, 2]));
  });

  it("has a sane default with no size at all", () => {
    expect(iconGridSize(undefined)).toBeGreaterThan(20);
    expect(iconGridSize(undefined)).toBeLessThan(60);
  });

  it("keeps a labelled cell inside a two-column tile", () => {
    // A 2-column tile is about 230px wide inside its padding; three cells of
    // this width have to fit or the grid drops to one per row and looks broken.
    const cell = iconCellSize(iconGridSize([2, 2]), true);
    expect(cell.width * 3).toBeLessThan(230);
  });

  // Whether a cell fits a real tile is checked against the board's actual
  // geometry in src/core/iconGridFit.test.js, which can import both. The two
  // tests that used to live here guessed at it — "roughly 132px of content
  // height" against a real 122 — and asserted two labelled rows fit a two-row
  // tile, which was never true at any icon size.

  it("grows with every step, and M is the size that was there before", () => {
    for (const size of [[4, 2], [4, 3], [5, 4]]) {
      const [s, m, l] = ICON_STEPS.map((step) => iconGridSize(size, { step }));
      expect(s, JSON.stringify(size)).toBeLessThan(m);
      expect(m, JSON.stringify(size)).toBeLessThan(l);
      // No step and the middle step are the same thing.
      expect(iconGridSize(size)).toBe(m);
      expect(iconGridSize(size, { step: "nonsense" })).toBe(m);
    }
  });

  it("keeps the caption a caption, however big the icon gets", () => {
    // Requested directly: the icons grow, the labels under them do not.
    const sizes = [30, 42, 62, 99, 140].map((n) => iconCellSize(n, true).fontSize);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(11);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(9);
  });

  it("spends the caption's row on the icon when there is no caption", () => {
    for (const size of [[4, 2], [5, 4]]) {
      expect(iconGridSize(size, { hideLabels: true })).toBeGreaterThan(iconGridSize(size));
    }
  });

  it("hands out one set of measurements rather than four copies of the sums", () => {
    // IconGrid, the Add cell in Quick Links and the "+N more" count in Google
    // Apps all used to recompute these by hand, and the comment here promised
    // they "mirror IconGridItem exactly" — a promise kept in four places.
    const cell = iconCellSize(42, true);
    for (const key of ["width", "height", "pad", "labelGap", "fontSize", "gap"]) {
      expect(cell[key], key).toBeGreaterThan(0);
    }
    expect(cell.height).toBe(
      2 * cell.pad + 42 + cell.labelGap + Math.ceil(cell.fontSize * 1.3)
    );
  });
});
