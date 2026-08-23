import { describe, expect, it } from "vitest";
import {
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

  it("groups its scenes rather than flitting between them", () => {
    // Every scene change is a drawer opening or the board changing mode, and
    // doing that twice for the same scene means the tour bounced out of it and
    // back. The board is the exception: it is where the tour starts and ends.
    const changes = TOUR_STEPS.filter((s, i) => i === 0 || s.scene !== TOUR_STEPS[i - 1].scene);
    const visits = {};
    for (const step of changes) visits[step.scene] = (visits[step.scene] || 0) + 1;
    for (const [scene, count] of Object.entries(visits)) {
      expect(count, scene).toBeLessThanOrEqual(scene === "board" ? 2 : 1);
    }
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
      "export",
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
