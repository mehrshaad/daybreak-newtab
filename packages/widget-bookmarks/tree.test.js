import { describe, expect, it } from "vitest";
import { cap, foldersFrom, selectFolders } from "./tree";

// A bookmarks tree shaped like a real one: the three permanent roots, links
// sitting loose in the bar, folders inside folders, and a folder that holds
// nothing but more folders.
const link = (id, title, url) => ({ id, title, url });
const folder = (id, title, children) => ({ id, title, children });

const TREE = [
  folder("0", "", [
    folder("1", "Bookmarks bar", [
      link("10", "Anthropic", "https://anthropic.com"),
      link("11", "Hacker News", "https://news.ycombinator.com"),
      folder("20", "AI tools", [
        link("21", "Claude", "https://claude.ai"),
        link("22", "Cursor", "https://cursor.com"),
        link("23", "Figma", "https://figma.com"),
      ]),
      // Scaffolding: no links of its own, only a folder under it.
      folder("30", "Work", [
        folder("31", "Runbooks", [link("32", "Deploy", "https://deploy.example.com")]),
      ]),
    ]),
    folder("2", "Other bookmarks", [link("40", "Recipe", "https://example.com/recipe")]),
    folder("3", "Mobile bookmarks", []),
  ]),
];

describe("foldersFrom", () => {
  const folders = foldersFrom(TREE);
  const byId = Object.fromEntries(folders.map((f) => [f.id, f]));

  it("finds every folder that actually holds a link", () => {
    // The bar (two loose links), AI tools (three), Runbooks (one), and Other
    // bookmarks (one). Not Work, which holds only a folder, and not Mobile,
    // which holds nothing.
    expect(folders.map((f) => f.id).sort()).toEqual(["1", "2", "20", "31"]);
  });

  it("leaves out a folder that only holds other folders", () => {
    // "Work" contains one folder and no links. Drawn as a group it would be a
    // heading with nothing under it, which reads as a widget that failed to
    // load. Its child still comes through on its own.
    expect(byId["30"]).toBeUndefined();
    expect(byId["31"]).toBeTruthy();
  });

  it("leaves out an empty root", () => {
    expect(byId["3"]).toBeUndefined();
  });

  it("takes only the links directly inside a folder, not its subfolders'", () => {
    // The bar holds two loose links and two folders. Rolling the descendants
    // up into it would list every bookmark twice.
    expect(byId["1"].links.map((l) => l.id)).toEqual(["10", "11"]);
  });

  it("keeps Chrome's own order", () => {
    expect(byId["31"].links.map((l) => l.title)).toEqual(["Deploy"]);
    expect(foldersFrom(TREE)[0].id).toBe("1");
  });

  it("does not prefix the bookmarks bar into every path", () => {
    // Nearly everything is in the bar, and "Bookmarks bar / " in front of each
    // group is the same three words down the side of the tile.
    expect(byId["1"].path).toBe("Bookmarks bar");
    const tools = foldersFrom([
      folder("0", "", [folder("1", "Bookmarks bar", [folder("20", "AI tools", [link("21", "Claude", "https://claude.ai")])])]),
    ]);
    expect(tools[0].path).toBe("AI tools");
  });

  it("keeps the path of a nested folder, so two of a name are told apart", () => {
    expect(byId["31"].path).toBe("Work / Runbooks");
  });

  it("falls back to the URL where a bookmark has no title", () => {
    const out = foldersFrom([
      folder("0", "", [folder("1", "Bar", [link("9", "", "https://example.com")])]),
    ]);
    expect(out[0].links[0].title).toBe("https://example.com");
  });

  it("survives nothing at all", () => {
    expect(foldersFrom(undefined)).toEqual([]);
    expect(foldersFrom([])).toEqual([]);
    expect(foldersFrom([{ id: "0" }])).toEqual([]);
  });
});

describe("selectFolders", () => {
  const folders = foldersFrom(TREE);

  it("shows every folder when nothing is chosen", () => {
    // What a freshly added widget has to do. The alternative is a new tile
    // that shows nothing until somebody finds its settings.
    expect(selectFolders(folders, {})).toHaveLength(4);
    expect(selectFolders(folders, { selected: [] })).toHaveLength(4);
    expect(selectFolders(folders, { selected: null })).toHaveLength(4);
  });

  it("shows only what was chosen, in the order it was chosen", () => {
    expect(selectFolders(folders, { selected: ["31", "1"] }).map((f) => f.id)).toEqual(["31", "1"]);
  });

  it("ignores a folder that has since been deleted in Chrome", () => {
    expect(selectFolders(folders, { selected: ["1", "999"] }).map((f) => f.id)).toEqual(["1"]);
  });

  it("shows exactly one folder for a card that holds one", () => {
    expect(selectFolders(folders, { folderId: "31" }).map((f) => f.id)).toEqual(["31"]);
  });

  it("lets a single folder win over a stale selection", () => {
    // A card that was split out keeps whatever list it had before. The
    // folderId is the newer, narrower answer.
    expect(selectFolders(folders, { folderId: "31", selected: ["1", "2"] })).toHaveLength(1);
  });

  it("shows nothing where the one folder is gone", () => {
    // Better than falling back to all of them: a card titled "AI TOOLS"
    // suddenly showing every bookmark is worse than one saying it is empty.
    expect(selectFolders(folders, { folderId: "999" })).toEqual([]);
  });
});

describe("cap", () => {
  const links = [1, 2, 3, 4, 5].map((n) => link(String(n), `L${n}`, `https://${n}.example`));

  it("holds back what does not fit and says how many", () => {
    expect(cap(links, 3)).toEqual({ shown: links.slice(0, 3), more: 2 });
  });

  it("holds nothing back when they all fit", () => {
    expect(cap(links, 5)).toEqual({ shown: links, more: 0 });
    expect(cap(links, 9)).toEqual({ shown: links, more: 0 });
  });

  it("treats no limit as no limit, which is what view-all switches to", () => {
    expect(cap(links, 0)).toEqual({ shown: links, more: 0 });
    expect(cap(links, undefined)).toEqual({ shown: links, more: 0 });
  });
});
