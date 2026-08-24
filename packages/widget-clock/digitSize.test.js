import { describe, expect, it } from "vitest";
import { digitFontSize, fitFontSize, TEXT_SIZES, widthEm } from "./digitSize";
import manifest from "./manifest";

const box = (width, height) => ({ width, height });

// Tiles the board actually produces, so the properties below are checked
// against real geometry rather than round numbers. Widths come from the
// 12-column grid at its three caps; heights are what a tile has left for its
// body after the label row and its own padding.
const REAL_TILES = [
  [211, 130], // 2x2 on the default board
  [365, 130], // 3x2
  [365, 230], // 3x3
  [400, 164], // the 400x220 tile from the report
  [560, 300], // 3x2 on a full-width board
];

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

describe("fitFontSize", () => {
  it("says nothing until the tile has been measured", () => {
    expect(fitFontSize(null, "2:22")).toBeNull();
    expect(fitFontSize(box(0, 0), "2:22")).toBeNull();
    expect(fitFontSize(box(300, 0), "2:22")).toBeNull();
  });

  it("leaves room for the date line when there is one", () => {
    expect(fitFontSize(box(400, 140), "2:22", { date: true })).toBeLessThan(
      fitFontSize(box(400, 140), "2:22", { date: false })
    );
  });

  it("is bounded by whichever axis runs out first", () => {
    // Tall and narrow: the width decides, so more height changes nothing.
    const narrow = fitFontSize(box(120, 400), "2:22");
    expect(fitFontSize(box(120, 900), "2:22")).toBe(narrow);
    // Wide and short: the height decides.
    const short = fitFontSize(box(900, 120), "2:22");
    expect(fitFontSize(box(1600, 120), "2:22")).toBe(short);
  });
});

describe("digitFontSize", () => {
  it("says nothing until the tile has been measured", () => {
    // The caller falls back to its viewport guess for that one frame rather
    // than drawing a size it is about to change.
    expect(digitFontSize(null, "2:22")).toBeNull();
    expect(digitFontSize(box(0, 0), "2:22")).toBeNull();
  });

  it("grows with the tile", () => {
    expect(digitFontSize(box(400, 220), "2:22")).toBeGreaterThan(
      digitFontSize(box(200, 110), "2:22")
    );
  });

  it("is the bug: a wide tile no longer draws window-sized digits", () => {
    // 400x220 was the tile in the report, drawing at 34px against an old cap
    // of 44. Whatever the constants become, that tile has to be well past it.
    expect(
      digitFontSize(box(400, 164), "2:22", { meridiem: true, date: true })
    ).toBeGreaterThan(50);
  });

  it("shrinks for a longer time rather than overflowing", () => {
    // Both height-rich and width-poor, so the string length is what decides.
    expect(digitFontSize(box(300, 400), "12:22:07")).toBeLessThan(
      digitFontSize(box(300, 400), "2:22")
    );
  });

  it("returns a whole number of pixels", () => {
    expect(Number.isInteger(digitFontSize(box(333, 187), "9:07", { meridiem: true }))).toBe(true);
  });
});

describe("the five size steps", () => {
  it("offers exactly the five the manifest does", () => {
    const option = manifest.options.find((o) => o.key === "textSize");
    expect(option).toBeTruthy();
    expect(option.of).toEqual(TEXT_SIZES);
    expect(TEXT_SIZES).toHaveLength(5);
    // Every one needs a label, or the pill falls back to printing "xxl".
    for (const step of TEXT_SIZES) expect(option.labels[step], step).toBeTruthy();
  });

  it("only shows for the digital face", () => {
    // An analog dial fills its tile already; a size step there would do
    // nothing, which is the state the align and 24-hour options are in too.
    const option = manifest.options.find((o) => o.key === "textSize");
    expect(option.showIf).toEqual({ analog: false });
  });

  it("defaults to the middle one", () => {
    const option = manifest.options.find((o) => o.key === "textSize");
    expect(option.default).toBe("m");
    expect(TEXT_SIZES[2 - 1]).toBe("m");
  });

  it("gets bigger with every step, on every real tile and every time", () => {
    // The point of taking shares of the ceiling rather than multiplying a
    // comfortable size: with a plain multiplier the top steps all clamp to the
    // same number on a tile that is already near its limit, and three of the
    // five options quietly do nothing.
    //
    // Short times as well as long ones. "2:22" leaves the most room, so it is
    // the case that reaches any absolute cap first — which is how a MAX set
    // too low was caught flattening XL and XXL on a 560x300 tile.
    for (const [w, h] of REAL_TILES) {
      for (const time of ["2:22", "12:22", "12:22:07"]) {
        for (const meridiem of [true, false]) {
          for (const date of [true, false]) {
            const sizes = TEXT_SIZES.map((size) =>
              digitFontSize(box(w, h), time, { meridiem, date, size })
            );
            for (let i = 1; i < sizes.length; i += 1) {
              const where = `${w}x${h} "${time}" ${TEXT_SIZES[i]} vs ${TEXT_SIZES[i - 1]}`;
              expect(sizes[i], where).toBeGreaterThan(sizes[i - 1]);
            }
          }
        }
      }
    }
  });

  it("keeps every step inside the tile it was measured for", () => {
    for (const [w, h] of REAL_TILES) {
      for (const size of TEXT_SIZES) {
        const px = digitFontSize(box(w, h), "12:22", { meridiem: true, date: true, size });
        expect(px * widthEm("12:22", true), `${w}x${h} ${size} width`).toBeLessThanOrEqual(w);
        // Digits, the gap and the date line together, against the tile's height.
        expect(px * (0.72 + 0.32) + 10, `${w}x${h} ${size} height`).toBeLessThanOrEqual(h);
      }
    }
  });

  it("never lets the largest step overflow, even with seconds showing", () => {
    for (const [w, h] of REAL_TILES) {
      const px = digitFontSize(box(w, h), "12:22:07", {
        meridiem: true,
        date: true,
        size: "xxl",
      });
      expect(px * widthEm("12:22:07", true), `${w}x${h}`).toBeLessThanOrEqual(w);
    }
  });

  it("treats an unknown step as the middle one", () => {
    // A config written by an older version, or by hand.
    const fallback = digitFontSize(box(365, 130), "2:22", { size: "enormous" });
    expect(fallback).toBe(digitFontSize(box(365, 130), "2:22", { size: "m" }));
    expect(fallback).toBe(digitFontSize(box(365, 130), "2:22"));
  });

  it("keeps the middle step where the measured fit already was", () => {
    // Upgrading must not resize anybody's clock. The version this replaces
    // drew a 3x2 tile at min(130 * 0.5 / 0.72, ...) which is 90px.
    expect(digitFontSize(box(365, 130), "2:22", { meridiem: true, date: true })).toBeCloseTo(
      90,
      -1
    );
  });

  it("stays legible at the smallest step on the smallest tile", () => {
    const px = digitFontSize(box(211, 130), "12:22", { meridiem: true, date: true, size: "s" });
    expect(px).toBeGreaterThanOrEqual(22);
  });
});
