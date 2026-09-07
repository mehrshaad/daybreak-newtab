import { afterEach, describe, expect, it, vi } from "vitest";
import { layoutRect, pageZoomFactor } from "./zoom";

// jsdom has no layout, so the two measurements this reconciles are stubbed to
// the values Chrome actually returns. Those came from a probe in a real page:
// at `zoom: 125%` on body, an element with `left: 500px` reports a rect x of
// 625, a rect width of 50, and an offsetWidth of 40.
function withBody({ rectWidth, offsetWidth }) {
  const body = document.body;
  vi.spyOn(body, "offsetWidth", "get").mockReturnValue(offsetWidth);
  vi.spyOn(body, "getBoundingClientRect").mockReturnValue({ width: rectWidth });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pageZoomFactor", () => {
  it("is one when nothing is zoomed", () => {
    withBody({ rectWidth: 1200, offsetWidth: 1200 });
    expect(pageZoomFactor()).toBe(1);
  });

  it("reads a zoom above one", () => {
    withBody({ rectWidth: 1500, offsetWidth: 1200 });
    expect(pageZoomFactor()).toBeCloseTo(1.25, 4);
  });

  it("reads a zoom below one, which is the case that was reported", () => {
    // A tooltip 10 to 20 pixels left of its icon is what a zoom under 100%
    // does: the position is computed in visual pixels and then read as layout
    // pixels, so it lands at x * zoom.
    withBody({ rectWidth: 1080, offsetWidth: 1200 });
    expect(pageZoomFactor()).toBeCloseTo(0.9, 4);
  });

  it("refuses an absurd ratio rather than moving everything", () => {
    // A detached node, a mid-animation measurement, a division by a stale
    // zero. One is the answer that changes nothing.
    withBody({ rectWidth: 1200, offsetWidth: 0 });
    expect(pageZoomFactor()).toBe(1);
    withBody({ rectWidth: 100000, offsetWidth: 1 });
    expect(pageZoomFactor()).toBe(1);
  });
});

describe("layoutRect", () => {
  const el = {
    getBoundingClientRect: () => ({
      left: 625,
      top: 250,
      right: 675,
      bottom: 275,
      width: 50,
      height: 25,
    }),
  };

  it("hands a rect straight back when there is no zoom", () => {
    withBody({ rectWidth: 1200, offsetWidth: 1200 });
    expect(layoutRect(el).left).toBe(625);
  });

  it("converts a visual rect into the space `left` is read in", () => {
    // The whole fix, in one assertion. Chrome reported x 625 for an element
    // written at left 500 under a 125% zoom; this has to give back 500.
    expect(layoutRect(el, 1.25)).toMatchObject({
      left: 500,
      top: 200,
      right: 540,
      bottom: 220,
      width: 40,
      height: 20,
    });
  });

  it("centres a box on its anchor correctly once converted", () => {
    // What the tooltip actually computes. In mixed units a 40px-wide panel
    // against this anchor lands 12.5px off; in one space it is exact.
    const zoom = 1.25;
    const a = layoutRect(el, zoom);
    const panelWidth = 40;
    expect(a.left + (a.width - panelWidth) / 2).toBe(500);
    // The mistake, kept here so the difference is on the record: the rect's
    // own visual width against a layout panel width.
    const mixed = el.getBoundingClientRect();
    expect(mixed.left + (mixed.width - panelWidth) / 2).not.toBe(500);
  });
});
