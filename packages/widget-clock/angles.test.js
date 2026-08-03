import { describe, expect, it } from "vitest";
import { handAngles, handPoint } from "./angles";

const at = (h, m, s = 0, ms = 0) => new Date(2026, 0, 5, h, m, s, ms);

describe("handAngles", () => {
  it("points every hand at twelve at midnight", () => {
    expect(handAngles(at(0, 0))).toEqual({ hour: 0, minute: 0, second: 0 });
  });

  it("puts three o'clock on the right and six at the bottom", () => {
    expect(handAngles(at(3, 0)).hour).toBe(90);
    expect(handAngles(at(6, 0)).hour).toBe(180);
    expect(handAngles(at(9, 0)).hour).toBe(270);
  });

  it("wraps the afternoon onto the same twelve hours", () => {
    expect(handAngles(at(15, 0)).hour).toBe(handAngles(at(3, 0)).hour);
  });

  it("creeps the hour hand with the minutes", () => {
    // Half past three is halfway between the 3 and the 4, not on the 3.
    expect(handAngles(at(3, 30)).hour).toBe(105);
    expect(handAngles(at(3, 30)).minute).toBe(180);
  });

  it("creeps the minute hand with the seconds", () => {
    expect(handAngles(at(1, 0, 30)).minute).toBe(3);
    expect(handAngles(at(1, 0, 30)).second).toBe(180);
  });

  it("sweeps the second hand between ticks", () => {
    expect(handAngles(at(1, 0, 0, 500)).second).toBe(3);
  });
});

describe("handPoint", () => {
  it("sends zero degrees straight up", () => {
    const p = handPoint(0, 30);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(20);
  });

  it("sends ninety degrees to the right", () => {
    const p = handPoint(90, 30);
    expect(p.x).toBeCloseTo(80);
    expect(p.y).toBeCloseTo(50);
  });

  it("keeps the hand on its own circle", () => {
    for (const deg of [0, 37, 90, 180, 275, 359]) {
      const p = handPoint(deg, 40);
      expect(Math.hypot(p.x - 50, p.y - 50)).toBeCloseTo(40);
    }
  });
});
