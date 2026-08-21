import { answerFor } from "./answers";
// Search suggestions, gathered from whatever the user has allowed.
//
// Quick links are free — they are already in settings. Open tabs, bookmarks and
// history each need an optional Chrome permission, requested only when the user
// turns that source on, so a fresh install asks for nothing.

export const SOURCES = [
  { key: "links", label: "Quick links", permission: null },
  { key: "tabs", label: "Open tabs", permission: "tabs" },
  { key: "bookmarks", label: "Bookmarks", permission: "bookmarks" },
  { key: "history", label: "History", permission: "history" },
];

export const SOURCE_ORDER = SOURCES.map((s) => s.key);

const has = (api) => typeof chrome !== "undefined" && !!chrome[api];

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Strips the scheme, a leading "www.", the hash and a trailing slash, so two
// URLs that point at the same page (one from history, one from a bookmark)
// compare equal for deduping regardless of which exact form each source
// happened to store.
export function normaliseUrl(url) {
  if (!url) return "";
  return url
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/#.*$/, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

const LOCALHOST = "localhost";
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
// The bare host at the front of the string, with an optional port and path.
const HOST_SHAPE = /^([a-z0-9-]+(?:\.[a-z0-9-]+)*)(:\d+)?(\/.*)?$/i;

// True for text that reads as an address rather than a search phrase —
// "github.com", "localhost:3000", "192.168.1.1/admin" — so the search box can
// offer "Go to site" ahead of searching for it. A query with a space is never
// a host; a single word with no dot ("weather") is a search term, not one.
export function looksLikeUrl(query) {
  const q = (query || "").trim();
  if (!q || /\s/.test(q)) return false;
  const withoutScheme = q.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const match = HOST_SHAPE.exec(withoutScheme);
  if (!match) return false;
  const host = match[1].toLowerCase();
  if (host === LOCALHOST) return true;
  if (IPV4.test(host)) return true;
  if (!host.includes(".")) return false;
  // "3.14" has the same two-label shape as a hostname; a real TLD is never
  // purely numeric.
  return !/^\d+$/.test(host.split(".").pop());
}

// The synthetic row offered when the query itself looks like a destination,
// rather than something to search for.
export function goToSiteSuggestion(query) {
  const q = (query || "").trim();
  if (!looksLikeUrl(q)) return null;
  const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(q) ? q : `https://${q}`;
  return { kind: "go", id: `go:${q}`, title: q, subtitle: "Go to site", url };
}

const matches = (query, ...fields) => {
  const q = query.toLowerCase();
  return fields.filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
};

// Quick links come straight from settings; no async, no permission.
export function suggestLinks(query, items, limit = 4) {
  if (!query) return [];
  return (items || [])
    .filter((l) => matches(query, l.name, l.url, hostOf(l.url)))
    .slice(0, limit)
    .map((l) => ({
      kind: "links",
      id: `link:${l.id}`,
      title: l.name,
      subtitle: hostOf(l.url),
      url: l.url,
    }));
}

export function suggestTabs(query, limit = 4) {
  if (!query || !has("tabs")) return Promise.resolve([]);
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(
        (tabs || [])
          .filter((t) => !t.active && matches(query, t.title, t.url))
          .slice(0, limit)
          .map((t) => ({
            kind: "tabs",
            id: `tab:${t.id}`,
            title: t.title || t.url,
            subtitle: hostOf(t.url),
            // Switching to a tab is not a navigation, so it carries the ids
            // rather than a url. faviconUrl is separate from url so the
            // no-dedup, no-navigation behaviour above is untouched — it only
            // feeds the icon.
            tabId: t.id,
            windowId: t.windowId,
            faviconUrl: t.url,
          }))
      );
    });
  });
}

export function suggestBookmarks(query, limit = 4) {
  if (!query || !has("bookmarks")) return Promise.resolve([]);
  return new Promise((resolve) => {
    chrome.bookmarks.search(query, (found) => {
      resolve(
        (found || [])
          .filter((b) => b.url)
          .slice(0, limit)
          .map((b) => ({
            kind: "bookmarks",
            id: `bm:${b.id}`,
            title: b.title || hostOf(b.url),
            subtitle: hostOf(b.url),
            url: b.url,
          }))
      );
    });
  });
}

export function suggestHistory(query, limit = 4) {
  if (!query || !has("history")) return Promise.resolve([]);
  return new Promise((resolve) => {
    chrome.history.search({ text: query, maxResults: limit * 3 }, (found) => {
      const seen = new Set();
      const out = [];
      for (const h of found || []) {
        if (!h.url) continue;
        // History is noisy: one entry per page, deduped by url.
        if (seen.has(h.url)) continue;
        seen.add(h.url);
        out.push({
          kind: "history",
          id: `hist:${h.id || h.url}`,
          title: h.title || hostOf(h.url),
          subtitle: hostOf(h.url),
          url: h.url,
        });
        if (out.length >= limit) break;
      }
      resolve(out);
    });
  });
}

// Merge results in source order and drop duplicate destinations, so a page that
// is both bookmarked and in history appears once, under the better source.
// Compared via normaliseUrl rather than the raw url, so the same page saved as
// a bookmark and visited via a slightly different form (a trailing slash, a
// www.) still collapses to one row.
export function mergeSuggestions(groups, limit = 8) {
  const out = [];
  const seen = new Set();
  for (const group of groups) {
    for (const item of group) {
      const key = item.url ? `u:${normaliseUrl(item.url)}` : item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// How well a suggestion matches what was typed: a host match beats a title
// match, and a prefix beats a mid-string hit — "gmail.com" for "gm" should not
// lose to some unrelated page whose title merely contains "gm" partway through.
function matchRank(query, item) {
  const q = query.toLowerCase();
  const host = (item.subtitle || "").toLowerCase();
  const title = (item.title || "").toLowerCase();
  if (host.startsWith(q)) return 0;
  if (title.startsWith(q)) return 1;
  if (host.includes(q)) return 2;
  if (title.includes(q)) return 3;
  return 4;
}

// Ties within a rank fall back to kind (open tabs beat bookmarks beat
// history), then to each source's own order — which is already recency for
// history, since chrome.history.search returns most-recently-visited first.
const KIND_RANK = { links: 0, tabs: 1, bookmarks: 2, history: 3 };

export function rankSuggestions(query, items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const byMatch = matchRank(query, a.item) - matchRank(query, b.item);
      if (byMatch) return byMatch;
      const byKind = (KIND_RANK[a.item.kind] ?? 9) - (KIND_RANK[b.item.kind] ?? 9);
      if (byKind) return byKind;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export async function gatherSuggestions({ query, links, enabled, limit = 8 }) {
  const q = (query || "").trim();
  if (q.length < 2) return [];
  const on = (key) => enabled?.[key];
  const groups = await Promise.all([
    on("links") ? suggestLinks(q, links) : [],
    on("tabs") ? suggestTabs(q) : [],
    on("bookmarks") ? suggestBookmarks(q) : [],
    on("history") ? suggestHistory(q) : [],
  ]);
  // Deduped over a wider pool than the final list, so a strong match from a
  // lower-priority source is not cut before ranking ever sees it.
  const merged = mergeSuggestions(groups, limit * 2);
  const goTo = goToSiteSuggestion(q);
  // An answer goes first, above even "Go to site": if what was typed evaluates
  // to something, that is what the person wanted, and answerFor is deliberately
  // conservative about saying so (see core/answers.js) precisely because a false
  // positive here would hijack a real search.
  const answer = answerFor(q);
  const fixed = [
    ...(answer
      ? [{ kind: "answer", id: `answer:${q}`, title: answer.display, subtitle: answer.detail }]
      : []),
    ...(goTo ? [goTo] : []),
  ];
  const ranked = rankSuggestions(q, merged)
    // A bookmark or history hit for exactly the address just typed would
    // otherwise repeat the "Go to site" row a moment later.
    .filter((item) => !goTo || normaliseUrl(item.url) !== normaliseUrl(goTo.url))
    .slice(0, Math.max(0, limit - fixed.length));
  return [...fixed, ...ranked];
}
