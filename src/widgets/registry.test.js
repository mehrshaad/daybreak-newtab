import { describe, expect, it } from "vitest";
import { resolveRate } from "./registry";

describe("resolveRate", () => {
  it("keeps the user's own choice when it is still offered", () => {
    expect(resolveRate("weather", "5 min")).toBe("5 min");
  });

  it("falls back to the manifest's first choice, not a hardcoded Live", () => {
    // crypto's manifest deliberately excludes "Live" to respect its rate limit.
    expect(resolveRate("crypto", undefined)).toBe("5 min");
  });

  it("ignores a stored rate the widget no longer offers", () => {
    expect(resolveRate("crypto", "Live")).toBe("5 min");
  });

  it("falls back to Live for a widget with no refresh list at all", () => {
    expect(resolveRate("quote", undefined)).toBe("Live");
  });

  it("is Live for an unknown widget id", () => {
    expect(resolveRate("nonexistent", undefined)).toBe("Live");
  });
});
