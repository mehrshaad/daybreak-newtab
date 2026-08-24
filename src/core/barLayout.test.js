import { describe, expect, it } from "vitest";
import {
  BAR_TIERS,
  barTier,
  HERO_HINTS_MIN,
  PROFILE_NAME_MIN,
  profileShowsName,
  searchWidth,
  showHeroHints,
} from "./barLayout";

describe("barTier", () => {
  it("keeps everything on a wide window", () => {
    expect(barTier(1920)).toMatchObject({ labels: true, clock: true, wordmark: true });
  });

  it("sheds detail in one direction only", () => {
    // Whatever the width, going narrower can never bring a piece of chrome
    // back — that would read as the bar rearranging itself at random.
    const widths = [1920, 1400, 1180, 1000, 900, 800, 680, 600, 420, 0];
    const seen = widths.map(barTier);
    for (let i = 1; i < seen.length; i++) {
      for (const key of ["labels", "clock", "wordmark"]) {
        if (!seen[i - 1][key]) expect(seen[i][key], `${key} at ${widths[i]}`).toBe(false);
      }
    }
  });

  it("always matches a tier, however small", () => {
    for (const width of [0, 1, 320, 5000]) expect(barTier(width)).toBeTruthy();
  });

  it("drops the labels before the wordmark", () => {
    // The order matters: two buttons can be recognised by position, but with
    // the wordmark gone the bar stops saying what it is at all.
    const first = BAR_TIERS.findIndex((t) => !t.labels);
    const later = BAR_TIERS.findIndex((t) => !t.wordmark);
    expect(first).toBeLessThan(later);
  });
});

describe("searchWidth", () => {
  it("widens on focus and narrows when the bar shrinks", () => {
    expect(searchWidth(1920, { active: true, scrolled: false })).toBe(640);
    expect(searchWidth(1920, { active: false, scrolled: false })).toBe(560);
    expect(searchWidth(1920, { active: false, scrolled: true })).toBe(440);
  });

  it("never asks for room the window does not have", () => {
    for (const width of [1200, 1000, 900, 800, 700, 600, 500, 420, 360]) {
      const w = searchWidth(width, { active: true, scrolled: false });
      expect(w, `${width}px`).toBeLessThanOrEqual(width);
    }
  });

  it("stays wide enough to type in on the narrowest window", () => {
    expect(searchWidth(320, { active: true, scrolled: false })).toBe(180);
  });
});

describe("showHeroHints", () => {
  it("keeps them on a roomy window", () => {
    expect(showHeroHints(1440)).toBe(true);
    expect(showHeroHints(HERO_HINTS_MIN)).toBe(true);
  });

  it("drops them before they can wrap under the greeting", () => {
    // The wrap happens around 740 on the default name; the threshold sits above
    // it so a longer name does not sneak past.
    expect(showHeroHints(HERO_HINTS_MIN - 1)).toBe(false);
    expect(showHeroHints(740)).toBe(false);
    expect(showHeroHints(360)).toBe(false);
  });

  it("is decided by the room available, not the window", () => {
    // A 400px settings drawer over a 1100px window leaves 700, which is under
    // the threshold even though the window is not — which is the case that
    // showed the hints wrapped with a drawer open.
    expect(showHeroHints(1100)).toBe(true);
    expect(showHeroHints(1100 - 400)).toBe(false);
  });
});

describe("profileShowsName", () => {
  it("keeps the name where the group has room", () => {
    expect(profileShowsName(300, { labels: true })).toBe(true);
    expect(profileShowsName(PROFILE_NAME_MIN, { labels: true })).toBe(true);
  });

  it("drops to the emoji when the group is squeezed", () => {
    // The chip's column is minmax(0, 1fr), so it does not push anything aside —
    // it gets squeezed and the name inside truncates. A chip reading "M…" is a
    // stub where a label used to be; the emoji still says which board you are
    // on and asks for a third of the room.
    expect(profileShowsName(PROFILE_NAME_MIN - 1, { labels: true })).toBe(false);
    expect(profileShowsName(60, { labels: true })).toBe(false);
  });

  it("still follows the bar tier when labels are off entirely", () => {
    // Below the widest tier the bar sheds labels anyway, and the chip goes with
    // them however much room its own group happens to have.
    expect(profileShowsName(900, { labels: false })).toBe(false);
  });

  it("assumes room before the first measurement", () => {
    // A ResizeObserver has not reported yet on the first paint. Showing the
    // name and dropping it a frame later is better than the reverse, which
    // would flash the emoji on every load.
    expect(profileShowsName(null, { labels: true })).toBe(true);
    expect(profileShowsName(null, { labels: false })).toBe(false);
  });
});
