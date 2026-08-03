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
            // rather than a url.
            tabId: t.id,
            windowId: t.windowId,
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
export function mergeSuggestions(groups, limit = 8) {
  const out = [];
  const seen = new Set();
  for (const group of groups) {
    for (const item of group) {
      const key = item.url ? `u:${item.url}` : item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
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
  return mergeSuggestions(groups, limit);
}
