import { describe, expect, it } from "vitest";
import {
  addNotice,
  CATEGORY_DURATION,
  freezeNotice,
  isSilenced,
  makeNotice,
  MAX_VISIBLE,
  removeNotice,
  tickNotices,
} from "./notices";

const make = (message, extra) => makeNotice({ message, ...extra });

describe("makeNotice", () => {
  it("gives every notice its own id", () => {
    expect(make("a").id).not.toBe(make("a").id);
  });

  it("takes the category's own duration", () => {
    expect(make("x", { category: "undo" }).duration).toBe(CATEGORY_DURATION.undo);
    expect(make("x", { category: "info" }).duration).toBe(CATEGORY_DURATION.info);
  });

  it("falls back to info for a category nobody declared", () => {
    expect(make("x", { category: "nonsense" }).category).toBe("info");
  });

  it("honours an explicit duration, including zero for sticky", () => {
    expect(make("x", { duration: 500 }).duration).toBe(500);
    expect(make("x", { duration: 0 }).duration).toBe(0);
  });

  it("keeps an action when given one", () => {
    const run = () => {};
    expect(make("x", { action: { label: "Undo", run } }).action).toEqual({ label: "Undo", run });
    expect(make("x").action).toBe(null);
  });
});

describe("isSilenced", () => {
  it("says nothing is silenced by default", () => {
    expect(isSilenced(undefined, "info")).toBe(false);
    expect(isSilenced({}, "info")).toBe(false);
  });

  it("silences everything when switched off wholesale", () => {
    const s = { notifications: { enabled: false } };
    expect(isSilenced(s, "info")).toBe(true);
    expect(isSilenced(s, "sync")).toBe(true);
  });

  it("silences one category without touching the others", () => {
    const s = { notifications: { enabled: true, categories: { update: false } } };
    expect(isSilenced(s, "update")).toBe(true);
    expect(isSilenced(s, "sync")).toBe(false);
  });
});

describe("addNotice", () => {
  it("appends", () => {
    expect(addNotice([], make("a"))).toHaveLength(1);
  });

  it("refreshes a duplicate instead of stacking it", () => {
    // A widget retrying a failing fetch should not build a tower.
    const first = make("Calendar unreachable", { category: "error" });
    let list = addNotice([], first);
    list = tickNotices(list, first.duration / 2).list;
    expect(list[0].remaining).toBeLessThan(1);

    list = addNotice(list, make("Calendar unreachable", { category: "error" }));
    expect(list).toHaveLength(1);
    expect(list[0].remaining).toBe(1);
  });

  it("treats the same words in a different category as different news", () => {
    let list = addNotice([], make("Saved", { category: "info" }));
    list = addNotice(list, make("Saved", { category: "sync" }));
    expect(list).toHaveLength(2);
  });

  it("keeps only the newest when it overflows", () => {
    let list = [];
    for (let i = 0; i < MAX_VISIBLE + 2; i += 1) list = addNotice(list, make(`n${i}`));
    expect(list).toHaveLength(MAX_VISIBLE);
    expect(list[0].message).toBe("n2");
    expect(list[list.length - 1].message).toBe(`n${MAX_VISIBLE + 1}`);
  });
});

describe("removeNotice", () => {
  it("drops just the one", () => {
    const a = make("a");
    const b = make("b");
    expect(removeNotice([a, b], a.id)).toEqual([b]);
  });

  it("is a no-op for an id already gone", () => {
    const a = make("a");
    expect(removeNotice([a], 9999)).toEqual([a]);
  });
});

describe("tickNotices", () => {
  it("counts down as a fraction of the notice's own duration", () => {
    const list = [make("a", { duration: 1000 })];
    const { list: next } = tickNotices(list, 250);
    expect(next[0].remaining).toBeCloseTo(0.75, 5);
  });

  it("reports what ran out", () => {
    const list = [make("a", { duration: 1000 }), make("b", { duration: 4000 })];
    const { list: next, expired } = tickNotices(list, 1000);
    expect(expired).toEqual([list[0].id]);
    expect(next[0].remaining).toBe(0);
    expect(next[1].remaining).toBeCloseTo(0.75, 5);
  });

  it("leaves a frozen notice exactly where it was", () => {
    const list = freezeNotice([make("a", { duration: 1000 })], 0, true);
    const held = freezeNotice(list, list[0].id, true);
    const { list: next, expired } = tickNotices(held, 5000);
    expect(next[0].remaining).toBe(1);
    expect(expired).toEqual([]);
  });

  it("never expires a sticky notice", () => {
    const { list: next, expired } = tickNotices([make("a", { duration: 0 })], 100000);
    expect(expired).toEqual([]);
    expect(next[0].remaining).toBe(1);
  });
});

describe("freezeNotice", () => {
  it("freezes and thaws only the one named", () => {
    const a = make("a");
    const b = make("b");
    const frozen = freezeNotice([a, b], a.id, true);
    expect(frozen[0].frozen).toBe(true);
    expect(frozen[1].frozen).toBe(false);
    expect(freezeNotice(frozen, a.id, false)[0].frozen).toBe(false);
  });
});
