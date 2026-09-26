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

// A story's own summary, as plain text.
//
// Feeds put it in three different places and half of them put HTML in it, so
// this strips tags rather than rendering them: the preview is a paragraph in
// our own type, and a feed's markup is somebody else's stylesheet, their
// tracking pixels and — in a widget that renders it — their script tags.
// Text only, nothing parsed as markup, nothing fetched.
const SUMMARY_MAX = 320;

export function plainSummary(html) {
  const raw = String(html || "");
  if (!raw) return "";
  // A textarea decodes entities without running anything: no elements are
  // created from the markup, so an <img onerror> in a feed is just characters.
  const doc = new DOMParser().parseFromString(raw, "text/html");
  // parseFromString does not execute anything, but textContent still *reads*
  // the source inside <script> and <style> — so a feed with a script tag in
  // its description produced a summary that was somebody's JavaScript. Dropped
  // before the text is taken.
  for (const el of doc.querySelectorAll("script, style, noscript")) el.remove();
  const text = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  if (text.length <= SUMMARY_MAX) return text;
  // Cut on a word rather than mid-syllable.
  const cut = text.slice(0, SUMMARY_MAX);
  const space = cut.lastIndexOf(" ");
  return `${(space > 200 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

// A story's picture, if the feed offers one.
//
// Three conventions and no standard: media:thumbnail, media:content, and an
// enclosure whose type says image. The first <img> inside the description is
// deliberately *not* used — it is as often a tracking pixel or a share button
// as a photograph, and there is no way to tell from the markup.
//
// https only. An http image on an https page is blocked anyway, and asking for
// one announces the visit over the wire in clear.
export function imageFrom(el) {
  // Matched on localName rather than with a selector. The note at the top of
  // this file is true for Atom's default namespace but not for a prefixed one:
  // `querySelector("thumbnail")` does not find <media:thumbnail>, whose tag
  // name is the whole "media:thumbnail". Walking the children and comparing
  // localName needs no namespace API and no escaping.
  const candidates = [];
  for (const node of el.children) {
    // Trailing the colon off as well. A feed that uses media: without
    // declaring the namespace is malformed, and plenty are — the parser then
    // reports the whole "media:thumbnail" as the local name.
    const name = node.localName.replace(/^.*:/, "");
    const url = node.getAttribute("url");
    if (!url) continue;
    if (name === "thumbnail") candidates.push(url);
    else if (name === "content" && node.getAttribute("medium") === "image") candidates.push(url);
    else if (name === "enclosure" && (node.getAttribute("type") || "").startsWith("image/")) {
      candidates.push(url);
    }
  }
  for (const url of candidates) {
    if (typeof url === "string" && /^https:\/\//i.test(url)) return url;
  }
  return "";
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
        summary: plainSummary(text(el, "description") || text(el, "encoded")),
        image: imageFrom(el),
      }))
      .filter((e) => e.title && e.url);
  }

  const entries = [...doc.querySelectorAll("entry")];
  return entries
    .map((el) => ({
      title: text(el, "title"),
      url: atomLink(el),
      date: text(el, "updated") || text(el, "published"),
      summary: plainSummary(text(el, "summary") || text(el, "content")),
      image: imageFrom(el),
    }))
    .filter((e) => e.title && e.url);
}
