import { describe, expect, it } from "vitest";
import { onThisDayUrl, parseEvents, todayKey } from "./onthisday";

describe("todayKey", () => {
  it("zero-pads single-digit month and day", () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe("01-05");
  });

  it("does not pad a double-digit month or day", () => {
    expect(todayKey(new Date(2026, 10, 23))).toBe("11-23");
  });
});

describe("onThisDayUrl", () => {
  it("builds the events path for the given date", () => {
    expect(onThisDayUrl(new Date(2026, 7, 7))).toBe(
      "https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/08/07"
    );
  });

  it("only ever targets en.wikipedia.org, never api.wikimedia.org", () => {
    expect(onThisDayUrl(new Date())).toMatch(/^https:\/\/en\.wikipedia\.org\//);
  });
});

describe("parseEvents", () => {
  const data = {
    events: [
      {
        year: 2020,
        text: "Something happened.",
        pages: [{ content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Something" } } }],
      },
      { year: 1969, text: "Something else, no linked page.", pages: [] },
    ],
  };

  it("carries year, text and the first page's link", () => {
    expect(parseEvents(data)).toEqual([
      { year: 2020, text: "Something happened.", url: "https://en.wikipedia.org/wiki/Something" },
      { year: 1969, text: "Something else, no linked page.", url: null },
    ]);
  });

  it("respects the limit", () => {
    expect(parseEvents(data, 1)).toHaveLength(1);
  });

  it("is empty for a malformed payload", () => {
    expect(parseEvents({})).toEqual([]);
    expect(parseEvents(null)).toEqual([]);
  });
});
