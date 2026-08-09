import { describe, expect, it } from "vitest";
import { hnDiscussionUrl, parseHnItem } from "./hn";

describe("parseHnItem", () => {
  it("maps a regular story", () => {
    expect(
      parseHnItem({
        id: 1,
        title: "Y Combinator",
        url: "http://ycombinator.com",
        score: 57,
        descendants: 3,
      })
    ).toEqual({
      id: 1,
      title: "Y Combinator",
      url: "http://ycombinator.com",
      points: 57,
      comments: 3,
    });
  });

  it("sends a self-post (no url) to its discussion page instead", () => {
    const out = parseHnItem({ id: 42, title: "Ask HN: anything", score: 10 });
    expect(out.url).toBe(hnDiscussionUrl(42));
  });

  it("defaults missing points and comments to zero, not undefined", () => {
    const out = parseHnItem({ id: 1, title: "x", url: "https://x.com" });
    expect(out.points).toBe(0);
    expect(out.comments).toBe(0);
  });

  it("is null for an item with no id or no title (a deleted/dead item)", () => {
    expect(parseHnItem({ title: "x" })).toBeNull();
    expect(parseHnItem({ id: 1 })).toBeNull();
    expect(parseHnItem(null)).toBeNull();
  });
});
