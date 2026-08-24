import { describe, expect, it } from "vitest";
import {
  SOURCES,
  gatherSuggestions,
  goToSiteSuggestion,
  hostOf,
  looksLikeUrl,
  mergeSuggestions,
  normaliseUrl,
  rankSuggestions,
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

describe("normaliseUrl", () => {
  it("drops the scheme, www, hash and a trailing slash", () => {
    expect(normaliseUrl("https://www.github.com/")).toBe("github.com");
    expect(normaliseUrl("http://github.com")).toBe("github.com");
  });

  it("treats different forms of the same page as equal", () => {
    expect(normaliseUrl("https://www.example.com/path#section")).toBe(
      normaliseUrl("http://example.com/path")
    );
  });

  it("is case-insensitive", () => {
    expect(normaliseUrl("https://Example.com/Path")).toBe("example.com/path");
  });

  it("is blank for a missing url", () => {
    expect(normaliseUrl("")).toBe("");
    expect(normaliseUrl(undefined)).toBe("");
  });
});

describe("looksLikeUrl", () => {
  it("accepts a bare domain", () => {
    expect(looksLikeUrl("github.com")).toBe(true);
    expect(looksLikeUrl("sub.domain.co.uk")).toBe(true);
  });

  it("accepts a domain with a port or a path", () => {
    expect(looksLikeUrl("github.com:8080")).toBe(true);
    expect(looksLikeUrl("github.com/mehrshaad/daybreak")).toBe(true);
  });

  it("accepts localhost and a dotted IP", () => {
    expect(looksLikeUrl("localhost")).toBe(true);
    expect(looksLikeUrl("localhost:3000")).toBe(true);
    expect(looksLikeUrl("192.168.1.1")).toBe(true);
  });

  it("accepts a url that already has a scheme", () => {
    expect(looksLikeUrl("https://github.com")).toBe(true);
  });

  it("rejects a search phrase", () => {
    expect(looksLikeUrl("react hooks")).toBe(false);
    expect(looksLikeUrl("weather")).toBe(false);
  });

  it("rejects a plain decimal number", () => {
    // Same two-label shape as a hostname, but no real TLD is purely numeric.
    expect(looksLikeUrl("3.14")).toBe(false);
  });

  it("is false for empty input", () => {
    expect(looksLikeUrl("")).toBe(false);
    expect(looksLikeUrl("   ")).toBe(false);
  });
});

describe("goToSiteSuggestion", () => {
  it("builds a row that navigates to the typed address", () => {
    const s = goToSiteSuggestion("github.com");
    expect(s.kind).toBe("go");
    expect(s.url).toBe("https://github.com");
    expect(s.title).toBe("github.com");
  });

  it("keeps a scheme the user already typed", () => {
    expect(goToSiteSuggestion("http://example.com").url).toBe("http://example.com");
  });

  it("is null for a search phrase", () => {
    expect(goToSiteSuggestion("react hooks")).toBeNull();
  });
});

describe("rankSuggestions", () => {
  it("ranks a host prefix match above a mid-title match", () => {
    const items = [
      { id: "a", kind: "history", title: "Some page about gmail", subtitle: "example.com" },
      { id: "b", kind: "history", title: "Gmail", subtitle: "gmail.com" },
    ];
    expect(rankSuggestions("gmail", items).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("ranks a title prefix above a host substring match", () => {
    const items = [
      { id: "a", kind: "history", title: "Random", subtitle: "mygmail.com" },
      { id: "b", kind: "history", title: "Gmail inbox", subtitle: "example.com" },
    ];
    expect(rankSuggestions("gmail", items).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("breaks a tie in match quality by kind: tabs, then bookmarks, then history", () => {
    const items = [
      { id: "h", kind: "history", title: "Gmail", subtitle: "gmail.com" },
      { id: "b", kind: "bookmarks", title: "Gmail", subtitle: "gmail.com" },
      { id: "t", kind: "tabs", title: "Gmail", subtitle: "gmail.com" },
    ];
    expect(rankSuggestions("gmail", items).map((i) => i.id)).toEqual(["t", "b", "h"]);
  });

  it("keeps a source's own order as the final tiebreaker", () => {
    // Same rank, same kind: order is untouched — which is recency for
    // history, since the source itself already returns most-recent-first.
    const items = [
      { id: "recent", kind: "history", title: "Gmail one", subtitle: "gmail.com" },
      { id: "older", kind: "history", title: "Gmail two", subtitle: "gmail.com" },
    ];
    expect(rankSuggestions("gmail", items).map((i) => i.id)).toEqual(["recent", "older"]);
  });

  it("does not add or drop items", () => {
    const items = [
      { id: "a", kind: "history", title: "A", subtitle: "a.com" },
      { id: "b", kind: "tabs", title: "B", subtitle: "b.com" },
    ];
    expect(rankSuggestions("x", items)).toHaveLength(2);
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

describe("the answers toggle", () => {
  const ask = (enabled) => gatherSuggestions({ query: "12 * 12", links: [], enabled });

  it("answers by default", async () => {
    const items = await ask({ links: true });
    expect(items[0]).toMatchObject({ kind: "answer" });
  });

  it("keeps answering for anyone whose settings predate the toggle", async () => {
    // A stored suggest object from before the setting existed has no key for
    // it. Treating that as off would take the feature away from everyone who
    // already had it, which is why the check is for an explicit false.
    const items = await ask({ links: true, tabs: false });
    expect(items[0]).toMatchObject({ kind: "answer" });
  });

  it("stops when it is explicitly turned off", async () => {
    const items = await ask({ links: true, answers: false });
    expect(items.some((i) => i.kind === "answer")).toBe(false);
  });

  it("leaves the rest of the box alone when it is off", async () => {
    // Turning answers off must not cost the "Go to site" row, which is the
    // other thing the box puts above the ranked results.
    const items = await gatherSuggestions({
      query: "example.com",
      links: [],
      enabled: { links: true, answers: false },
    });
    expect(items[0]).toMatchObject({ kind: "go" });
  });
});
