import { describe, expect, it, vi } from "vitest";
import { clipboardLink, readClipboardLink } from "./clipboardLink";

describe("clipboardLink", () => {
  it("takes a full address as it is", () => {
    expect(clipboardLink("https://github.com/anthropics")).toBe(
      "https://github.com/anthropics"
    );
  });

  it("takes a bare host, the way the add field does", () => {
    expect(clipboardLink("github.com")).toBe("https://github.com/");
  });

  it("keeps the query and the fragment", () => {
    // Half the reason for copying a URL is what comes after the host.
    expect(clipboardLink("https://x.com/search?q=daybreak#top")).toBe(
      "https://x.com/search?q=daybreak#top"
    );
  });

  it("ignores whitespace around it", () => {
    expect(clipboardLink("  https://example.com  ")).toBe("https://example.com/");
  });

  it("keeps localhost, which has no dot", () => {
    expect(clipboardLink("http://localhost:5173/")).toBe("http://localhost:5173/");
  });

  describe("refuses", () => {
    it("a sentence that merely contains a domain", () => {
      // The clipboard is mostly not links. Prefilling a field from prose is
      // worse than leaving it empty, because the person then submits it.
      expect(clipboardLink("have a look at github.com tomorrow")).toBe("");
    });

    it("a bare word, which is a note and not a host", () => {
      expect(clipboardLink("todo")).toBe("");
      expect(clipboardLink("Groceries")).toBe("");
    });

    it("nothing at all", () => {
      expect(clipboardLink("")).toBe("");
      expect(clipboardLink(null)).toBe("");
      expect(clipboardLink(undefined)).toBe("");
    });

    it("a javascript: URL, which would be a script in an href", () => {
      // The one that actually matters. A tile's icon is an anchor, and an
      // anchor with a javascript: href runs it on click.
      expect(clipboardLink("javascript:alert(document.cookie)")).toBe("");
      expect(clipboardLink("JavaScript:alert(1)")).toBe("");
    });

    it("the other schemes a tile cannot open", () => {
      expect(clipboardLink("mailto:someone@example.com")).toBe("");
      expect(clipboardLink("file:///C:/Users/notes.txt")).toBe("");
      expect(clipboardLink("data:text/html,<h1>hi</h1>")).toBe("");
      expect(clipboardLink("chrome://settings")).toBe("");
    });

    it("a whole document", () => {
      expect(clipboardLink(`https://example.com/${"x".repeat(2100)}`)).toBe("");
    });
  });
});

describe("readClipboardLink", () => {
  it("gives back the link on the clipboard", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { readText: () => Promise.resolve("https://example.com/a") },
    });
    await expect(readClipboardLink()).resolves.toBe("https://example.com/a");
    vi.unstubAllGlobals();
  });

  it("gives back nothing when the read is refused", async () => {
    // The permission was declined, or the document is not focused, or the
    // clipboard holds an image. All of them leave the form as it was.
    vi.stubGlobal("navigator", {
      clipboard: {
        readText: () => Promise.reject(new Error("NotAllowedError")),
      },
    });
    await expect(readClipboardLink()).resolves.toBe("");
    vi.unstubAllGlobals();
  });

  it("gives back nothing where there is no clipboard API at all", async () => {
    vi.stubGlobal("navigator", {});
    await expect(readClipboardLink()).resolves.toBe("");
    vi.unstubAllGlobals();
  });
});
