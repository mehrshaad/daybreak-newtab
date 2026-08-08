import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clampToViewport } from "./clamp";

describe("clampToViewport", () => {
  const original = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    window.innerWidth = 1000;
    window.innerHeight = 800;
  });

  afterEach(() => {
    window.innerWidth = original.width;
    window.innerHeight = original.height;
  });

  it("leaves a box that already fits untouched", () => {
    expect(clampToViewport(100, 100, 200, 100)).toEqual({ left: 100, top: 100 });
  });

  it("pulls a box back from the right and bottom edges", () => {
    expect(clampToViewport(950, 780, 200, 100)).toEqual({ left: 788, top: 688 });
  });

  it("never pushes a box past the left or top edge, even from a negative origin", () => {
    expect(clampToViewport(-50, -50, 200, 100)).toEqual({ left: 12, top: 12 });
  });

  it("honours a custom edge margin", () => {
    expect(clampToViewport(0, 0, 200, 100, 24)).toEqual({ left: 24, top: 24 });
  });

  it("centres a box wider than the viewport at the edge margin rather than a negative offset", () => {
    expect(clampToViewport(400, 100, 1200, 100)).toEqual({ left: 12, top: 100 });
  });
});
