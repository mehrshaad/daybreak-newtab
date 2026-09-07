import { describe, expect, it } from "vitest";
import { layoutFor } from "./layout";

describe("layoutFor", () => {
  it("cuts the strip down for a two-column tile", () => {
    // Five hours of mono needs about 190px before its gaps and two columns is
    // about 210px of usable width, so at five it wrapped to a second line and
    // pushed itself out of a two-row tile.
    const v = layoutFor([2, 2]);
    expect(v.narrow).toBe(true);
    expect(v.hours).toBe(3);
    expect(v.details).toBe(false);
    expect(v.hourIcons).toBe(false);
  });

  it("keeps a narrow tile narrow even when it is tall", () => {
    // 2x3 exists for other widgets and could arrive here from a stored size.
    // Height does not buy width, so the detail grid still cannot fit.
    expect(layoutFor([2, 3]).details).toBe(false);
    expect(layoutFor([2, 3]).hourIcons).toBe(false);
  });

  it("keeps the baseline 3x2 to the essentials", () => {
    const v = layoutFor([3, 2]);
    expect(v).toMatchObject({
      tall: false,
      stats: false,
      details: false,
      hourIcons: false,
    });
    expect(v.hours).toBe(5);
  });

  it("spends extra width on the high/low/feels line", () => {
    expect(layoutFor([4, 2]).stats).toBe(true);
    expect(layoutFor([4, 2]).details).toBe(false);
  });

  it("spends extra height on a labelled grid, per-hour icons and more hours", () => {
    const v = layoutFor([4, 3]);
    expect(v).toMatchObject({ tall: true, details: true, hourIcons: true });
    expect(v.hours).toBe(6);
  });

  // The widget shows the one-line version only when stats is on and details is
  // off, so a size that asks for the grid must also ask for the numbers.
  it("asks for the numbers whenever it asks for the grid", () => {
    for (const size of [
      [3, 2],
      [4, 2],
      [4, 3],
      [3, 3],
    ]) {
      const v = layoutFor(size);
      if (v.details) expect(v.stats, String(size)).toBe(true);
    }
  });

  it("falls back to the baseline for a missing size", () => {
    expect(layoutFor(undefined).hours).toBe(5);
  });
});
