import { describe, expect, it } from "vitest";
import manifest from "./manifest";
import { DIAL_DATES, dialDatePlacement, dialDateText } from "./faces/dialDate";

const option = (key) => manifest.options.find((o) => o.key === key);

describe("the clock's options", () => {
  it("has no option that cannot change anything", () => {
    // Every option here has at one point been shown in a mode where it did
    // nothing: the face picker with tile labels off, the alignment on a dial,
    // 24-hour time on a dial. An option that is visible and inert is worse
    // than a missing one, because it reads as broken.
    for (const o of manifest.options) {
      expect(o.key, JSON.stringify(o)).toBeTruthy();
      expect(o.label, o.key).toBeTruthy();
      if (o.type === "enum") {
        expect(o.of.length, o.key).toBeGreaterThan(1);
        for (const choice of o.of) expect(o.labels?.[choice], `${o.key}.${choice}`).toBeTruthy();
        expect(o.of, o.key).toContain(o.default);
      }
    }
  });

  it("gives the face picker up when there is no tile header", () => {
    // Without a header the dial is drawn to the tile's own rectangle rather
    // than to a shape inscribed in it, so Squared and Round render exactly the
    // same thing. Reported as "the squared and round face are the same when
    // the widget labels are hidden".
    expect(option("face").showIf).toEqual({ analog: true, tileHeader: true });
  });

  it("keeps the digital-only options to the digital face", () => {
    for (const key of ["textSize", "align", "hour24"]) {
      expect(option(key).showIf, key).toEqual({ analog: false });
    }
  });

  it("keeps the dial-only options to the analog face", () => {
    for (const key of ["dialDate", "accentFace"]) {
      const o = option(key);
      if (!o) continue;
      expect(o.showIf, key).toEqual({ analog: true });
    }
  });
});

describe("the date option", () => {
  it("is one control covering all three answers", () => {
    // Whether to show the date and how much of it are one decision. They used
    // to be two, and the switch that overrode the choice sat three rows below
    // it.
    const o = option("dateForm");
    expect(o.of).toEqual(["full", "day", "none"]);
    expect(o.default).toBe("full");
  });

  it("shows in both modes, since both have a date", () => {
    expect(option("dateForm").showIf).toBeUndefined();
  });

  it("has replaced the two options it absorbed", () => {
    // "Hide the date" is inside it now, and "Date in the dial" is gone because
    // on a dial the date is always on the dial.
    expect(option("hideDate")).toBeUndefined();
    expect(option("dialDate")).toBeUndefined();
  });
});

describe("dialDateText", () => {
  const date = new Date(2026, 7, 23); // Sunday 23 August 2026

  it("gives the bare numeral for the short form", () => {
    expect(dialDateText(date, "day")).toBe("23");
  });

  it("gives weekday, day and month for the full one", () => {
    const full = dialDateText(date, "full");
    expect(full).toMatch(/23/);
    // Short forms throughout: a dial is a small place, so nothing spelled out.
    expect(full).not.toMatch(/Sunday|August/);
    expect(full.length).toBeLessThan(16);
  });

  it("falls back to the full form for anything unexpected", () => {
    // Old configs, hand-edited configs, and the "none" case never reaches here.
    expect(dialDateText(date, undefined)).toBe(dialDateText(date, "full"));
    expect(dialDateText(date, "nonsense")).toBe(dialDateText(date, "full"));
  });

  it("offers the forms the manifest does, minus the one that draws nothing", () => {
    expect([...DIAL_DATES].sort()).toEqual(
      option("dateForm")
        .of.filter((v) => v !== "none")
        .sort()
    );
  });
});

describe("dialDatePlacement", () => {
  const window = { x: 74, y: 78 };

  it("keeps each face's own date window for the numeral", () => {
    // The round and squared faces put their window in different places, and
    // both clear the hour hand where they are.
    expect(dialDatePlacement("day", window)).toMatchObject(window);
  });

  it("centres the full date instead, because it will not fit a corner", () => {
    const full = dialDatePlacement("full", window);
    expect(full.x).toBe(50);
    expect(full.fontSize).toBeLessThan(dialDatePlacement("day", window).fontSize);
  });

  it("keeps the full date inside the dial", () => {
    // 100x100 viewBox, dial radius about 46 from the centre. The longest thing
    // this ever prints, at the size it prints it, has to fit across that.
    const { x, fontSize } = dialDatePlacement("full", window);
    const longest = "Wed, Sep 30".length;
    // Half an em per character is generous for a short-form date.
    const halfWidth = (longest * fontSize * 0.5) / 2;
    expect(x - halfWidth).toBeGreaterThan(4);
    expect(x + halfWidth).toBeLessThan(96);
  });

  it("drops the full date below the hub, clear of the hour hand", () => {
    // The hour hand reaches 26 units. Sitting the text at the centre would put
    // it under the hand for a quarter of every revolution.
    expect(dialDatePlacement("full", window).y).toBeGreaterThan(70);
  });
});
