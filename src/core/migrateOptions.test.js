import { describe, expect, it } from "vitest";
import { hydrate } from "./schema";
import { migrateWidgetOptions } from "./migrateOptions";

// Removing a widget option is not free, and this is what it costs.
//
// Options are stored sparsely — only what somebody changed — and the manifest
// fills the rest. So when the focus timer's "50-minute rounds" switch became a
// minutes slider, every board that had it on would have read `longFocus: true`
// as a key nothing looks at any more and taken the 25-minute default. The
// person's timer halves and nothing says why.

describe("the focus timer's 50-minute switch", () => {
  it("becomes fifty minutes", () => {
    const out = migrateWidgetOptions({
      timer: { options: { longFocus: true, autoStart: true }, rate: "Live", config: {} },
    });
    expect(out.timer.options).toEqual({ focusMinutes: 50, autoStart: true });
  });

  it("is simply dropped when it was off, because off was always the default", () => {
    const out = migrateWidgetOptions({
      timer: { options: { longFocus: false, tabTitle: false }, rate: "Live", config: {} },
    });
    expect(out.timer.options).toEqual({ tabTitle: false });
  });

  it("does it for a second timer on the board too", () => {
    const out = migrateWidgetOptions({
      "timer#2": { options: { longFocus: true }, rate: "Live", config: {} },
    });
    expect(out["timer#2"].options.focusMinutes).toBe(50);
  });

  it("leaves a board that never touched it completely alone", () => {
    // Identity, not just equality: hydrate runs on every load, and handing
    // React a fresh widgets object each time would be a re-render for nothing.
    const widgets = { timer: { options: { autoStart: true }, rate: "Live", config: {} } };
    expect(migrateWidgetOptions(widgets)).toBe(widgets);
  });

  it("runs clean a second time", () => {
    const once = migrateWidgetOptions({
      timer: { options: { longFocus: true }, rate: "Live", config: {} },
    });
    expect(migrateWidgetOptions(once)).toBe(once);
  });

  it("does not touch another widget that happens to store the same key", () => {
    const widgets = { clock: { options: { longFocus: true }, rate: "Live", config: {} } };
    expect(migrateWidgetOptions(widgets)).toBe(widgets);
  });

  it("survives junk where a widget record should be", () => {
    expect(() => migrateWidgetOptions({ timer: null, "timer#2": { options: 7 } })).not.toThrow();
    expect(migrateWidgetOptions(undefined)).toBe(undefined);
  });
});

describe("hydrate", () => {
  it("applies it, so a saved board gets the translation on load", () => {
    // The seam that matters: the migration is worthless if nothing calls it.
    const out = hydrate({
      v: 2,
      widgets: { timer: { options: { longFocus: true }, rate: "Live", config: {} } },
    });
    expect(out.widgets.timer.options.focusMinutes).toBe(50);
    expect(out.widgets.timer.options.longFocus).toBeUndefined();
  });
});
