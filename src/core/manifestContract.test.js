import { describe, expect, it } from "vitest";
import { WIDGETS, defaultOptions } from "../widgets/registry";

// The widget manifest contract, checked against every widget rather than one.
//
// The clock has had its own manifest test for a while and it caught real
// mistakes — an option shown in a mode where it did nothing, an enum choice
// with no label. None of that was ever checked for the other twenty-two, and
// the same mistakes were sitting in three of them: Air quality, Calendar and
// Currency all wrote `labels` as an array, and the settings drawer reads
// `labels[choice]`, so an array answers undefined for a string key and the
// picker printed the raw enum value. The Air quality index picker offered "us"
// and "european" instead of "US AQI" and "European".
//
// Silent, because the fallback is a real string. Nothing crashes, nothing
// looks empty, and the only way to notice is to open that one drawer and read
// it. Exactly the kind of thing a contract test is for.

// What a `showIf` key may name besides one of the widget's own options. Must
// stay in step with WidgetSettingsDrawer's `environment`.
const ENVIRONMENT = ["tileHeader", "cols", "rows", "tall", "wide", "narrow", "roomy"];

describe("every widget's manifest", () => {
  it("is worth checking", () => {
    // A guard on the guard: an empty catalog would pass everything below.
    expect(WIDGETS.length).toBeGreaterThan(20);
  });

  for (const widget of WIDGETS) {
    describe(widget.name, () => {
      it("gives every option a key and a label", () => {
        for (const o of widget.options) {
          expect(o.key, JSON.stringify(o)).toBeTruthy();
          expect(o.label, o.key).toBeTruthy();
        }
      });

      it("keys enum labels by choice, not by position", () => {
        for (const o of widget.options.filter((x) => x.type === "enum")) {
          expect(Array.isArray(o.labels), `${o.key}.labels is an array`).toBe(false);
          for (const choice of o.of) {
            expect(o.labels?.[choice], `${o.key}.${choice} has no label`).toBeTruthy();
          }
        }
      });

      it("defaults every enum to one of its own choices", () => {
        for (const o of widget.options.filter((x) => x.type === "enum")) {
          expect(o.of.length, o.key).toBeGreaterThan(1);
          expect(o.of, o.key).toContain(o.default);
        }
      });

      it("keeps every number option's default inside its own range", () => {
        for (const o of widget.options.filter((x) => x.type === "number")) {
          expect(o.default, o.key).toBeGreaterThanOrEqual(o.min);
          expect(o.default, o.key).toBeLessThanOrEqual(o.max);
        }
      });

      it("only lets showIf name an option or a known environment key", () => {
        // A key that is neither is a condition that is never satisfied, which
        // hides the option for good — and looks exactly like an option that
        // was never added.
        const keys = widget.options.map((o) => o.key);
        for (const o of widget.options.filter((x) => x.showIf)) {
          for (const key of Object.keys(o.showIf)) {
            expect(
              keys.includes(key) || ENVIRONMENT.includes(key),
              `${widget.id}.${o.key} showIf names "${key}"`
            ).toBe(true);
          }
        }
      });

      it("offers its own default size", () => {
        const has = widget.sizes.some(
          (s) => s[0] === widget.defaultSize[0] && s[1] === widget.defaultSize[1]
        );
        expect(has, `${widget.defaultSize} is not in sizes`).toBe(true);
      });

      it("declares sizes as pairs of positive spans that fit the grid", () => {
        for (const size of widget.sizes) {
          expect(size, JSON.stringify(size)).toHaveLength(2);
          expect(size[0]).toBeGreaterThan(0);
          expect(size[0]).toBeLessThanOrEqual(12);
          expect(size[1]).toBeGreaterThan(0);
        }
      });

      it("has no duplicate sizes", () => {
        const seen = widget.sizes.map((s) => s.join("x"));
        expect(new Set(seen).size, seen.join(" ")).toBe(seen.length);
      });

      it("resolves a complete set of option defaults", () => {
        // What a freshly added widget renders with. An option whose default is
        // undefined reaches the widget as undefined and every `?:` on it takes
        // the wrong branch.
        const defaults = defaultOptions(widget.id);
        for (const o of widget.options) {
          expect(defaults[o.key], `${widget.id}.${o.key}`).not.toBeUndefined();
        }
      });

      it("gives every action an id and a label", () => {
        for (const a of widget.actions) {
          expect(a.id, JSON.stringify(a)).toBeTruthy();
          expect(a.label, a.id).toBeTruthy();
        }
      });

      it("has a plain three-part version", () => {
        expect(widget.version, widget.id).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });
  }
});
