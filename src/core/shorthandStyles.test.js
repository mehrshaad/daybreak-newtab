import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Two source checks, both of which earned their place by catching a real bug
// the hard way — the same bug twice, in different clothes.
//
// React sets and clears inline style properties one at a time. When it removes
// a longhand it had added, the overlapping shorthand from underneath goes with
// it. So a base of `border: 1px solid var(--line)` with a hover of
// `borderColor:` leaves the control with NO border once the pointer has been
// and gone, and a base of `overflowY: "auto"` with `overflow: "visible"` in a
// drag spread leaves the container with no overflow at all once the drag ends.
//
// Both were reported as something else entirely — "why is there a border
// around some of them" (the ones the mouse had crossed) and a list that quietly
// stopped scrolling. Neither is visible until the state has flipped back, which
// is what makes them expensive to find and cheap to check for here.

const ROOTS = ["src", "packages"];

const SHORTHANDS = {
  overflowY: "overflow",
  overflowX: "overflow",
  borderColor: "border",
  borderWidth: "border",
  borderStyle: "border",
  backgroundColor: "background",
  backgroundImage: "background",
};

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.jsx?$/.test(name) && !name.includes(".test.")) out.push(path);
  }
  return out;
}

// Whether a block declares a property. Deliberately string work rather than a
// built regex: an earlier version of this file used a template literal for the
// pattern, where `\b` is a backspace character and `\s` is the letter s, so the
// check silently matched nothing and the guard passed while the bug it was
// written for sat two files away. Verified now by injecting that bug and
// watching this fail.
function declares(block, prop) {
  let from = 0;
  for (;;) {
    const at = block.indexOf(prop, from);
    if (at === -1) return false;
    const before = at === 0 ? " " : block[at - 1];
    const isWordChar = /[A-Za-z0-9_$]/.test(before);
    const followedByColon = /^ *:/.test(block.slice(at + prop.length));
    if (!isWordChar && followedByColon) return true;
    from = at + 1;
  }
}

// The text of a braced expression starting at `open`, balanced.
function braced(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return source.slice(open);
}

// Every `style={{ ... }}` in a file, including the conditional spreads inside
// it — which is where the shorthand and the longhand end up on opposite sides
// of a ternary and stop looking like a pair.
function styleBlocks(source) {
  const out = [];
  for (const match of source.matchAll(/style=\{\{/g)) {
    out.push(braced(source, match.index + "style={".length));
  }
  return out;
}

// Every hover style: the `hover={...}` prop and the `X_HOVER = {...}` consts.
function hoverBlocks(source) {
  const out = [];
  for (const match of source.matchAll(/hover=\{|const\s+\w*HOVER\w*\s*=\s*\{/g)) {
    out.push(braced(source, match.index + match[0].length - 1));
  }
  return out;
}

const FILES = ROOTS.flatMap((root) => sourceFiles(root));

describe("inline styles", () => {
  it("finds the files to check", () => {
    // A guard on the guards: a broken walk would pass silently forever.
    expect(FILES.length).toBeGreaterThan(40);
    expect(FILES.some((f) => f.includes("IconGrid"))).toBe(true);
  });

  it("can actually tell a declaration from a mention", () => {
    // And a guard on `declares`, which is the part that was quietly broken.
    expect(declares('{ overflowY: "auto" }', "overflowY")).toBe(true);
    expect(declares("{ overflow: draggingId ? x : y }", "overflow")).toBe(true);
    expect(declares('{ overflowY: "auto" }', "overflow")).toBe(false);
    expect(declares("// overflow is handled above", "overflow")).toBe(false);
    expect(declares("{ scrollOverflow: 1 }", "overflow")).toBe(false);
  });

  it("never sets a longhand and its shorthand in one style", () => {
    const offenders = [];
    for (const file of FILES) {
      for (const block of styleBlocks(readFileSync(file, "utf8"))) {
        for (const [longhand, shorthand] of Object.entries(SHORTHANDS)) {
          if (declares(block, longhand) && declares(block, shorthand)) {
            offenders.push(
              `${file}: sets both "${longhand}" and "${shorthand}" in one style — ` +
                `compute a single ${shorthand} instead`
            );
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never puts a longhand in a hover whose base uses the shorthand", () => {
    const offenders = [];
    for (const file of FILES) {
      for (const block of hoverBlocks(readFileSync(file, "utf8"))) {
        for (const [longhand, shorthand] of Object.entries(SHORTHANDS)) {
          if (!declares(block, longhand)) continue;
          offenders.push(
            `${file}: hover sets "${longhand}"; write "${shorthand}" instead — ` +
              `${block.replace(/\s+/g, " ").slice(0, 90)}`
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
