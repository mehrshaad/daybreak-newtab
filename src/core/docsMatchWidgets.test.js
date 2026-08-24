import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The README's widget table and the store listing's widget list, checked against
// the packages that actually exist.
//
// Both had drifted, and in the way documentation always does: a number written
// once and then edited around. The README said "six accent colours" when there
// were sixteen, the listing said "SEVENTEEN WIDGETS" and named seventeen when
// there were twenty-two, and the screenshot captions said the same. None of it
// was noticed for two releases, because nothing was checking — a widget gets
// added by creating a package, and no step in that asks you to go and count.
//
// So the count is checked here rather than remembered. Cheap, and it fails at
// the moment the package is added rather than at the moment someone reads the
// listing.

const PACKAGES = "packages";
const README = "README.md";
const LISTING = "store-assets/SUBMISSION.md";
const CAPTIONS = "scripts/store-assets.mjs";

function widgetNames() {
  const out = [];
  for (const dir of readdirSync(PACKAGES)) {
    if (!dir.startsWith("widget-")) continue;
    const src = readFileSync(join(PACKAGES, dir, "manifest.js"), "utf8");
    const name = src.match(/^ {2}name: "(.+?)"/m);
    expect(name, `${dir} has no name in its manifest`).toBeTruthy();
    out.push(name[1]);
  }
  return out.sort();
}

// The rows of the first markdown table whose header is "| Widget |".
function readmeWidgets() {
  const lines = readFileSync(README, "utf8").split("\n");
  const start = lines.findIndex((l) => l.startsWith("| Widget |"));
  expect(start, "no widget table in the README").toBeGreaterThan(-1);
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith("| ")) break;
    rows.push(line.split("|")[1].trim());
  }
  return rows.sort();
}

const NAMES = widgetNames();

describe("the README's widget table", () => {
  it("lists every widget, and only widgets that exist", () => {
    expect(readmeWidgets()).toEqual(NAMES);
  });

  it("says how many there are, correctly", () => {
    const words = {
      17: "Seventeen",
      18: "Eighteen",
      19: "Nineteen",
      20: "Twenty",
      21: "Twenty-one",
      22: "Twenty-two",
      23: "Twenty-three",
      24: "Twenty-four",
    };
    const word = words[NAMES.length];
    expect(word, `no word for ${NAMES.length} widgets — add one`).toBeTruthy();
    expect(readFileSync(README, "utf8")).toContain(`${word} of them`);
  });
});

describe("the store listing", () => {
  it("names every widget in its description", () => {
    // The listing writes them on two lines separated by middots rather than as
    // a table, so this checks each name appears somewhere in the file.
    const src = readFileSync(LISTING, "utf8");
    const missing = NAMES.filter((n) => !src.includes(n));
    expect(missing).toEqual([]);
  });

  it("gets the count right in its heading", () => {
    const src = readFileSync(LISTING, "utf8");
    expect(src).toContain("TWENTY-TWO WIDGETS");
    // The number this replaced, so a stale heading cannot come back quietly.
    expect(src).not.toContain("SEVENTEEN WIDGETS");
  });
});

describe("the screenshot captions", () => {
  it("do not carry a stale widget count", () => {
    // These are drawn onto the store cards, so a wrong number there is a wrong
    // number on the listing itself.
    const src = readFileSync(CAPTIONS, "utf8");
    expect(src).toContain("Twenty-two widgets");
    expect(src).not.toContain("Seventeen widgets");
  });

  it("do not carry a stale accent count", () => {
    const src = readFileSync(CAPTIONS, "utf8");
    expect(src).not.toContain("six accents");
    expect(src).toContain("fifteen accents");
  });
});
