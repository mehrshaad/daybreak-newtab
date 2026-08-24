import { describe, expect, it } from "vitest";
import { edgeRadius, HALF, squirclePath } from "./squircle";

describe("edgeRadius", () => {
  it("is exactly the half-width on the four flats", () => {
    for (const deg of [0, 90, 180, 270]) {
      expect(edgeRadius(deg), `${deg}`).toBeCloseTo(HALF, 6);
    }
  });

  it("reaches further at the corners, which is the point of the shape", () => {
    // If this were a circle every bearing would give the same radius and the
    // face would just be a round one with a different outline.
    expect(edgeRadius(45)).toBeGreaterThan(HALF);
    expect(edgeRadius(45)).toBeCloseTo(edgeRadius(135), 6);
    expect(edgeRadius(45)).toBeCloseTo(edgeRadius(225), 6);
  });

  it("keeps the whole outline inside the viewBox once the stroke is on", () => {
    // The corner *radius* is larger than the half-width — 57.2 against 47 —
    // which is what a superellipse does; what has to stay bounded is its x and
    // y, not its radius. Centre 50, 1.4 stroke, so 49.3 of reach either way.
    let worst = 0;
    for (let deg = 0; deg < 360; deg += 1) {
      const radians = ((deg - 90) * Math.PI) / 180;
      const r = edgeRadius(deg);
      worst = Math.max(worst, Math.abs(Math.cos(radians) * r), Math.abs(Math.sin(radians) * r));
    }
    expect(worst).toBeLessThan(49.3);
  });

  it("is symmetric across all four quadrants", () => {
    for (const deg of [17, 38, 61, 84]) {
      expect(edgeRadius(deg)).toBeCloseTo(edgeRadius(180 - deg), 6);
      expect(edgeRadius(deg)).toBeCloseTo(edgeRadius(360 - deg), 6);
    }
  });

  it("grows monotonically from a flat to the nearest corner", () => {
    let previous = edgeRadius(0);
    for (let deg = 5; deg <= 45; deg += 5) {
      const next = edgeRadius(deg);
      expect(next, `${deg}`).toBeGreaterThanOrEqual(previous);
      previous = next;
    }
  });
});

describe("squirclePath", () => {
  it("is a closed path of usable numbers", () => {
    const d = squirclePath(1);
    expect(d.startsWith("M")).toBe(true);
    expect(d.trim().endsWith("Z")).toBe(true);
    expect(d).not.toContain("NaN");
  });

  it("scales inward without changing shape", () => {
    // The inner hairline is the same outline at 96.5%, so every sampled point
    // must be nearer the centre than its counterpart.
    const outer = squirclePath(1).match(/-?\d+\.\d+/g).map(Number);
    const inner = squirclePath(0.965).match(/-?\d+\.\d+/g).map(Number);
    expect(inner).toHaveLength(outer.length);
    for (let i = 0; i < outer.length; i += 1) {
      expect(Math.abs(inner[i] - 50)).toBeLessThanOrEqual(Math.abs(outer[i] - 50) + 1e-9);
    }
  });
});
