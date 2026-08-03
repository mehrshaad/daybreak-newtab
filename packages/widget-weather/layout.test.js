import { describe, expect, it } from "vitest";
import { layoutFor } from "./layout";

describe("layoutFor", () => {
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
