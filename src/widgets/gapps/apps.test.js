import { describe, expect, it } from "vitest";
import { brandFor } from "../../core/brands";
import { APPS, gridFor, orderedApps } from "./apps";

describe("APPS", () => {
  // The whole point of the curated list: no app ships with a borrowed or
  // generic icon. If an entry has no brand entry, it must not be in the list.
  it("every app resolves to a real brand mark", () => {
    const missing = APPS.filter((a) => !brandFor(a.key)).map((a) => a.key);
    expect(missing).toEqual([]);
  });

  it("has unique keys and https urls", () => {
    expect(new Set(APPS.map((a) => a.key)).size).toBe(APPS.length);
    for (const a of APPS) expect(a.url.startsWith("https://")).toBe(true);
  });

  it("excludes the apps with no authentic mark", () => {
    const keys = APPS.map((a) => a.key);
    for (const gone of ["contacts", "books", "playgames", "passwords", "drawing", "jamboard"]) {
      expect(keys).not.toContain(gone);
    }
  });
});

describe("orderedApps", () => {
  it("falls back to the default order", () => {
    expect(orderedApps(null)).toBe(APPS);
    expect(orderedApps([])).toBe(APPS);
  });

  it("honours a stored order", () => {
    const out = orderedApps(["maps", "gmail"]);
    expect(out[0].key).toBe("maps");
    expect(out[1].key).toBe("gmail");
  });

  // A stored order from an older release must not hide newly added apps.
  it("appends apps missing from the stored order", () => {
    const out = orderedApps(["maps"]);
    expect(out).toHaveLength(APPS.length);
    expect(out[0].key).toBe("maps");
  });

  it("drops keys that no longer exist", () => {
    const out = orderedApps(["jamboard", "gmail"]);
    expect(out.map((a) => a.key)).not.toContain("jamboard");
    expect(out[0].key).toBe("gmail");
    expect(out).toHaveLength(APPS.length);
  });
});

describe("gridFor", () => {
  it("grows the grid with the tile", () => {
    expect(gridFor([4, 2]).cols).toBeLessThan(gridFor([5, 2]).cols);
  });

  it("adds rows for a taller tile", () => {
    expect(gridFor([4, 2]).rows).toBeLessThan(gridFor([4, 3]).rows);
    expect(gridFor([4, 3]).rows).toBeLessThan(gridFor([4, 4]).rows);
  });

  // The point of offering Google Apps large sizes: a bigger tile must actually
  // show meaningfully more icons, not just more padding.
  it("a large tile holds far more icons than a small one", () => {
    const small = gridFor([3, 2]);
    const large = gridFor([6, 4]);
    expect(large.cols * large.rows).toBeGreaterThan(small.cols * small.rows * 2);
  });

  it("never asks for more columns than the board has", () => {
    expect(gridFor([5, 2], 4).cols).toBeLessThanOrEqual(4);
  });

  it("always leaves room for at least three columns and two rows", () => {
    expect(gridFor([1, 1]).cols).toBeGreaterThanOrEqual(3);
    expect(gridFor([1, 1]).rows).toBeGreaterThanOrEqual(2);
  });

  it("caps rows so an absurd height cannot explode the grid", () => {
    expect(gridFor([6, 40]).rows).toBeLessThanOrEqual(5);
  });
});
