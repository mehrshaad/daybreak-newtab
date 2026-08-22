import { describe, expect, it } from "vitest";
import { iconCellSize, iconGridSize } from "./iconCellSize";

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

  it("fits two rows of labelled cells in a two-row tile", () => {
    // Roughly 132px of content height once padding and the label row are gone.
    const cell = iconCellSize(iconGridSize([4, 2]), true);
    expect(cell.height * 2).toBeLessThan(140);
  });

  it("fits three rows in a four-row tile", () => {
    const cell = iconCellSize(iconGridSize([5, 4]), true);
    expect(cell.height * 3).toBeLessThan(400);
  });
});
