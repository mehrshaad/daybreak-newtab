import { describe, expect, it } from "vitest";
import { isOutsideBounds, moveItem, pointInRect, slotIndexAt } from "./usePointerReorder";

// A row of four 100x100 slots, 10px apart.
const slots = [0, 1, 2, 3].map((i) => ({
  left: i * 110,
  right: i * 110 + 100,
  top: 0,
  bottom: 100,
}));

describe("pointInRect", () => {
  it("includes the edges and excludes outside", () => {
    const r = { left: 10, right: 20, top: 10, bottom: 20 };
    expect(pointInRect(r, 15, 15)).toBe(true);
    expect(pointInRect(r, 10, 10)).toBe(true);
    expect(pointInRect(r, 20, 20)).toBe(true);
    expect(pointInRect(r, 9, 15)).toBe(false);
    expect(pointInRect(r, 15, 21)).toBe(false);
  });

  it("is false for a missing rect", () => {
    expect(pointInRect(null, 0, 0)).toBe(false);
  });
});

describe("slotIndexAt", () => {
  it("resolves the slot under the pointer", () => {
    expect(slotIndexAt(slots, 50, 50)).toBe(0);
    expect(slotIndexAt(slots, 160, 50)).toBe(1);
    expect(slotIndexAt(slots, 380, 50)).toBe(3);
  });

  it("returns -1 in the gaps and outside the row", () => {
    expect(slotIndexAt(slots, 105, 50)).toBe(-1);
    expect(slotIndexAt(slots, 50, 200)).toBe(-1);
    expect(slotIndexAt(slots, -5, 50)).toBe(-1);
  });

  it("is empty-safe", () => {
    expect(slotIndexAt([], 50, 50)).toBe(-1);
  });

  // The bug this replaced: hit-testing live elements fed back on itself, so one
  // gesture kept swapping and walked the item to the end of the list. Slot
  // geometry is fixed, so holding still over a slot resolves to that slot every
  // time and a drag lands exactly where it was dropped.
  it("is stable while the pointer holds still", () => {
    const results = Array.from({ length: 10 }, () => slotIndexAt(slots, 235, 40));
    expect(new Set(results)).toEqual(new Set([2]));
  });

  it("a drag across the row visits each slot exactly once, in order", () => {
    const visited = [];
    for (let x = 0; x <= 400; x += 5) {
      const i = slotIndexAt(slots, x, 50);
      if (i !== -1 && visited[visited.length - 1] !== i) visited.push(i);
    }
    expect(visited).toEqual([0, 1, 2, 3]);
  });
});

describe("isOutsideBounds", () => {
  const rect = { left: 0, right: 100, top: 0, bottom: 100 };

  it("is false inside the rect", () => {
    expect(isOutsideBounds(rect, 50, 50)).toBe(false);
  });

  it("is false within the grace margin past an edge", () => {
    expect(isOutsideBounds(rect, 110, 50)).toBe(false);
    expect(isOutsideBounds(rect, -10, 50)).toBe(false);
    expect(isOutsideBounds(rect, 50, -20)).toBe(false);
  });

  it("is true once past the grace margin", () => {
    expect(isOutsideBounds(rect, 130, 50)).toBe(true);
    expect(isOutsideBounds(rect, -30, 50)).toBe(true);
    expect(isOutsideBounds(rect, 50, 130)).toBe(true);
  });

  it("respects a custom margin", () => {
    expect(isOutsideBounds(rect, 105, 50, 0)).toBe(true);
    expect(isOutsideBounds(rect, 105, 50, 10)).toBe(false);
  });

  it("is false for a missing rect", () => {
    expect(isOutsideBounds(null, 9999, 9999)).toBe(false);
  });
});

describe("moveItem", () => {
  const base = ["a", "b", "c", "d"];

  it("moves forward", () => {
    expect(moveItem(base, 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves backward", () => {
    expect(moveItem(base, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("is a no-op onto itself", () => {
    expect(moveItem(base, 1, 1)).toEqual(base);
  });

  it("does not mutate the input", () => {
    const copy = [...base];
    moveItem(base, 0, 3);
    expect(base).toEqual(copy);
  });

  it("handles adjacent swaps in both directions", () => {
    expect(moveItem(base, 1, 2)).toEqual(["a", "c", "b", "d"]);
    expect(moveItem(base, 2, 1)).toEqual(["a", "c", "b", "d"]);
  });

  it("preserves length and membership for every pair", () => {
    for (let from = 0; from < base.length; from += 1) {
      for (let to = 0; to < base.length; to += 1) {
        const out = moveItem(base, from, to);
        expect(out).toHaveLength(base.length);
        expect([...out].sort()).toEqual([...base].sort());
      }
    }
  });
});
