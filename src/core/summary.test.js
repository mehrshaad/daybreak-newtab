import { describe, expect, it } from "vitest";
import { heroSummary } from "./summary";

const withTasks = (items) => ({ widgets: { tasks: { config: { items } } } });

describe("heroSummary", () => {
  it("says nothing when the board has nothing to report", () => {
    expect(heroSummary({ widgets: {} }, ["clock", "quote"])).toBe("");
    expect(heroSummary({ widgets: {} }, [])).toBe("");
  });

  it("counts open tasks only", () => {
    const s = withTasks([
      { text: "a", done: false },
      { text: "b", done: true },
      { text: "c", done: false },
    ]);
    expect(heroSummary(s, ["tasks"])).toBe("2 open tasks");
  });

  it("uses the singular for one task", () => {
    expect(heroSummary(withTasks([{ text: "a", done: false }]), ["tasks"])).toBe(
      "1 open task"
    );
  });

  it("celebrates an empty list rather than saying '0 open tasks'", () => {
    expect(heroSummary(withTasks([{ text: "a", done: true }]), ["tasks"])).toBe(
      "No tasks left"
    );
  });

  it("sums across duplicated task widgets", () => {
    const s = {
      widgets: {
        tasks: { config: { items: [{ done: false }] } },
        "tasks#2": { config: { items: [{ done: false }, { done: false }] } },
      },
    };
    expect(heroSummary(s, ["tasks", "tasks#2"])).toBe("3 open tasks");
  });

  it("mentions world clocks", () => {
    const s = {
      widgets: {
        worldclocks: { config: { zones: [{ city: "A" }, { city: "B" }, { city: "C" }] } },
      },
    };
    expect(heroSummary(s, ["worldclocks"])).toBe("3 clocks");
  });

  it("assumes the two default zones when none are configured", () => {
    expect(heroSummary({ widgets: {} }, ["worldclocks"])).toBe("2 clocks");
  });

  it("joins several parts and capitalises once", () => {
    const s = {
      widgets: {
        tasks: { config: { items: [{ done: false }] } },
        worldclocks: { config: { zones: [{ city: "A" }, { city: "B" }] } },
      },
    };
    expect(heroSummary(s, ["tasks", "worldclocks"])).toBe("1 open task · 2 clocks");
  });

  it("ignores widgets that are installed but not on the board", () => {
    expect(heroSummary(withTasks([{ done: false }]), ["clock"])).toBe("");
  });

  it("tolerates missing or malformed widget records", () => {
    expect(heroSummary({ widgets: { tasks: {} } }, ["tasks"])).toBe("No tasks left");
    expect(heroSummary({}, ["tasks"])).toBe("No tasks left");
    expect(heroSummary({ widgets: { tasks: { config: { items: "nope" } } } }, ["tasks"])).toBe(
      "No tasks left"
    );
  });
});
