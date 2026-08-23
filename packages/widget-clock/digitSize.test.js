import { describe, expect, it } from "vitest";
import { digitFontSize, widthEm } from "./digitSize";

const box = (width, height) => ({ width, height });

describe("widthEm", () => {
  it("charges less for a colon than for a digit", () => {
    expect(widthEm("11")).toBeGreaterThan(widthEm("1:"));
  });

  it("grows with the number of characters", () => {
    expect(widthEm("2:22")).toBeLessThan(widthEm("2:22:07"));
    expect(widthEm("2:22")).toBeLessThan(widthEm("12:22"));
  });

  it("adds for the meridiem", () => {
    expect(widthEm("2:22", true)).toBeGreaterThan(widthEm("2:22", false));
  });
});

describe("digitFontSize", () => {
  it("says nothing until the tile has been measured", () => {
    // The caller falls back to its viewport guess for that one frame rather
    // than drawing a size it is about to change.
    expect(digitFontSize(null, "2:22")).toBeNull();
    expect(digitFontSize(box(0, 0), "2:22")).toBeNull();
    expect(digitFontSize(box(300, 0), "2:22")).toBeNull();
  });

  it("grows with the tile", () => {
    const small = digitFontSize(box(200, 110), "2:22");
    const large = digitFontSize(box(400, 220), "2:22");
    expect(large).toBeGreaterThan(small);
  });

  it("is the bug: a wide tile no longer draws window-sized digits", () => {
    // 400x220 was the tile in the report, drawing at 34px. Whatever the exact
    // constants end up being, that tile has to be well past the old cap of 44.
    expect(digitFontSize(box(400, 220), "2:22", { meridiem: true, date: true }))
      .toBeGreaterThan(50);
  });

  it("shrinks for a longer time rather than overflowing", () => {
    const short = digitFontSize(box(300, 400), "2:22");
    const long = digitFontSize(box(300, 400), "12:22:07");
    // Both are height-rich and width-poor, so the string length is what decides.
    expect(long).toBeLessThan(short);
  });

  it("leaves room for the date line when there is one", () => {
    // Short enough that neither answer is the upper cap, or both would come
    // back at 132 and the test would prove nothing.
    const withDate = digitFontSize(box(400, 140), "2:22", { date: true });
    const alone = digitFontSize(box(400, 140), "2:22", { date: false });
    expect(withDate).toBeLessThan(alone);
  });

  it("never returns something unreadable or absurd", () => {
    for (const [w, h] of [[40, 30], [10, 10], [4000, 3000], [1, 900]]) {
      const px = digitFontSize(box(w, h), "2:22");
      expect(px, `${w}x${h}`).toBeGreaterThanOrEqual(22);
      expect(px, `${w}x${h}`).toBeLessThanOrEqual(132);
    }
  });

  it("keeps the digits inside the tile they were measured for", () => {
    // The point of the width limit: font size times the string's em width must
    // still fit across the tile.
    for (const [w, h] of [[203, 110], [370, 200], [560, 300], [900, 400]]) {
      const px = digitFontSize(box(w, h), "12:22", { meridiem: true, date: true });
      expect(px * widthEm("12:22", true), `${w}x${h}`).toBeLessThanOrEqual(w);
    }
  });

  it("returns a whole number of pixels", () => {
    const px = digitFontSize(box(333, 187), "9:07", { meridiem: true });
    expect(Number.isInteger(px)).toBe(true);
  });
});
