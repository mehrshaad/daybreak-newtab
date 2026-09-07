import { describe, expect, it } from "vitest";
import {
  LOOSE,
  dissolveFolder,
  folderNames,
  groupLinks,
  renameFolder,
  selectGroup,
} from "./folders";

const link = (id, name, folder) => ({ id, name, url: `https://${id}.example`, folder });

const ITEMS = [
  link("a", "GitHub"),
  link("b", "Claude", "AI"),
  link("c", "Figma", "Design"),
  link("d", "Cursor", "AI"),
  link("e", "YouTube"),
];

describe("folderNames", () => {
  it("lists each folder once, in the order its first link appears", () => {
    // Not alphabetical: the grid's groups should follow the order the links
    // were arranged in, which is an order somebody chose.
    expect(folderNames(ITEMS)).toEqual(["AI", "Design"]);
  });

  it("ignores blank and whitespace-only folders", () => {
    expect(folderNames([link("a", "A", ""), link("b", "B", "   ")])).toEqual([]);
  });

  it("survives nothing", () => {
    expect(folderNames(undefined)).toEqual([]);
    expect(folderNames([])).toEqual([]);
  });
});

describe("groupLinks", () => {
  it("puts the loose links first, under no heading", () => {
    const groups = groupLinks(ITEMS);
    expect(groups[0].name).toBe("");
    expect(groups[0].links.map((l) => l.id)).toEqual(["a", "e"]);
  });

  it("groups the rest by folder", () => {
    const groups = groupLinks(ITEMS);
    expect(groups.map((g) => g.name)).toEqual(["", "AI", "Design"]);
    expect(groups[1].links.map((l) => l.id)).toEqual(["b", "d"]);
  });

  it("is one unheaded group where nobody has used folders", () => {
    // The case that has to be exactly what it was before folders existed. Any
    // board that has never touched them must render identically.
    const plain = [link("a", "A"), link("b", "B")];
    expect(groupLinks(plain)).toEqual([{ name: "", links: plain }]);
  });

  it("has no empty first group when every link is filed", () => {
    const filed = [link("a", "A", "One"), link("b", "B", "Two")];
    expect(groupLinks(filed).map((g) => g.name)).toEqual(["One", "Two"]);
  });

  it("survives nothing", () => {
    expect(groupLinks(undefined)).toEqual([]);
    expect(groupLinks([])).toEqual([]);
  });
});

describe("selectGroup", () => {
  const groups = groupLinks(ITEMS);

  it("shows all of them when no folder is named", () => {
    expect(selectGroup(groups, null)).toHaveLength(3);
    expect(selectGroup(groups, undefined)).toHaveLength(3);
  });

  it("shows the one named", () => {
    expect(selectGroup(groups, "AI").map((g) => g.name)).toEqual(["AI"]);
  });

  it("shows the loose links for the ungrouped card", () => {
    // Which is why this takes a sentinel rather than "": an empty folder name
    // is a real group here, and treating it as "nothing chosen" would make the
    // ungrouped card show everything.
    expect(selectGroup(groups, LOOSE).map((g) => g.links.map((l) => l.id))).toEqual([["a", "e"]]);
  });

  it("shows nothing where the folder is gone", () => {
    expect(selectGroup(groups, "Deleted")).toEqual([]);
  });
});

describe("renameFolder", () => {
  it("renames it on every link in it, and nothing else", () => {
    const out = renameFolder(ITEMS, "AI", "AI & research");
    expect(out.filter((l) => l.folder === "AI & research").map((l) => l.id)).toEqual(["b", "d"]);
    expect(out.find((l) => l.id === "c").folder).toBe("Design");
    expect(out.find((l) => l.id === "a").folder).toBeUndefined();
  });

  it("empties the folder rather than setting it to a blank string of spaces", () => {
    expect(renameFolder(ITEMS, "AI", "   ").find((l) => l.id === "b").folder).toBe("");
  });
});

describe("dissolveFolder", () => {
  it("frees the links instead of deleting them", () => {
    // The only reading of "remove this folder" that cannot lose anything. A
    // folder here is a name on a link, so there is nothing else to remove.
    const out = dissolveFolder(ITEMS, "AI");
    expect(out).toHaveLength(ITEMS.length);
    expect(folderNames(out)).toEqual(["Design"]);
    expect(groupLinks(out)[0].links.map((l) => l.id)).toEqual(["a", "b", "d", "e"]);
  });

  it("leaves the other folders alone", () => {
    expect(dissolveFolder(ITEMS, "AI").find((l) => l.id === "c").folder).toBe("Design");
  });
});
