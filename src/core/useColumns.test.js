import { describe, expect, it } from "vitest";
import { BOARD_WIDTHS, boardWidthChoices, columnsForWidth } from "./useColumns";

describe("columnsForWidth", () => {
  it("uses the full grid on a wide window", () => {
    expect(columnsForWidth(1920)).toBe(12);
    expect(columnsForWidth(1100)).toBe(12);
  });

  it("halves at laptop widths", () => {
    expect(columnsForWidth(1099)).toBe(8);
    expect(columnsForWidth(760)).toBe(8);
  });

  it("drops to four when narrow", () => {
    expect(columnsForWidth(759)).toBe(4);
    expect(columnsForWidth(320)).toBe(4);
  });

  it("always resolves, even at zero", () => {
    expect(columnsForWidth(0)).toBe(4);
  });
});

describe("boardWidthChoices", () => {
  it("offers nothing to choose between on a window narrower than the first cap", () => {
    // Every option gives the identical board here, so three pills that all do
    // nothing would read as a broken setting rather than an inapplicable one.
    for (const width of [900, 1200, 1400, 1600]) {
      expect(boardWidthChoices(width, "comfortable"), String(width)).toEqual(["comfortable"]);
    }
  });

  it("offers the wider board once the window can actually show one", () => {
    // 1560 cap plus 28px of padding either side: past that, wide is genuinely
    // wider than comfortable.
    expect(boardWidthChoices(1800, "comfortable")).toEqual(["comfortable", "wide"]);
  });

  it("offers all three only when full is wider than wide", () => {
    expect(boardWidthChoices(2560, "comfortable")).toEqual(["comfortable", "wide", "full"]);
  });

  it("keeps whatever is currently chosen, however narrow the window", () => {
    // Otherwise the row would render with nothing selected, and the stored
    // setting still matters the moment the window grows again.
    expect(boardWidthChoices(1200, "full")).toContain("full");
    expect(boardWidthChoices(1200, "wide")).toContain("wide");
  });

  it("never offers a duplicate or an unknown name", () => {
    for (const width of [600, 1600, 1800, 2100, 3000]) {
      const out = boardWidthChoices(width, "comfortable");
      expect(new Set(out).size, String(width)).toBe(out.length);
      for (const name of out) expect(BOARD_WIDTHS[name], name).toBeDefined();
    }
  });
});
