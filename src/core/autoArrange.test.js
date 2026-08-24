import { describe, expect, it } from "vitest";
import { autoArrange, usedColumns } from "./autoArrange";
import { getWidget, resolveSize } from "../widgets/registry";

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

describe("usedColumns", () => {
  // No reference implementation here on purpose. The first version of this test
  // walked the widths first-fit and compared — which is exactly the model that
  // turned out to be wrong, so it agreed with the bug. The browser uses
  // `grid-auto-flow: row dense`, a two-dimensional placement that backfills
  // holes, and on the board that prompted this the first-fit walk said twelve
  // while the rendered layout only ever reached eleven.
  //
  // So these are properties and hand-checked cases instead, with the live board
  // pinned against what Chrome actually laid out.

  const BOARDS = [
    ["clock", "weather", "worldclocks", "links", "scratchpad", "tasks", "quote", "timer"],
    ["clock", "weather"],
    ["habits", "gapps", "quote"],
    ["calendar", "news", "crypto", "currency", "sun", "moon"],
    [],
  ];

  it("matches what Chrome actually laid out for the board this came from", () => {
    // Measured in the running app: every row left 131px empty on the right,
    // which at a 117px track plus a 14px gap is exactly one unused column.
    const ids = [
      "clock",
      "weather",
      "worldclocks",
      "links",
      "scratchpad",
      "tasks",
      "quote",
      "timer",
      "habits",
      "gapps",
    ];
    const sizes = {
      clock: [2, 2],
      timer: [2, 2],
      worldclocks: [3, 2],
      tasks: [4, 2],
      scratchpad: [3, 2],
    };
    expect(usedColumns(ids, sizes, 12)).toBe(11);
  });

  it("fills the grid when the tiles do", () => {
    // Three four-wide tiles are twelve across however they are placed. The
    // sizes have to be ones each widget actually declares — resolveSize clamps
    // to its manifest, and asking for a four-wide clock quietly gets you three.
    const ids = ["weather", "worldclocks", "habits"];
    const sizes = { weather: [4, 2], worldclocks: [4, 2], habits: [4, 2] };
    expect(usedColumns(ids, sizes, 12)).toBe(12);
  });

  it("is the width of a lone tile, not of the grid", () => {
    expect(usedColumns(["clock"], { clock: [3, 2] }, 12)).toBe(3);
  });

  it("places into the earliest slot in row-major order, not the tidiest one", () => {
    // habits takes columns 0-3 for three rows and weather 4-7 for two, leaving
    // a gap under weather. The clock does not go in it: dense scans row by row
    // and column 8 on the first row comes before column 4 on the third, so the
    // board reaches eleven. I expected eight here and the implementation was
    // right — worth keeping, because a "tidier" placement would be a bug.
    const ids = ["habits", "weather", "clock"];
    const sizes = { habits: [4, 3], weather: [4, 2], clock: [3, 2] };
    expect(usedColumns(ids, sizes, 12)).toBe(11);
  });

  it("does use a hole once the rows above are full", () => {
    // Same idea with the first two rows filled across: now the only free space
    // is under habits, so the clock goes there and the board stays at twelve
    // rather than growing a thirteenth column it does not have.
    const ids = ["habits", "weather", "worldclocks", "clock"];
    const sizes = {
      habits: [4, 3],
      weather: [4, 2],
      worldclocks: [4, 2],
      clock: [3, 2],
    };
    expect(usedColumns(ids, sizes, 12)).toBe(12);
  });

  it("never exceeds the grid and is never below one", () => {
    for (const ids of BOARDS) {
      for (const columns of [4, 8, 12]) {
        const used = usedColumns(ids, {}, columns);
        expect(used, `${ids.length} @ ${columns}`).toBeGreaterThanOrEqual(1);
        expect(used, `${ids.length} @ ${columns}`).toBeLessThanOrEqual(columns);
      }
    }
  });

  it("is at least as wide as the widest single tile, so nothing is clipped", () => {
    // The property that makes narrowing the grid safe.
    for (const ids of BOARDS) {
      const widestTile = Math.max(
        0,
        ...ids.filter(getWidget).map((id) => Math.min(resolveSize(id, {})[0], 12))
      );
      expect(usedColumns(ids, {}, 12)).toBeGreaterThanOrEqual(widestTile);
    }
  });

  it("ignores an id that is not a widget, as the board does", () => {
    expect(usedColumns([], {}, 12)).toBe(1);
    expect(usedColumns(["nope#9"], {}, 12)).toBe(1);
    const real = usedColumns(["clock", "weather"], {}, 12);
    expect(usedColumns(["clock", "nope#9", "weather"], {}, 12)).toBe(real);
  });
});
