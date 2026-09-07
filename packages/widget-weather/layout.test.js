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
      summary: false,
      details: false,
      hourIcons: false,
    });
    expect(v.hours).toBe(5);
  });

  it("spends extra width on the high/low/feels line", () => {
    // `summary` is that line. `stats` is the extras row (rain, wind, humidity,
    // UV) and is a different thing entirely — it was renamed when the extras
    // arrived, because one name for both is how a layout ends up showing the
    // wrong one.
    expect(layoutFor([4, 2]).summary).toBe(true);
    expect(layoutFor([4, 2]).details).toBe(false);
  });

  it("spends extra height on a labelled grid, per-hour icons and more hours", () => {
    const v = layoutFor([4, 3]);
    expect(v).toMatchObject({ tall: true, details: true, hourIcons: true });
    expect(v.hours).toBe(6);
  });

  // The widget shows the one-line version only when summary is on and details
  // is off, so a size that asks for the grid must also ask for the numbers.
  it("asks for the numbers whenever it asks for the grid", () => {
    for (const size of [
      [3, 2],
      [4, 2],
      [4, 3],
      [3, 3],
    ]) {
      const v = layoutFor(size);
      if (v.details) expect(v.summary, String(size)).toBe(true);
    }
  });

  describe("the room the extras need", () => {
    it("gives the day-by-day strip only a tall tile", () => {
      // Seven columns of icon and two temperatures need the height. Asking for
      // it on a short tile falls back to the hours rather than showing an
      // empty band — the setting is not wrong, the tile is small.
      const short = layoutFor([4, 2], { forecast: "daily" });
      expect(short.daily).toBe(false);
      expect(short.hourly).toBe(true);
      expect(layoutFor([4, 3], { forecast: "daily" }).daily).toBe(true);
    });

    it("never shows both strips at once", () => {
      // The reason this is an enum and not two switches: they are the same
      // band, and drawing both filled the tile edge to edge with numbers.
      for (const size of [
        [3, 2],
        [4, 2],
        [4, 3],
        [6, 3],
        [2, 2],
      ]) {
        for (const forecast of ["hourly", "daily", "none"]) {
          const v = layoutFor(size, { forecast });
          expect(v.daily && v.hourly, `${size} ${forecast}`).toBe(false);
        }
      }
    });

    it("shows the labelled grid or the day strip, never both", () => {
      // They occupy the same band, and a 4x3 has the height for one of them.
      const v = layoutFor([4, 3], { forecast: "daily" });
      expect(v.daily).toBe(true);
      expect(v.details).toBe(false);
    });

    it("keeps the extras row off a two-column tile", () => {
      expect(layoutFor([2, 2], { stats: true }).stats).toBe(false);
      expect(layoutFor([4, 2], { stats: true }).stats).toBe(true);
    });

    it("only widens to seven days where there is width for seven", () => {
      expect(layoutFor([4, 3], { forecast: "daily" }).days).toBe(5);
      expect(layoutFor([6, 3], { forecast: "daily" }).days).toBe(7);
    });

    it("lets both strips be turned off", () => {
      const none = layoutFor([4, 3], { forecast: "none" });
      expect(none.hourly).toBe(false);
      expect(none.daily).toBe(false);
      // And defaults to the hours for a caller that says nothing, which is
      // what the widget showed before any of this was configurable.
      expect(layoutFor([4, 3]).hourly).toBe(true);
    });
  });

  it("falls back to the baseline for a missing size", () => {
    expect(layoutFor(undefined).hours).toBe(5);
  });
});
