import { describe, expect, it } from "vitest";
import { essentialsFirst } from "./essentials";
import { defaultSettings, hydrate, PRESETS, presetBoardPatch } from "./schema";

describe("hydrate — welcome tour", () => {
  it("leaves tourDone false for a genuinely fresh install (nothing saved)", () => {
    expect(hydrate(null).behavior.tourDone).toBe(false);
    expect(hydrate(undefined).behavior.tourDone).toBe(false);
  });

  it("marks an existing install as already toured, even if its saved blob predates the field", () => {
    const preExisting = { ...defaultSettings(), behavior: { showGreeting: true } };
    expect(hydrate(preExisting).behavior.tourDone).toBe(true);
  });

  it("respects an explicit tourDone the saved blob already carries", () => {
    const saved = { ...defaultSettings(), behavior: { tourDone: false } };
    expect(hydrate(saved).behavior.tourDone).toBe(false);
  });

  it("does not resurface the tour for a returning user who already dismissed it", () => {
    const saved = { ...defaultSettings(), behavior: { tourDone: true } };
    expect(hydrate(saved).behavior.tourDone).toBe(true);
  });
});

describe('presetBoardPatch — the "Yours" snapshot', () => {
  const board = {
    ids: ["clock", "weather", "tasks"],
    sizes: { tasks: [4, 3] },
    installed: ["clock", "weather", "tasks"],
    saved: null,
  };

  it("captures the current board as the saved layout on the first switch", () => {
    const patch = presetBoardPatch("Minimal", board);
    expect(patch.saved).toEqual({ ids: board.ids, sizes: board.sizes });
    expect(patch.layoutName).toBe("Minimal");
    expect(patch.ids).toEqual(essentialsFirst(PRESETS.Minimal));
  });

  it("leaves an existing saved layout alone on a later switch", () => {
    const alreadySaved = { ...board, saved: { ids: ["clock"], sizes: {} } };
    const patch = presetBoardPatch("Focus", alreadySaved);
    expect(patch.saved).toBeUndefined();
  });

  it("keeps every widget already on the board installed, alongside the preset's own", () => {
    const patch = presetBoardPatch("Dense", board);
    expect(patch.installed).toEqual(expect.arrayContaining([...PRESETS.Dense, "tasks"]));
  });
});
