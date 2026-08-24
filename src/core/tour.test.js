import { describe, expect, it } from "vitest";
import {
  emphasise,
  isLast,
  nextIndex,
  prevIndex,
  SCENES,
  stepAt,
  TOUR_STEPS,
  usableSteps,
} from "./tour";

describe("the step list", () => {
  it("gives every step an id, a title and something to say", () => {
    for (const step of TOUR_STEPS) {
      expect(step.id, JSON.stringify(step)).toBeTruthy();
      expect(step.title, step.id).toBeTruthy();
      expect(step.body, step.id).toBeTruthy();
      // A step that says less than this is a step that did not need to exist.
      expect(step.body.length, step.id).toBeGreaterThan(40);
    }
  });

  it("has no duplicate ids", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only asks for scenes the app knows how to set up", () => {
    for (const step of TOUR_STEPS) expect(SCENES, step.id).toContain(step.scene);
  });

  it("starts and ends on the board", () => {
    // Opening on a drawer would explain a panel before saying what the page is,
    // and ending inside one would leave somebody in a mode they did not choose.
    expect(TOUR_STEPS[0].scene).toBe("board");
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].scene).toBe("board");
  });

  it("opens each drawer once and never comes back to it", () => {
    // Every scene change but one is a drawer opening or the board changing
    // mode, and returning to a drawer already visited means the tour bounced
    // out of it and back — which on screen is a panel sliding shut and open
    // again for no reason the reader can see.
    //
    // The board is the exception and is allowed several: it is the resting
    // state between drawers, so pointing at the Store button before opening
    // the Store necessarily passes back through it.
    const changes = TOUR_STEPS.filter((s, i) => i === 0 || s.scene !== TOUR_STEPS[i - 1].scene);
    const visits = {};
    for (const step of changes) visits[step.scene] = (visits[step.scene] || 0) + 1;
    for (const [scene, count] of Object.entries(visits)) {
      if (scene === "board") continue;
      expect(count, scene).toBe(1);
    }
  });

  it("points at a control before opening what it opens", () => {
    // Being dropped inside the Store or Settings having never seen the button
    // that opens it teaches nothing about how to get back there.
    const ids = TOUR_STEPS.map((s) => s.id);
    for (const [button, opened] of [
      ["store-button", "store"],
      ["settings-button", "appearance"],
      ["edit-button", "drag"],
    ]) {
      expect(ids.indexOf(button), button).toBeGreaterThanOrEqual(0);
      expect(ids.indexOf(button), button).toBeLessThan(ids.indexOf(opened));
    }
  });

  it("shows a button while it is still just a button", () => {
    // The step that points at a control has to be on the board, not inside the
    // thing the control opens — otherwise it is describing something that has
    // already happened.
    for (const id of ["store-button", "settings-button", "edit-button"]) {
      expect(TOUR_STEPS.find((s) => s.id === id).scene, id).toBe("board");
    }
  });

  it("finishes the settings drawer before leaving it", () => {
    // Profiles are introduced by the switcher in the toolbar, which means
    // stepping back out to the board — so everything inside Settings has to be
    // done by then, or the drawer would reopen after being closed.
    const scenes = TOUR_STEPS.map((s) => s.scene);
    const lastSettings = scenes.lastIndexOf("settings");
    const profiles = TOUR_STEPS.findIndex((s) => s.id === "profiles");
    expect(profiles).toBeGreaterThan(lastSettings);
  });

  it("ends on something worth ending on", () => {
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].celebrate).toBe(true);
  });

  it("covers the things somebody has to be told", () => {
    // Not a style check: these are the capabilities that are invisible until
    // somebody says them out loud, and the tour exists for exactly those.
    const all = TOUR_STEPS.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
    for (const idea of [
      "right-click",
      "alt e",
      "alt a",
      "ctrl k",
      "handle",
      "preset",
      "profile",
      "file",
      "escape",
    ]) {
      expect(all, idea).toContain(idea);
    }
  });
});

describe("usableSteps", () => {
  it("keeps every step on a board that has widgets", () => {
    // The bug this replaces: the first version asked whether each step's target
    // was in the DOM, which is only true once that step's scene is open. At the
    // moment the tour started, every drawer was shut — so it discarded nine of
    // its thirteen steps and announced itself as "1 of 3".
    expect(usableSteps(TOUR_STEPS, { hasWidgets: true })).toHaveLength(TOUR_STEPS.length);
    expect(usableSteps(TOUR_STEPS)).toHaveLength(TOUR_STEPS.length);
  });

  it("drops only the steps that need a widget when the board is empty", () => {
    const steps = usableSteps(TOUR_STEPS, { hasWidgets: false });
    for (const id of ["tile", "drag", "widget-settings", "widget-colour"]) {
      expect(steps.some((s) => s.id === id), id).toBe(false);
    }
    for (const id of ["welcome", "search", "store", "appearance", "done"]) {
      expect(steps.some((s) => s.id === id), id).toBe(true);
    }
  });

  it("still starts and ends on the board with an empty one", () => {
    const steps = usableSteps(TOUR_STEPS, { hasWidgets: false });
    expect(steps.length).toBeGreaterThan(4);
    expect(steps[0].scene).toBe("board");
    expect(steps[steps.length - 1].scene).toBe("board");
  });
});

describe("moving through it", () => {
  const steps = TOUR_STEPS;

  it("clamps at both ends rather than wrapping", () => {
    // Arrowing past the last step onto the first would read as a bug.
    expect(prevIndex(0)).toBe(0);
    expect(nextIndex(steps, steps.length - 1)).toBe(steps.length - 1);
  });

  it("moves one at a time", () => {
    expect(nextIndex(steps, 0)).toBe(1);
    expect(prevIndex(3)).toBe(2);
  });

  it("knows when it is finished", () => {
    expect(isLast(steps, steps.length - 1)).toBe(true);
    expect(isLast(steps, 0)).toBe(false);
  });

  it("never hands back a step that is not there", () => {
    for (const index of [-5, 0, 3, 999]) {
      expect(stepAt(steps, index), String(index)).toBeTruthy();
    }
    expect(stepAt([], 0)).toBeNull();
  });
});

describe("emphasise", () => {
  it("splits a body into plain and emphasised runs", () => {
    expect(emphasise("press **Ctrl K** to search")).toEqual([
      { text: "press ", strong: false },
      { text: "Ctrl K", strong: true },
      { text: " to search", strong: false },
    ]);
  });

  it("handles emphasis at either end", () => {
    expect(emphasise("**Alt E** opens it")[0]).toEqual({ text: "Alt E", strong: true });
    expect(emphasise("it opens with **Alt E**").pop()).toEqual({ text: "Alt E", strong: true });
  });

  it("leaves an unclosed marker alone rather than bolding the rest", () => {
    // A typo in the copy should cost one pair of asterisks on screen, not the
    // remainder of the sentence in bold.
    const runs = emphasise("this **never closes");
    expect(runs.every((r) => !r.strong)).toBe(true);
  });

  it("drops the empty runs splitting produces", () => {
    for (const run of emphasise("**a**b**c**")) expect(run.text.length).toBeGreaterThan(0);
  });

  it("copes with nothing", () => {
    expect(emphasise("")).toEqual([]);
    expect(emphasise(undefined)).toEqual([]);
  });

  it("keeps every body in the tour balanced", () => {
    // An unbalanced body silently loses all its emphasis, which is the kind of
    // thing nobody notices until the card is on screen.
    for (const step of TOUR_STEPS) {
      const count = (step.body.match(/\*\*/g) || []).length;
      expect(count % 2, step.id).toBe(0);
      if (count > 0) {
        expect(emphasise(step.body).some((r) => r.strong), step.id).toBe(true);
      }
    }
  });

  it("emphasises something in every step, since that is what gets scanned", () => {
    for (const step of TOUR_STEPS) {
      expect(emphasise(step.body).some((r) => r.strong), step.id).toBe(true);
    }
  });
});
