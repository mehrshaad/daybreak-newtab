import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A source check, not a unit test, and it earns its place by having caught a
// real bug the hard way.
//
// Button applies `{...base, ...(hovered ? hover : null)}`. React sets and
// clears style properties one at a time, so when the pointer leaves and it
// removes a longhand the hover added, the overlapping shorthand from the base
// goes with it. A control whose base says `border: 1px solid var(--line)` and
// whose hover says `borderColor: ...` therefore ends up with *no* border once
// the pointer has been and gone, and falls back to the browser's own black
// button border.
//
// It only shows after the first hover, so it looks like some controls being
// wrong and others fine, which is a miserable thing to track down: it was
// reported as "why is there a border around some of them?" about the
// background swatches, and the answer was the four the mouse had crossed.
//
// The rule is simply to write the same form the base uses. Cheaper to check
// here than to find again.

const ROOTS = ["src", "packages"];
const SHORTHANDS = {
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

// The text of every `hover={...}` prop and every `const X_HOVER = {...}`, which
// between them are how hover styles are written in this codebase.
function hoverStyles(source) {
  const found = [];
  const starts = [...source.matchAll(/hover=\{|const\s+\w*HOVER\w*\s*=\s*\{/g)];
  for (const match of starts) {
    let i = match.index + match[0].length - 1;
    let depth = 0;
    for (; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    found.push(source.slice(match.index, i + 1));
  }
  return found;
}

describe("hover styles", () => {
  const files = ROOTS.flatMap((root) => sourceFiles(root));

  it("finds the files to check", () => {
    // A guard on the guard: a broken walk would pass silently forever.
    expect(files.length).toBeGreaterThan(40);
    expect(files.some((f) => f.includes("Button"))).toBe(true);
  });

  it("never mixes a longhand into a hover whose base uses the shorthand", () => {
    const offenders = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const block of hoverStyles(source)) {
        for (const [longhand, shorthand] of Object.entries(SHORTHANDS)) {
          if (!new RegExp(`\\b${longhand}\\s*:`).test(block)) continue;
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
