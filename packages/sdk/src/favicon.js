// Real site icons for search suggestions and quick links, via Chrome's own
// favicon cache — not a request to the site. `chrome.runtime.getURL("/_favicon/")`
// is an extension-local endpoint that reads whatever Chrome already cached for
// that page, so nothing is fetched over the network just to show an icon, and a
// site that was never visited simply returns Chrome's default globe.
//
// Requires the optional "favicon" permission and the "_favicon/*" web
// accessible resource — both declared in public/manifest.json. Outside the
// packaged extension (the dev server) there is no chrome.runtime, so callers
// must fall back when this returns null.
export function faviconUrl(pageUrl, size = 32) {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return null;
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", String(size));
  return url.toString();
}
