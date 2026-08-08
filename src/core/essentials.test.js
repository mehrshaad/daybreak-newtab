import { describe, expect, it } from "vitest";
import { essentialsFirst } from "./essentials";

describe("essentialsFirst", () => {
  it("moves clock and weather to the front, in that order", () => {
    expect(essentialsFirst(["links", "weather", "tasks", "clock"])).toEqual([
      "clock",
      "weather",
      "links",
      "tasks",
    ]);
  });

  it("is a no-op when neither is present", () => {
    expect(essentialsFirst(["links", "tasks"])).toEqual(["links", "tasks"]);
  });

  it("handles just one of the two", () => {
    expect(essentialsFirst(["tasks", "weather", "links"])).toEqual([
      "weather",
      "tasks",
      "links",
    ]);
    expect(essentialsFirst(["tasks", "clock", "links"])).toEqual([
      "clock",
      "tasks",
      "links",
    ]);
  });

  it("leaves everything else in its original relative order", () => {
    expect(
      essentialsFirst(["gapps", "clock", "recenttabs", "weather", "habits"])
    ).toEqual(["clock", "weather", "gapps", "recenttabs", "habits"]);
  });

  it("already-leading essentials are left alone", () => {
    expect(essentialsFirst(["clock", "weather", "links"])).toEqual([
      "clock",
      "weather",
      "links",
    ]);
  });

  it("is a no-op on an empty board", () => {
    expect(essentialsFirst([])).toEqual([]);
  });

  it("does not duplicate or drop ids", () => {
    const ids = ["timer", "clock", "quote", "weather", "links"];
    const out = essentialsFirst(ids);
    expect(out).toHaveLength(ids.length);
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it("a duplicated clock instance is not treated as the essential", () => {
    // "clock#2" is a second copy — only "clock" itself leads.
    expect(essentialsFirst(["links", "clock#2", "clock"])).toEqual([
      "clock",
      "links",
      "clock#2",
    ]);
  });
});
