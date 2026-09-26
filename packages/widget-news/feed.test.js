import { describe, expect, it } from "vitest";
import { imageFrom, parseFeed, plainSummary } from "./feed";

const RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>First post</title>
      <link>https://example.com/1</link>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second post</title>
      <link>https://example.com/2</link>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Feed</title>
  <entry>
    <title>First entry</title>
    <link rel="self" href="https://example.com/feed/1" />
    <link href="https://example.com/1" />
    <updated>2024-01-01T00:00:00Z</updated>
  </entry>
  <entry>
    <title>Second entry</title>
    <link rel="alternate" href="https://example.com/2" />
    <published>2024-01-02T00:00:00Z</published>
  </entry>
</feed>`;

describe("parseFeed", () => {
  it("parses RSS 2.0 items", () => {
    expect(parseFeed(RSS)).toMatchObject([
      { title: "First post", url: "https://example.com/1", date: "Mon, 01 Jan 2024 00:00:00 GMT" },
      {
        title: "Second post",
        url: "https://example.com/2",
        date: "Tue, 02 Jan 2024 00:00:00 GMT",
      },
    ]);
  });

  it("parses Atom entries, preferring the alternate link over self", () => {
    const out = parseFeed(ATOM);
    expect(out).toMatchObject([
      { title: "First entry", url: "https://example.com/1", date: "2024-01-01T00:00:00Z" },
      { title: "Second entry", url: "https://example.com/2", date: "2024-01-02T00:00:00Z" },
    ]);
  });

  it("falls back to published when an Atom entry has no updated date", () => {
    expect(parseFeed(ATOM)[1].date).toBe("2024-01-02T00:00:00Z");
  });

  it("drops an item or entry with no title or no link", () => {
    const partial = `<rss><channel>
      <item><title>Has both</title><link>https://x.com</link></item>
      <item><title>No link</title></item>
      <item><link>https://x.com/no-title</link></item>
    </channel></rss>`;
    expect(parseFeed(partial)).toMatchObject([
      { title: "Has both", url: "https://x.com", date: "" },
    ]);
  });

  it("is empty for malformed XML rather than throwing", () => {
    expect(parseFeed("<rss><channel><item><title>Unclosed")).toEqual([]);
  });

  it("is empty for a feed with neither RSS items nor Atom entries", () => {
    expect(parseFeed("<rss><channel><title>Empty</title></channel></rss>")).toEqual([]);
  });
});

describe("a story's summary", () => {
  // Feeds put HTML in the description, and a widget that rendered it would be
  // rendering somebody else's markup: their stylesheet, their tracking pixels
  // and their script tags. The preview is a paragraph in our own type, so this
  // takes the words and nothing else.

  it("takes the text out of the markup", () => {
    expect(plainSummary("<p>A <b>short</b> piece.</p>")).toBe("A short piece.");
  });

  it("does not run anything it finds", () => {
    // The whole point. An onerror in a feed has to be characters, not a
    // handler, and nothing in here may cause a request.
    const nasty = '<img src=x onerror="window.__pwned = 1"><script>window.__pwned = 1</script>ok';
    expect(plainSummary(nasty)).toBe("ok");
    expect(window.__pwned).toBeUndefined();
  });

  it("decodes entities", () => {
    expect(plainSummary("Ben &amp; Jerry&rsquo;s")).toBe("Ben & Jerry\u2019s");
  });

  it("collapses the whitespace a feed wraps its description in", () => {
    expect(plainSummary("  one\n\n  two   three ")).toBe("one two three");
  });

  it("cuts long text on a word, with an ellipsis", () => {
    const long = `${"word ".repeat(200)}end`;
    const out = plainSummary(long);
    expect(out.length).toBeLessThan(340);
    expect(out.endsWith("\u2026")).toBe(true);
    expect(out).not.toMatch(/wo\u2026$/);
  });

  it("is empty for nothing, rather than the string undefined", () => {
    expect(plainSummary(undefined)).toBe("");
    expect(plainSummary("")).toBe("");
  });
});

describe("a story's picture", () => {
  // The namespace has to be declared or the document is a parse error, which
  // is what a real feed does and what the first draft of this fixture did not.
  const NS = 'xmlns:media="http://search.yahoo.com/mrss/"';
  const item = (inner) =>
    new DOMParser().parseFromString(`<item ${NS}>${inner}</item>`, "text/xml").documentElement;

  it("comes from media:thumbnail", () => {
    expect(imageFrom(item('<media:thumbnail url="https://cdn.example/a.jpg"/>'))).toBe(
      "https://cdn.example/a.jpg"
    );
  });

  it("comes from an image enclosure", () => {
    expect(
      imageFrom(item('<enclosure url="https://cdn.example/b.png" type="image/png"/>'))
    ).toBe("https://cdn.example/b.png");
  });

  it("ignores an enclosure that is not an image", () => {
    // Podcast feeds enclose audio, and a 40MB mp3 in an <img> is not a photo.
    expect(
      imageFrom(item('<enclosure url="https://cdn.example/c.mp3" type="audio/mpeg"/>'))
    ).toBe("");
  });

  it("refuses http", () => {
    // Blocked on an https page anyway, and asking for it announces the visit
    // over the wire in clear.
    expect(imageFrom(item('<media:thumbnail url="http://cdn.example/d.jpg"/>'))).toBe("");
  });

  it("does not go looking inside the description", () => {
    // The first <img> in a description is as often a tracking pixel or a share
    // button as a photograph, and the markup does not say which.
    const withPixel = item("<description>&lt;img src=&quot;https://t.example/px.gif&quot;&gt;</description>");
    expect(imageFrom(withPixel)).toBe("");
  });

  it("is empty when the feed offers nothing", () => {
    expect(imageFrom(item("<title>No picture</title>"))).toBe("");
  });
});
