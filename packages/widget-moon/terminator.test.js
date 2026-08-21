import { describe, expect, it } from "vitest";
import { isWaxing, litPath, terminatorWidth, whenLabel } from "./terminator";

describe("terminatorWidth", () => {
  it("is a full circle at new and at full", () => {
    // At both ends the shadow edge is the limb itself, so the ellipse is as
    // wide as the disc.
    expect(Math.abs(terminatorWidth(0))).toBeCloseTo(1, 6);
    expect(Math.abs(terminatorWidth(0.5))).toBeCloseTo(1, 6);
  });

  it("is a straight line at both quarters", () => {
    // Half lit: the terminator has no bulge at all.
    expect(terminatorWidth(0.25)).toBeCloseTo(0, 6);
    expect(terminatorWidth(0.75)).toBeCloseTo(0, 6);
  });

  it("changes sign between crescent and gibbous", () => {
    // A crescent's shadow bulges into the lit side; a gibbous one bulges away.
    expect(terminatorWidth(0.12)).toBeGreaterThan(0);
    expect(terminatorWidth(0.38)).toBeLessThan(0);
  });

  it("wraps across the month boundary", () => {
    expect(terminatorWidth(1.25)).toBeCloseTo(terminatorWidth(0.25), 6);
  });
});

describe("isWaxing", () => {
  it("waxes on the way to full and wanes after", () => {
    expect(isWaxing(0.2)).toBe(true);
    expect(isWaxing(0.7)).toBe(false);
  });
});

describe("litPath", () => {
  it("describes a closed shape made of two arcs", () => {
    const d = litPath(0.3, 40);
    expect(d.startsWith("M")).toBe(true);
    expect(d.trim().endsWith("Z")).toBe(true);
    expect(d.match(/A/g)).toHaveLength(2);
  });

  it("flips the limb between waxing and waning", () => {
    // The same illuminated fraction, lit from opposite sides, must not draw the
    // same path — otherwise a waning crescent looks like a waxing one.
    expect(litPath(0.15, 40)).not.toBe(litPath(0.85, 40));
  });

  it("scales with the radius", () => {
    expect(litPath(0.3, 40)).not.toBe(litPath(0.3, 80));
    expect(litPath(0.3, 40)).toContain("40");
  });

  it("gives a straight terminator at the quarter", () => {
    // A zero-width ellipse is the flat edge of a half moon.
    expect(litPath(0.25, 40)).toContain("A 0 40");
  });

  it("produces something drawable for every night of the month", () => {
    for (let i = 0; i <= 40; i += 1) {
      const d = litPath(i / 40, 40);
      expect(d).not.toContain("NaN");
    }
  });
});

describe("whenLabel", () => {
  it("says tonight, tomorrow, or counts the days", () => {
    expect(whenLabel(0.2)).toBe("tonight");
    expect(whenLabel(1)).toBe("tomorrow");
    expect(whenLabel(6.4)).toBe("in 6 days");
  });

  it("is empty with nothing to say", () => {
    expect(whenLabel(null)).toBe("");
  });
});
