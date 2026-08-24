import { describe, expect, it } from "vitest";
import { savedViewState } from "./savedView";

const board = (ids, sizes = {}, saved = undefined) => ({ ids, sizes, saved });

describe("savedViewState", () => {
  it("says there is nothing saved when there is nothing saved", () => {
    expect(savedViewState(board(["clock"]))).toBe("none");
    expect(savedViewState({ ids: ["clock"], saved: null })).toBe("none");
    expect(savedViewState(undefined)).toBe("none");
  });

  it("matches an identical board", () => {
    const saved = { ids: ["clock", "tasks"], sizes: { clock: [3, 2] } };
    expect(savedViewState(board(["clock", "tasks"], { clock: [3, 2] }, saved))).toBe("saved");
  });

  it("counts a reorder as a change, because the arrangement is the point", () => {
    const saved = { ids: ["clock", "tasks"], sizes: {} };
    expect(savedViewState(board(["tasks", "clock"], {}, saved))).toBe("changed");
  });

  it("counts an added or removed widget", () => {
    const saved = { ids: ["clock"], sizes: {} };
    expect(savedViewState(board(["clock", "tasks"], {}, saved))).toBe("changed");
    expect(savedViewState(board([], {}, saved))).toBe("changed");
  });

  it("counts a resize", () => {
    const saved = { ids: ["clock"], sizes: { clock: [3, 2] } };
    expect(savedViewState(board(["clock"], { clock: [4, 2] }, saved))).toBe("changed");
  });

  it("treats an absent size as the default, not as a difference", () => {
    // Both sides absent is a match; one side explicit is not, even if that
    // explicit value happens to be what the default would have been — the
    // snapshot cannot know a widget's default and must not guess.
    expect(savedViewState(board(["clock"], {}, { ids: ["clock"], sizes: {} }))).toBe("saved");
    expect(savedViewState(board(["clock"], { clock: [3, 2] }, { ids: ["clock"], sizes: {} }))).toBe(
      "changed"
    );
  });

  it("ignores a stale size for a widget no longer on the board", () => {
    // `sizes` keeps entries for removed widgets. A leftover key for something
    // that is not there is not a difference anyone can see.
    const saved = { ids: ["clock"], sizes: { clock: [3, 2], gone: [4, 4] } };
    expect(savedViewState(board(["clock"], { clock: [3, 2], alsoGone: [2, 2] }, saved))).toBe(
      "saved"
    );
  });
});
