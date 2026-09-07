import { describe, expect, it } from "vitest";
import {
  FEEDBACK_EMAIL,
  ISSUES_URL,
  MESSAGE_MAX,
  bugUrl,
  feedbackBody,
  feedbackMailto,
  feedbackSubject,
} from "./contact";

const FACTS = { version: "2.2.0", browser: "Chrome 141.0.0.0" };

describe("the feedback body", () => {
  it("leads with what the person wrote", () => {
    expect(feedbackBody("the clock could be bigger", FACTS)).toMatch(
      /^the clock could be bigger/
    );
  });

  it("adds the version and the browser, because nobody thinks to", () => {
    const body = feedbackBody("hello", FACTS);
    expect(body).toContain("Version: 2.2.0");
    expect(body).toContain("Browser: Chrome 141.0.0.0");
  });

  it("says nothing when there is nothing to say", () => {
    // No build stamp on the dev server, and an empty "Version:" line reads as
    // a bug in the report itself.
    expect(feedbackBody("hello", { version: "", browser: "" })).toBe("hello");
  });

  it("cuts an over-long message rather than letting the client cut it", () => {
    const body = feedbackBody("x".repeat(MESSAGE_MAX + 500), FACTS);
    expect(body.match(/x+/)[0].length).toBe(MESSAGE_MAX);
  });

  it("carries nothing but the message and those two facts", () => {
    // The rule the crash report follows, for the same reason: this leaves the
    // machine. If anything else ever ends up in here, this is where it shows.
    const body = feedbackBody("hello", FACTS);
    const lines = body.split("\n").filter((l) => l && l !== "---");
    expect(lines).toEqual(["hello", "Version: 2.2.0", "Browser: Chrome 141.0.0.0"]);
  });
});

describe("the mailto", () => {
  it("goes to the right mailbox with a subject that says what it is", () => {
    const url = feedbackMailto("hello", FACTS);
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(decodeURIComponent(new URL(url).search)).toContain(feedbackSubject());
  });

  it("encodes the parts a mail client would otherwise eat", () => {
    // A bare newline or ampersand in a mailto body truncates it at that
    // character in some handlers, which loses the second half of the message.
    const url = feedbackMailto("one\ntwo & three", FACTS);
    expect(url).not.toMatch(/\n/);
    expect(url.split("&body=")[1]).not.toContain("&");
  });

  it("stays inside what a mail handler will take, even at full length", () => {
    // Windows' handler gives up somewhere near 2000 characters. Percent
    // encoding roughly triples a newline, so the cap has to be checked against
    // the encoded length, not the typed one.
    const url = feedbackMailto("x".repeat(MESSAGE_MAX), FACTS);
    expect(url.length).toBeLessThan(2000);
  });
});

describe("the bug link", () => {
  it("opens a new issue on the repository", () => {
    expect(bugUrl(FACTS).startsWith(`${ISSUES_URL}/new?`)).toBe(true);
  });

  it("prefills the three questions that make a bug reproducible", () => {
    const body = decodeURIComponent(bugUrl(FACTS).split("body=")[1]);
    expect(body).toContain("What happened");
    expect(body).toContain("What I expected");
    expect(body).toContain("How to make it happen again");
    expect(body).toContain("- Version: 2.2.0");
  });
});
