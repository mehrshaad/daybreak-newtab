import { describe, expect, it } from "vitest";
import { browserLabel, issueBody, issueTitle, issueUrl, ISSUES_URL } from "./report";

const crash = () => {
  const error = new Error("Cannot read properties of undefined (reading 'city')");
  error.stack = ["Error: boom", ...Array.from({ length: 40 }, (_, i) => `    at frame${i} (x.js:${i}:1)`)].join("\n");
  return error;
};

describe("issueTitle", () => {
  it("leads with where it happened", () => {
    expect(issueTitle(crash(), "Weather")).toMatch(/^Weather: Cannot read properties/);
  });

  it("works without a location", () => {
    expect(issueTitle(crash())).toMatch(/^Cannot read properties/);
  });

  it("stays short enough to read in a list", () => {
    const long = new Error("x".repeat(400));
    expect(issueTitle(long, "Weather").length).toBeLessThanOrEqual(120);
  });

  it("takes only the first line", () => {
    expect(issueTitle(new Error("first line\nsecond line"))).toBe("first line");
  });

  it("says something even with nothing to go on", () => {
    expect(issueTitle(undefined)).toBe("Unknown error");
  });
});

describe("issueBody", () => {
  const body = () =>
    issueBody({
      error: crash(),
      componentStack: "\n    at Weather\n    at ErrorBoundary",
      where: "Weather",
      version: "2.1.0",
      browser: "Chrome 141.0.0.0",
    });

  it("carries the error, the version and the browser", () => {
    const out = body();
    expect(out).toContain("Cannot read properties");
    expect(out).toContain("2.1.0");
    expect(out).toContain("Chrome 141.0.0.0");
    expect(out).toContain("Crashed in: Weather");
  });

  it("trims a long stack rather than pasting forty frames", () => {
    const out = body();
    expect(out).toContain("at frame0");
    expect(out).toMatch(/… \d+ more/);
    expect(out).not.toContain("at frame39");
  });

  it("leaves a place for the person to say what they were doing", () => {
    expect(body()).toContain("What I was doing");
  });

  it("says nothing came from the board", () => {
    // The promise made on the error screen has to be true in the issue too.
    expect(body()).toContain("nothing from your board");
  });
});

describe("issueUrl", () => {
  it("points at this repo's new-issue form", () => {
    expect(issueUrl({ error: crash() })).toMatch(
      new RegExp(`^${ISSUES_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/new\\?title=`)
    );
  });

  it("stays inside a length a browser will actually open", () => {
    // A URL cut off by the browser produces an issue with half a sentence in
    // it, so the body is trimmed here rather than left to be truncated.
    const huge = new Error("boom");
    huge.stack = Array.from({ length: 4000 }, (_, i) => `    at deep${i} (some/very/long/path.js:${i}:1)`).join("\n");
    const url = issueUrl({
      error: huge,
      componentStack: Array.from({ length: 2000 }, (_, i) => `    at Component${i}`).join("\n"),
      where: "Weather",
    });
    expect(url.length).toBeLessThan(14000);
    expect(url).toContain("boom");
  });

  it("never carries anything but the crash", () => {
    // The guard that matters. A report quietly carrying somebody's notes or
    // their links into a public tracker would be a worse bug than the crash.
    const error = crash();
    const url = decodeURIComponent(issueUrl({ error, where: "Scratchpad" }));
    for (const secret of ["daybreak2", "localStorage", "chrome.storage", "config", "apiKey"]) {
      expect(url.toLowerCase(), secret).not.toContain(secret.toLowerCase());
    }
  });

  it("copes with being handed nothing", () => {
    expect(() => issueUrl()).not.toThrow();
    expect(issueUrl()).toContain("Unknown%20error");
  });
});

describe("browserLabel", () => {
  it("reports just the Chrome version", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.65 Safari/537.36";
    expect(browserLabel(ua)).toBe("Chrome 141.0.7390.65");
  });

  it("says nothing rather than guessing", () => {
    expect(browserLabel("something else entirely")).toBe("");
    expect(browserLabel("")).toBe("");
  });

  it("leaves the platform out of it", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.65 Safari/537.36";
    expect(browserLabel(ua)).not.toContain("Windows");
  });
});
