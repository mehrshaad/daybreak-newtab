import { describe, expect, it } from "vitest";
import { fitForSync, resolveSynced } from "./synced";

describe("fitForSync", () => {
  it("writes as-is when under budget", () => {
    expect(fitForSync("hi", 100)).toEqual({ value: "hi", overflowed: false });
  });

  it("trims then writes when trimming brings it under budget", () => {
    const long = "x".repeat(50);
    const trim = (v) => v.slice(0, 10);
    const result = fitForSync(long, 20, trim);
    expect(result.overflowed).toBe(false);
    expect(result.value).toBe("x".repeat(10));
  });

  it("falls back to overflow when even the trimmed value is still too big", () => {
    const long = "x".repeat(50);
    const trim = (v) => v.slice(0, 40);
    const result = fitForSync(long, 20, trim);
    expect(result.overflowed).toBe(true);
    // The untrimmed value is preserved for the caller's local fallback.
    expect(result.value).toBe(long);
  });

  it("overflows immediately with no trim function", () => {
    const long = "x".repeat(50);
    expect(fitForSync(long, 20).overflowed).toBe(true);
  });
});

describe("resolveSynced", () => {
  it("pushes local up when sync has nothing yet", () => {
    expect(resolveSynced("local value", undefined, "initial")).toEqual({
      value: "local value",
      writeLocal: false,
      writeSync: true,
    });
  });

  it("pulls sync down to a fresh device with no local copy", () => {
    expect(resolveSynced(undefined, "synced value", "initial")).toEqual({
      value: "synced value",
      writeLocal: true,
      writeSync: false,
    });
  });

  it("prefers local when both exist, and touches neither", () => {
    expect(resolveSynced("local value", "synced value", "initial")).toEqual({
      value: "local value",
      writeLocal: false,
      writeSync: false,
    });
  });

  it("falls back to the initial value when neither exists", () => {
    expect(resolveSynced(undefined, undefined, "initial")).toEqual({
      value: "initial",
      writeLocal: false,
      writeSync: false,
    });
  });
});
