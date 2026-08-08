import { describe, expect, it } from "vitest";
import { defaultSettings, hydrate } from "./schema";

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
