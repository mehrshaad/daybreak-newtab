import { describe, expect, it } from "vitest";
import { reorderVisible } from "./reorder";

const item = (id, done = false) => ({ id, text: id, done });

describe("reorderVisible", () => {
  it("reorders a plain list the same way moveItem would", () => {
    const items = [item("a"), item("b"), item("c")];
    const out = reorderVisible(items, ["a", "b", "c"], 0, 2);
    expect(out.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("leaves hidden (done) items pinned at their own positions", () => {
    const items = [item("a"), item("b", true), item("c"), item("d", true)];
    // Only a and c are visible; drag a past c.
    const out = reorderVisible(items, ["a", "c"], 0, 1);
    // b and d never move; a and c swap within the slots that were visible.
    expect(out.map((t) => t.id)).toEqual(["c", "b", "a", "d"]);
  });

  it("is a no-op when from and to are the same visible index", () => {
    const items = [item("a"), item("b", true), item("c")];
    const out = reorderVisible(items, ["a", "c"], 0, 0);
    expect(out.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the original array", () => {
    const items = [item("a"), item("b"), item("c")];
    reorderVisible(items, ["a", "b", "c"], 0, 2);
    expect(items.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });
});
