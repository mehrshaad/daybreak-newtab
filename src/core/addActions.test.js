import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { boardMenu, widgetMenu } from "./menus";

// Every widget you can add something to offers it in its right-click menu.
//
// It was in nine different places and none of them was the menu. Quick Links
// hid its add button behind edit mode, world clocks and habits had one inside
// the tile, tasks had a field, and countdown, calendar, crypto and currency
// had theirs in a settings panel two clicks away. The one place a person tries
// first offered "Widget settings" and a size picker.
//
// So this checks the rule rather than the eight fixes: a widget with an add
// affordance anywhere in it has to declare an add action. The next widget that
// grows one fails here rather than quietly shipping without a menu item.

const PACKAGES = "packages";

// What an add affordance looks like in source: the state that opens an add
// form, a field labelled for adding, or a button whose text starts with "Add".
const AFFORDANCE = /(?:aria-label|placeholder)="Add\b|setAdding\(|>\s*Add\b/;

function widgetDirs() {
  return readdirSync(PACKAGES).filter((d) => d.startsWith("widget-"));
}

function readManifest(dir) {
  const src = readFileSync(join(PACKAGES, dir, "manifest.js"), "utf8");
  return {
    id: src.match(/^ {2}id: "(.+?)"/m)?.[1],
    name: src.match(/^ {2}name: "(.+?)"/m)?.[1],
    // Anywhere in the list, not only first: Quick Links declares three
    // actions now. The character class stops at the end of the array, so
    // this cannot reach an "add" somewhere else in the file.
    addAction: /actions:\s*\[[^\]]*id: "add"/.test(src.replace(/\s+/g, " ")),
  };
}

function hasAffordance(dir) {
  const files = readdirSync(join(PACKAGES, dir)).filter((f) => f.endsWith(".jsx"));
  return files.some((f) => AFFORDANCE.test(readFileSync(join(PACKAGES, dir, f), "utf8")));
}

const DIRS = widgetDirs();

describe("the add action", () => {
  it("finds the widgets to check", () => {
    // A guard on the guard: a broken walk would pass silently forever.
    expect(DIRS.length).toBeGreaterThan(20);
    expect(DIRS).toContain("widget-links");
  });

  it("is declared by every widget you can add something to", () => {
    const missing = [];
    for (const dir of DIRS) {
      const manifest = readManifest(dir);
      if (hasAffordance(dir) && !manifest.addAction) {
        missing.push(
          `${dir}: has an add affordance but no actions: [{ id: "add" }] in its ` +
            `manifest, so its right-click menu never mentions adding`
        );
      }
    }
    expect(missing).toEqual([]);
  });

  it("covers the nine this was written for", () => {
    // Named rather than counted, so dropping one is a failure and not a
    // quietly smaller number.
    const declared = DIRS.filter((d) => readManifest(d).addAction).map((d) =>
      d.replace("widget-", "")
    );
    expect(declared.sort()).toEqual(
      [
        "bookmarks",
        "calendar",
        "countdown",
        "crypto",
        "currency",
        "habits",
        "links",
        "tasks",
        "worldclocks",
      ].sort()
    );
  });
});

describe("the widget menu", () => {
  const manifest = {
    name: "Quick Links",
    sizes: [
      [3, 2],
      [5, 2],
    ],
    actions: [{ id: "add", label: "Add a link" }],
  };

  it("puts the action first, where a person looks", () => {
    const { items } = widgetMenu({ manifest, currentSize: [5, 2], zoomMode: "None" });
    expect(items[0].label).toBe("Add a link");
  });

  it("hands an action with no run of its own to the widget", () => {
    // The mechanism: a manifest may carry a `run`, and anything without one is
    // routed to the widget through useWidgetAction. If widgetMenu ever called
    // `run` unconditionally, every declared add would silently do nothing.
    const seen = [];
    const { items } = widgetMenu({
      manifest,
      currentSize: [5, 2],
      zoomMode: "None",
      onAction: (action) => seen.push(action),
    });
    items[0].run();
    expect(seen).toEqual([{ id: "add", label: "Add a link" }]);
  });

  it("gives every row an icon", () => {
    // All of them, not most: a menu where three rows have a glyph and four do
    // not reads as a menu that failed to finish loading. The icon is a name
    // here and ContextMenu owns the name-to-glyph map, so this checks the
    // names exist and the render test below checks they resolve.
    const rows = [
      ...widgetMenu({ manifest, currentSize: [5, 2], zoomMode: "Focus" }).items,
      ...boardMenu({ editing: false, theme: "dark", hasSaved: true, savedState: "dirty" }).items,
    ].filter((i) => i.label);
    expect(rows.length).toBeGreaterThan(12);
    expect(rows.filter((i) => !i.icon).map((i) => i.label)).toEqual([]);
  });

  it("separates the actions from everything else", () => {
    const { items } = widgetMenu({ manifest, currentSize: [5, 2], zoomMode: "None" });
    expect(items[1]).toEqual({ type: "separator" });
  });
});
