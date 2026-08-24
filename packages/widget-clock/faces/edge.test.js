import { describe, expect, it } from "vitest";
import { edgeMarker, edgePoint } from "./edge";

describe("edgePoint", () => {
  it("puts twelve and six on the horizontal edges", () => {
    // Close, not exact: cos(-90 degrees) comes back as 3e-15 rather than zero.
    const twelve = edgePoint(0, 100, 50);
    expect(twelve.x).toBeCloseTo(0, 6);
    expect(twelve.y).toBeCloseTo(-50, 6);
    const six = edgePoint(180, 100, 50);
    expect(six.x).toBeCloseTo(0, 6);
    expect(six.y).toBeCloseTo(50, 6);
  });

  it("puts three and nine on the vertical edges", () => {
    const three = edgePoint(90, 100, 50);
    expect(three.x).toBeCloseTo(100, 6);
    expect(three.y).toBeCloseTo(0, 6);
    const nine = edgePoint(270, 100, 50);
    expect(nine.x).toBeCloseTo(-100, 6);
  });

  it("lands on the rectangle for every hour, never inside or outside it", () => {
    // The property that matters: a marker must touch the edge exactly. Inside
    // and it floats; outside and it is clipped.
    for (const [a, b] of [[100, 50], [50, 100], [80, 80], [120, 31]]) {
      for (let hour = 0; hour < 12; hour += 1) {
        const p = edgePoint(hour * 30, a, b);
        const onEdge =
          Math.abs(Math.abs(p.x) - a) < 1e-6 || Math.abs(Math.abs(p.y) - b) < 1e-6;
        expect(onEdge, `${hour} at ${a}x${b}`).toBe(true);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(a + 1e-6);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(b + 1e-6);
      }
    }
  });

  it("reaches further at the corners than on the flats, which is the point", () => {
    // On a square, one o'clock is further from the centre than twelve. That
    // changing radius is what makes a rectangular dial read as one.
    const twelve = edgePoint(0, 80, 80).distance;
    const oneish = edgePoint(30, 80, 80).distance;
    expect(oneish).toBeGreaterThan(twelve);
  });

  it("is symmetric about both axes", () => {
    const right = edgePoint(60, 90, 40);
    const left = edgePoint(300, 90, 40);
    expect(left.x).toBeCloseTo(-right.x, 6);
    expect(left.y).toBeCloseTo(right.y, 6);
  });
});

describe("edgeMarker", () => {
  it("runs inward from the edge by the length given", () => {
    const m = edgeMarker(0, 100, 50, 10);
    expect(m.x2).toBeCloseTo(0, 6);
    expect(m.y2).toBeCloseTo(-50, 6);
    expect(m.y1).toBeCloseTo(-40, 6);
  });

  it("keeps its length whatever the angle", () => {
    for (let hour = 0; hour < 12; hour += 1) {
      const m = edgeMarker(hour * 30, 90, 60, 8);
      const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
      expect(len, String(hour)).toBeCloseTo(8, 6);
    }
  });

  it("does not invert when asked for a marker longer than the radius", () => {
    // A tile smaller than the marker length would otherwise draw a line from
    // the edge back out through the opposite side. It collapses to the centre.
    const m = edgeMarker(0, 5, 5, 40);
    expect(Math.hypot(m.x1, m.y1)).toBeLessThanOrEqual(Math.hypot(m.x2, m.y2) + 1e-6);
    expect(m.x1).toBeCloseTo(0, 6);
    expect(m.y1).toBeCloseTo(0, 6);
  });
});
