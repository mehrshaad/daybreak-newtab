import { describe, expect, it } from "vitest";
import { distance, inkFraction, isUsable, MIN_INK, SAMPLE, signature } from "./siteIcon";

// A SAMPLE x SAMPLE RGBA buffer, filled by a function of pixel index.
function pixels(fn) {
  const data = new Uint8ClampedArray(SAMPLE * SAMPLE * 4);
  for (let i = 0; i < SAMPLE * SAMPLE; i += 1) {
    const [r, g, b, a] = fn(i % SAMPLE, Math.floor(i / SAMPLE));
    data.set([r, g, b, a], i * 4);
  }
  return data;
}

const transparent = pixels(() => [0, 0, 0, 0]);
// Chrome's stand-in stands for every unknown site, so two of them are the
// same picture even though they came back for different addresses.
const grey = pixels((x, y) => (x + y) % 3 === 0 ? [128, 128, 128, 255] : [0, 0, 0, 0]);
const greyRedrawn = pixels((x, y) =>
  // One edge pixel different, as a redraw can be.
  x === 0 && y === 0 ? [0, 0, 0, 0] : (x + y) % 3 === 0 ? [128, 128, 128, 255] : [0, 0, 0, 0]
);
const colourful = pixels((x, y) => [x * 16, y * 16, 200, 255]);
const oneDot = pixels((x, y) => (x === 8 && y === 8 ? [0, 0, 0, 255] : [0, 0, 0, 0]));

describe("inkFraction", () => {
  it("is zero for a fully transparent square", () => {
    expect(inkFraction(transparent)).toBe(0);
  });

  it("is one where every pixel is opaque", () => {
    expect(inkFraction(colourful)).toBe(1);
  });

  it("counts only what carries ink", () => {
    expect(inkFraction(oneDot)).toBeCloseTo(1 / (SAMPLE * SAMPLE), 5);
  });
});

describe("signature", () => {
  it("gives one character per pixel", () => {
    expect(signature(colourful)).toHaveLength(SAMPLE * SAMPLE);
  });

  it("is stable for the same picture", () => {
    expect(signature(grey)).toBe(signature(pixels((x, y) => ((x + y) % 3 === 0 ? [128, 128, 128, 255] : [0, 0, 0, 0]))));
  });

  it("separates different pictures", () => {
    expect(signature(grey)).not.toBe(signature(colourful));
  });

  it("marks empty pixels rather than colouring them", () => {
    expect(signature(transparent)).toBe(".".repeat(SAMPLE * SAMPLE));
  });
});

describe("distance", () => {
  it("is zero for identical signatures", () => {
    expect(distance(signature(grey), signature(grey))).toBe(0);
  });

  it("stays tiny across a one-pixel redraw", () => {
    expect(distance(signature(grey), signature(greyRedrawn))).toBeLessThan(0.06);
  });

  it("is large for unrelated pictures", () => {
    expect(distance(signature(grey), signature(colourful))).toBeGreaterThan(0.5);
  });

  it("treats a missing or mismatched side as nothing in common", () => {
    expect(distance(null, signature(grey))).toBe(1);
    expect(distance("abc", "ab")).toBe(1);
  });
});

describe("isUsable", () => {
  const stand = signature(grey);

  it("takes a real icon", () => {
    expect(isUsable({ signature: signature(colourful), ink: 1 }, stand)).toBe(true);
  });

  it("refuses Chrome's stand-in", () => {
    expect(isUsable({ signature: stand, ink: inkFraction(grey) }, stand)).toBe(false);
  });

  it("still refuses it after a one-pixel redraw", () => {
    expect(
      isUsable({ signature: signature(greyRedrawn), ink: inkFraction(greyRedrawn) }, stand)
    ).toBe(false);
  });

  it("refuses a blank square", () => {
    expect(isUsable({ signature: signature(transparent), ink: 0 }, stand)).toBe(false);
  });

  it("refuses a lone dot as having nothing to show", () => {
    expect(inkFraction(oneDot)).toBeLessThan(MIN_INK);
    expect(isUsable({ signature: signature(oneDot), ink: inkFraction(oneDot) }, stand)).toBe(false);
  });

  it("refuses a load that never produced pixels", () => {
    expect(isUsable(null, stand)).toBe(false);
  });

  it("takes a real icon even when no stand-in could be sampled", () => {
    expect(isUsable({ signature: signature(colourful), ink: 1 }, null)).toBe(true);
  });
});
