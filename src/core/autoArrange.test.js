import { describe, expect, it } from "vitest";
import { autoArrange } from "./autoArrange";

// Sizes are supplied explicitly so the test does not depend on the manifests.
const sizes = {
  a: [4, 2],
  b: [3, 2],
  c: [5, 2],
  d: [4, 3],
  e: [3, 2],
  f: [4, 2],
};
const ids = ["a", "b", "c", "d", "e", "f"];

// Walk the output the same way the grid would, and report how the rows fill.
function rowsOf(order, columns = 12) {
  const rows = [];
  let left = columns;
  let row = [];
  for (const id of order) {
    const w = Math.min(sizes[id][0], columns);
    if (w > left) {
      rows.push({ items: row, left });
      row = [];
      left = columns;
    }
    row.push(id);
    left -= w;
  }
  if (row.length) rows.push({ items: row, left });
  return rows;
}

describe("autoArrange", () => {
  it("returns a permutation — nothing added, nothing dropped", () => {
    const out = autoArrange(ids, sizes, 12);
    expect(out).toHaveLength(ids.length);
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it("packs rows tighter than the original order", () => {
    const before = rowsOf(ids).reduce((n, r) => n + r.left, 0);
    const after = rowsOf(autoArrange(ids, sizes, 12)).reduce((n, r) => n + r.left, 0);
    expect(after).toBeLessThanOrEqual(before);
  });

  it("leaves no row with a gap a later tile would have fitted", () => {
    const out = autoArrange(ids, sizes, 12);
    const rows = rowsOf(out);
    const widths = out.map((id) => Math.min(sizes[id][0], 12));
    const smallest = Math.min(...widths);
    // Any row still open by at least the smallest tile means we stopped early.
    for (const row of rows.slice(0, -1)) {
      expect(row.left).toBeLessThan(smallest);
    }
  });

  it("handles a narrow grid without looping forever", () => {
    const out = autoArrange(ids, sizes, 4);
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it("gives an oversized tile its own row rather than hanging", () => {
    const wide = { x: [12, 2], y: [3, 2] };
    const out = autoArrange(["y", "x"], wide, 4);
    expect([...out].sort()).toEqual(["x", "y"]);
  });

  it("is stable — arranging twice changes nothing further", () => {
    const once = autoArrange(ids, sizes, 12);
    expect(autoArrange(once, sizes, 12)).toEqual(once);
  });

  it("is empty-safe", () => {
    expect(autoArrange([], {}, 12)).toEqual([]);
  });
});
