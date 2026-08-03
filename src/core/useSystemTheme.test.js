import { describe, expect, it } from "vitest";
import { resolveTheme } from "./useSystemTheme";

describe("resolveTheme", () => {
  it("honours an explicit preference", () => {
    expect(resolveTheme("dark", "light")).toBe("dark");
    expect(resolveTheme("light", "dark")).toBe("light");
  });

  it("falls back to the system theme for 'system'", () => {
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("system", "light")).toBe("light");
  });

  // A value from an older release, or a corrupted one, must not leave the app
  // themeless — it follows the OS, which is the new default anyway.
  it("treats anything unrecognised as 'system'", () => {
    for (const odd of [undefined, null, "", "auto", "Dark", 42]) {
      expect(resolveTheme(odd, "dark")).toBe("dark");
    }
  });
});
