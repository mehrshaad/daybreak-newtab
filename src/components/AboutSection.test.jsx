import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutSection from "./AboutSection";
import { AUTHOR_FULL, PROFILES, profileLinks } from "../core/contact";

// The portrait, and the reason it needs more than an onLoad handler.
//
// A cached image has already fired `load` by the time React attaches its
// handler, so onLoad never runs and the photo sits at opacity 0 behind the
// emoji for ever. On a new tab page that is every tab after the first — the
// case that matters most — and it is exactly what happened on the board:
// naturalWidth 256, complete true, opacity 0.

const portrait = () => document.querySelector('img[src*="author"]');

// jsdom never actually loads anything, so `complete` and `naturalWidth` are
// what a real cached image would report and are set directly.
function asCached({ width = 256 } = {}) {
  for (const prop of ["complete", "naturalWidth"]) {
    Object.defineProperty(window.HTMLImageElement.prototype, prop, {
      configurable: true,
      get() {
        return prop === "complete" ? true : width;
      },
    });
  }
}

function asPending() {
  Object.defineProperty(window.HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => false,
  });
}

describe("the portrait", () => {
  it("shows a cached photo without waiting for an onLoad that already fired", () => {
    asCached();
    render(<AboutSection />);
    expect(portrait().style.opacity).toBe("1");
  });

  it("still shows one that loads normally", () => {
    asPending();
    render(<AboutSection />);
    expect(portrait().style.opacity).toBe("0");
    fireEvent.load(portrait());
    expect(portrait().style.opacity).toBe("1");
  });

  it("falls back to the emoji when the file is not there", () => {
    // Rather than leaving the browser's torn-page icon in a settings panel.
    asPending();
    render(<AboutSection />);
    fireEvent.error(portrait());
    expect(portrait()).toBeNull();
  });

  it("treats a cached image with no pixels as a failure", () => {
    // complete + naturalWidth 0 is how a broken image reports itself, and
    // taking `complete` alone as success would show an empty square.
    asCached({ width: 0 });
    render(<AboutSection />);
    expect(portrait()).toBeNull();
  });
});

describe("the byline", () => {
  it("names the person", () => {
    asPending();
    render(<AboutSection />);
    expect(screen.getByText(AUTHOR_FULL)).toBeTruthy();
  });

  it("links every profile that has an address, and no others", () => {
    asPending();
    render(<AboutSection />);
    for (const p of profileLinks()) {
      expect(screen.getByLabelText(p.label).getAttribute("href")).toBe(p.url);
    }
    for (const p of PROFILES.filter((x) => !x.url)) {
      expect(screen.queryByLabelText(p.label), p.label).toBeNull();
    }
  });

  it("opens them in a new tab, safely", () => {
    asPending();
    render(<AboutSection />);
    const link = screen.getByLabelText("GitHub");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});
