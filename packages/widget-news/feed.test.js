import { describe, expect, it } from "vitest";
import { parseFeed } from "./feed";

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
    expect(parseFeed(RSS)).toEqual([
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
    expect(out).toEqual([
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
    expect(parseFeed(partial)).toEqual([
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
