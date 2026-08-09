// Parses RSS 2.0 <item> and Atom <entry> elements. querySelectorAll matches
// by local name even inside Atom's default xmlns, so no namespace-aware
// query API is needed for either format.
const text = (el, selector) => el.querySelector(selector)?.textContent?.trim() || "";

// An Atom entry can carry several <link> elements (self, alternate, ...);
// the one worth following is rel="alternate", or unmarked — per the Atom
// spec an omitted rel defaults to "alternate".
function atomLink(entry) {
  const links = [...entry.querySelectorAll("link")];
  const alt = links.find((l) => {
    const rel = l.getAttribute("rel");
    return !rel || rel === "alternate";
  });
  return (alt || links[0])?.getAttribute("href") || "";
}

export function parseFeed(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, "text/xml");
  if (doc.querySelector("parsererror")) return [];

  const items = [...doc.querySelectorAll("item")];
  if (items.length) {
    return items
      .map((el) => ({
        title: text(el, "title"),
        url: text(el, "link"),
        date: text(el, "pubDate"),
      }))
      .filter((e) => e.title && e.url);
  }

  const entries = [...doc.querySelectorAll("entry")];
  return entries
    .map((el) => ({
      title: text(el, "title"),
      url: atomLink(el),
      date: text(el, "updated") || text(el, "published"),
    }))
    .filter((e) => e.title && e.url);
}
