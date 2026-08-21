import { describe, expect, it } from "vitest";
import { arcPoint, deltaLabel, lengthLabel, rgb, skyAt } from "./sky";

describe("skyAt", () => {
  it("is dark at night and bright at noon", () => {
    const night = skyAt(-20);
    const noon = skyAt(60);
    const brightness = (c) => c.top[0] + c.top[1] + c.top[2];
    expect(brightness(night)).toBeLessThan(brightness(noon));
  });

  it("moves continuously, so dawn is not a step change", () => {
    // Two altitudes a degree apart must not jump: a step would read as the sky
    // switching between presets on each redraw.
    const a = skyAt(-1);
    const b = skyAt(0);
    for (let i = 0; i < 3; i += 1) {
      expect(Math.abs(a.top[i] - b.top[i])).toBeLessThan(40);
    }
  });

  it("clamps rather than running off either end of the scale", () => {
    expect(skyAt(-90)).toEqual(skyAt(-18));
    expect(skyAt(200)).toEqual(skyAt(60));
  });

  it("is warmest at the horizon, which is what sunset looks like", () => {
    const horizon = skyAt(0);
    const high = skyAt(60);
    // More red than blue at the horizon; the other way up high.
    expect(horizon.bottom[0] - horizon.bottom[2]).toBeGreaterThan(0);
    expect(high.bottom[0] - high.bottom[2]).toBeLessThan(0);
  });

  it("gives three usable colours", () => {
    const sky = skyAt(10);
    for (const key of ["top", "bottom", "glow"]) {
      expect(sky[key]).toHaveLength(3);
      for (const channel of sky[key]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe("rgb", () => {
  it("writes a css colour", () => {
    expect(rgb([1, 2, 3])).toBe("rgb(1, 2, 3)");
  });
});

describe("arcPoint", () => {
  const box = { width: 300, height: 96 };

  it("starts and ends on the horizon", () => {
    expect(arcPoint(0, box).y).toBeCloseTo(box.height, 5);
    expect(arcPoint(1, box).y).toBeCloseTo(box.height, 5);
  });

  it("travels left to right", () => {
    expect(arcPoint(0, box).x).toBeLessThan(arcPoint(0.5, box).x);
    expect(arcPoint(0.5, box).x).toBeLessThan(arcPoint(1, box).x);
  });

  it("peaks in the middle", () => {
    expect(arcPoint(0.5, box).y).toBeLessThan(arcPoint(0.25, box).y);
    expect(arcPoint(0.5, box).x).toBeCloseTo(box.width / 2, 5);
  });

  it("clamps outside the day rather than flying off the tile", () => {
    expect(arcPoint(-3, box)).toEqual(arcPoint(0, box));
    expect(arcPoint(9, box)).toEqual(arcPoint(1, box));
  });
});

describe("lengthLabel", () => {
  it("reads as hours and minutes", () => {
    expect(lengthLabel(14 * 3600 + 35 * 60)).toBe("14h 35m");
    expect(lengthLabel(9 * 3600 + 5 * 60)).toBe("9h 05m");
  });

  it("has something to say with nothing to report", () => {
    expect(lengthLabel(null)).toBe("—");
  });
});

describe("deltaLabel", () => {
  it("says which way, and keeps the seconds", () => {
    // Near a solstice the change is under a minute; rounding to minutes would
    // leave this reading "the same as yesterday" for a fortnight.
    expect(deltaLabel(42)).toBe("+42s on yesterday");
    expect(deltaLabel(-42)).toBe("−42s on yesterday");
  });

  it("uses minutes once there are some", () => {
    expect(deltaLabel(134)).toBe("+2m 14s on yesterday");
  });

  it("is empty with nothing to compare", () => {
    expect(deltaLabel(null)).toBe("");
  });
});

describe("deltaLabel, short", () => {
  it("drops the trailing words where the row already implies them", () => {
    expect(deltaLabel(134, true)).toBe("+2m 14s");
    expect(deltaLabel(-42, true)).toBe("−42s");
  });
});
