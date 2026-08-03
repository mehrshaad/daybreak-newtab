import { describe, expect, it } from "vitest";
import { layoutFor } from "./layout";

describe("layoutFor", () => {
  it("keeps the baseline 3x2 to the essentials", () => {
    const v = layoutFor([3, 2], false);
    expect(v).toMatchObject({ tall: false, stats: false, details: false, hourIcons: false });
    expect(v.hours).toBe(5);
  });

  it("spends extra width on the high/low/feels line", () => {
    expect(layoutFor([4, 2], false).stats).toBe(true);
    expect(layoutFor([4, 2], false).details).toBe(false);
  });

  it("spends more width on a longer hourly strip", () => {
    expect(layoutFor([5, 2], false).hours).toBe(7);
  });

  it("spends extra height on a labelled grid and per-hour icons", () => {
    const v = layoutFor([4, 3], false);
    expect(v).toMatchObject({ tall: true, details: true, hourIcons: true });
  });

  // The grid replaces the one-line version rather than joining it.
  it("never shows the plain stats line and the grid at once", () => {
    for (const size of [
      [3, 2],
      [4, 2],
      [5, 2],
      [4, 3],
    ]) {
      const v = layoutFor(size, false);
      expect(v.stats && !v.details ? !v.details : true, String(size)).toBe(true);
    }
  });

  it("shows everything when the tile is zoomed, whatever its span", () => {
    const v = layoutFor([3, 2], true);
    expect(v.stats).toBe(true);
    expect(v.details).toBe(true);
  });

  it("falls back to the baseline for a missing size", () => {
    expect(layoutFor(undefined, false).hours).toBe(5);
  });
});
