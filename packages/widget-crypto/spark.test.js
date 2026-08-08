import { describe, expect, it } from "vitest";
import { sparkPath } from "./spark";

const toPoints = (str) => str.split(" ").map((p) => p.split(",").map(Number));

describe("sparkPath", () => {
  it("is empty for fewer than two points", () => {
    expect(sparkPath([], 64, 20)).toBe("");
    expect(sparkPath([1], 64, 20)).toBe("");
    expect(sparkPath(null, 64, 20)).toBe("");
  });

  it("spans the full width, first point at 0 and last at w", () => {
    const points = toPoints(sparkPath([1, 2, 3, 4, 5], 64, 20));
    expect(points[0][0]).toBe(0);
    expect(points[points.length - 1][0]).toBe(64);
  });

  it("puts the lowest value at the bottom and the highest at the top", () => {
    const points = toPoints(sparkPath([10, 30, 20], 64, 20));
    const ys = points.map(([, y]) => y);
    // SVG y grows downward, so the low value (first) sits at y=h and the
    // high value (middle) sits at y=0.
    expect(ys[0]).toBe(20);
    expect(ys[1]).toBe(0);
  });

  it("centers a flat series instead of dividing by zero", () => {
    const points = toPoints(sparkPath([5, 5, 5, 5], 64, 20));
    for (const [, y] of points) expect(y).toBe(10);
  });

  it("downsamples a long series to a fixed point count", () => {
    const long = Array.from({ length: 168 }, (_, i) => i);
    const points = toPoints(sparkPath(long, 64, 20));
    expect(points.length).toBe(24);
  });

  it("keeps a short series intact rather than padding it", () => {
    const points = toPoints(sparkPath([1, 2, 3], 64, 20));
    expect(points.length).toBe(3);
  });

  it("never produces NaN or negative coordinates", () => {
    const points = toPoints(sparkPath([3, 1, 4, 1, 5, 9, 2, 6], 64, 20));
    for (const [x, y] of points) {
      expect(Number.isNaN(x)).toBe(false);
      expect(Number.isNaN(y)).toBe(false);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });
});
