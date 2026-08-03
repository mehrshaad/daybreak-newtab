import { describe, expect, it } from "vitest";
import { columnsForWidth } from "./useColumns";

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
