import { describe, expect, it } from "vitest";
import {
  SOURCES,
  gatherSuggestions,
  hostOf,
  mergeSuggestions,
  suggestLinks,
} from "./suggest";

const links = [
  { id: "1", name: "GitHub", url: "https://github.com" },
  { id: "2", name: "Gmail", url: "https://mail.google.com" },
  { id: "3", name: "Linear", url: "https://linear.app" },
];

describe("SOURCES", () => {
  it("only quick links is permission-free", () => {
    expect(SOURCES.find((s) => s.key === "links").permission).toBeNull();
    for (const key of ["tabs", "bookmarks", "history"]) {
      expect(SOURCES.find((s) => s.key === key).permission).toBe(key);
    }
  });
});

describe("hostOf", () => {
  it("strips the scheme and www", () => {
    expect(hostOf("https://www.github.com/x")).toBe("github.com");
    expect(hostOf("https://mail.google.com")).toBe("mail.google.com");
  });

  it("is blank for junk rather than throwing", () => {
    expect(hostOf("not a url")).toBe("");
    expect(hostOf(undefined)).toBe("");
  });
});

describe("suggestLinks", () => {
  it("matches on name", () => {
    expect(suggestLinks("git", links).map((s) => s.title)).toEqual(["GitHub"]);
  });

  it("matches on host, not just name", () => {
    expect(suggestLinks("linear.app", links).map((s) => s.title)).toEqual(["Linear"]);
  });

  it("is case-insensitive", () => {
    expect(suggestLinks("GMAIL", links)).toHaveLength(1);
  });

  it("returns nothing for an empty query", () => {
    expect(suggestLinks("", links)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(suggestLinks("http", links, 2)).toHaveLength(2);
  });
});

describe("mergeSuggestions", () => {
  it("keeps source order", () => {
    const merged = mergeSuggestions([
      [{ id: "a", kind: "links", url: "https://a.com" }],
      [{ id: "b", kind: "tabs", url: "https://b.com" }],
    ]);
    expect(merged.map((m) => m.kind)).toEqual(["links", "tabs"]);
  });

  // A page that is bookmarked and also in history should appear once, credited
  // to the earlier (more meaningful) source.
  it("dedupes the same destination across sources", () => {
    const merged = mergeSuggestions([
      [{ id: "bm", kind: "bookmarks", url: "https://same.com" }],
      [{ id: "h", kind: "history", url: "https://same.com" }],
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].kind).toBe("bookmarks");
  });

  it("does not dedupe tabs, which have no url key", () => {
    const merged = mergeSuggestions([
      [
        { id: "t1", kind: "tabs", tabId: 1 },
        { id: "t2", kind: "tabs", tabId: 2 },
      ],
    ]);
    expect(merged).toHaveLength(2);
  });

  it("honours the overall limit", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `x${i}`,
      kind: "history",
      url: `https://x${i}.com`,
    }));
    expect(mergeSuggestions([many], 5)).toHaveLength(5);
  });
});

describe("gatherSuggestions", () => {
  it("stays quiet for a one-character query", async () => {
    expect(await gatherSuggestions({ query: "g", links, enabled: { links: true } })).toEqual(
      []
    );
  });

  it("returns only sources that are switched on", async () => {
    const out = await gatherSuggestions({
      query: "git",
      links,
      enabled: { links: true, tabs: true },
    });
    // chrome.* is absent in tests, so the tab source resolves empty and only
    // the permission-free source contributes.
    expect(out.every((s) => s.kind === "links")).toBe(true);
    expect(out).toHaveLength(1);
  });

  it("returns nothing when every source is off", async () => {
    expect(await gatherSuggestions({ query: "git", links, enabled: {} })).toEqual([]);
  });
});
