import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENTS } from "./tokens";

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
const POLICY = "privacy-policy.html";

// Spelled out, because that is how the listing and the README write it — the
// store's description field is prose, not a spec sheet.
const NUMBER_WORDS = [
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
];
const ACCENT_NUMBER = NUMBER_WORDS[ACCENTS.length - 6];
const ACCENT_WORD = `${ACCENT_NUMBER} accent`;

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
    expect(src).toContain("TWENTY-THREE WIDGETS");
    // The numbers this replaced, so a stale heading cannot come back quietly.
    expect(src).not.toContain("SEVENTEEN WIDGETS");
    expect(src).not.toContain("TWENTY-TWO WIDGETS");
  });
});

describe("the permissions the docs list", () => {
  // Same failure as the widget count above, and it had already happened: the
  // README's table said five optional permissions and named five while the
  // manifest asked for six, because `topSites` was added to one and not the
  // other. A permission is the thing a reviewer and a cautious user read most
  // carefully, so an undocumented one is worse than an undocumented widget.
  const OPTIONAL = JSON.parse(readFileSync("public/manifest.json", "utf8"))
    .optional_permissions;

  it("asks for the ones we think it does", () => {
    // A guard on the guard: an empty list would make both checks below vacuous.
    expect(OPTIONAL.length).toBeGreaterThanOrEqual(6);
    expect(OPTIONAL).toContain("clipboardRead");
  });

  it("are every one the manifest asks for, in the README", () => {
    const src = readFileSync(README, "utf8");
    expect(OPTIONAL.filter((p) => !src.includes(`\`${p}\``))).toEqual([]);
  });

  it("are every one the manifest asks for, in the privacy policy", () => {
    // The one that gets an upload rejected rather than commented on. The
    // original submission was refused over the policy link, and a permission
    // the extension asks for and the policy does not mention is the same
    // class of problem with a slower feedback loop.
    const src = readFileSync(POLICY, "utf8");
    expect(OPTIONAL.filter((p) => !src.includes(`<code>${p}</code>`))).toEqual([]);
  });

  it("does not still claim the bookmarks access is read-only", () => {
    // It was, and the Bookmarks widget writes now. A stale "the extension
    // never creates, edits or deletes a bookmark" in a published policy is
    // worse than no sentence at all.
    const src = readFileSync(POLICY, "utf8");
    expect(src).not.toContain("never creates, edits or deletes a bookmark");
    expect(readFileSync(LISTING, "utf8")).not.toContain("Read-only");
  });

  it("has been read again for the version being shipped", () => {
    // The policy carried "Last updated: August 23, 2026" on the day it was
    // rewritten to cover the Bookmarks widget, which writes to a person's
    // bookmarks. A policy that gained a whole new disclosure without moving
    // its own revision date is telling the reader the disclosure was already
    // there, and its closing paragraph promises "an updated revision date".
    //
    // The date alone cannot be checked without asking git when the file last
    // changed, and in CI's shallow clone git cannot answer. The version can:
    // stamping the release the policy was reviewed against means a bump
    // fails here until somebody opens the policy and looks at it, which is
    // the only thing that actually keeps it true.
    const version = JSON.parse(readFileSync("package.json", "utf8")).version;
    const src = readFileSync(POLICY, "utf8");
    expect(src, `privacy-policy.html is not stamped for ${version}`).toContain(
      `reviewed for version ${version}`
    );
  });

  it("are every one the manifest asks for, in the listing's justifications", () => {
    // The Store makes you write one box per permission, and a missing box is a
    // rejected upload rather than a note from the reviewer.
    const src = readFileSync(LISTING, "utf8");
    expect(OPTIONAL.filter((p) => !src.includes(`**${p}** (optional)`))).toEqual([]);
  });
});

describe("the screenshot captions", () => {
  it("do not carry a stale widget count", () => {
    // These are drawn onto the store cards, so a wrong number there is a wrong
    // number on the listing itself.
    const src = readFileSync(CAPTIONS, "utf8").toLowerCase();
    expect(src).toContain("twenty-three widgets");
    expect(src).not.toContain("seventeen widgets");
  });

  it("do not carry a stale accent count", () => {
    // This one had gone wrong in the worst way a guard can: it asserted the
    // literal "fifteen accents" and the sixteenth accent was added without
    // anybody coming back here, so the test was holding three documents at a
    // number the code had already left. A hardcoded expectation is only a
    // guard until the thing it guards moves.
    //
    // Counted from ACCENTS now, so adding a swatch fails every place that
    // prints the number instead of quietly agreeing with the stalest one.
    // Case-insensitive because a caption may open a sentence with it.
    for (const file of [CAPTIONS, README, LISTING]) {
      // Whitespace flattened: these are wrapped prose, and the README happens
      // to break the line between the number and the word it counts.
      const src = readFileSync(file, "utf8").toLowerCase().replace(/\s+/g, " ");
      expect(src, `${file} does not say ${ACCENT_WORD}`).toContain(ACCENT_WORD);
      for (const stale of NUMBER_WORDS.filter((w) => w !== ACCENT_NUMBER)) {
        expect(src, `${file} still says "${stale} accent"`).not.toMatch(
          new RegExp(`${stale} accent`)
        );
      }
    }
  });
});
