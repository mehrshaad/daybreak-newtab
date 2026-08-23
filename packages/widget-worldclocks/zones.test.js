import { describe, expect, it } from "vitest";
import {
  dayOffset,
  isDaytime,
  isValidZone,
  offsetLabel,
  zoneOffsetLabel,
  zoneParts,
} from "./zones";
import manifest from "./manifest";

describe("isValidZone", () => {
  it("accepts real IANA ids", () => {
    for (const tz of ["Asia/Tehran", "America/Toronto", "UTC", "Australia/Eucla"]) {
      expect(isValidZone(tz), tz).toBe(true);
    }
  });

  it("rejects junk without throwing", () => {
    for (const tz of ["Not/AZone", "", null, undefined, 42]) {
      expect(isValidZone(tz)).toBe(false);
    }
  });
});

describe("dayOffset", () => {
  // 2026-08-02T23:00Z: still the 2nd in Toronto (19:00), already the 3rd in
  // Tehran (03:30) and in Tokyo (08:00).
  const instant = new Date("2026-08-02T23:00:00Z");

  it("is zero for the same calendar day", () => {
    expect(dayOffset(instant, "America/Toronto", "America/Toronto")).toBe(0);
  });

  it("is +1 for a zone already into tomorrow", () => {
    expect(dayOffset(instant, "Asia/Tehran", "America/Toronto")).toBe(1);
    expect(dayOffset(instant, "Asia/Tokyo", "America/Toronto")).toBe(1);
  });

  it("is -1 looking the other way", () => {
    expect(dayOffset(instant, "America/Toronto", "Asia/Tokyo")).toBe(-1);
  });

  it("handles half-hour and quarter-hour zones", () => {
    expect(dayOffset(instant, "Asia/Kolkata", "America/Toronto")).toBe(1);
    expect(dayOffset(instant, "Asia/Kathmandu", "America/Toronto")).toBe(1);
  });

  it("crosses the date line correctly", () => {
    const t = new Date("2026-08-02T11:00:00Z");
    expect(dayOffset(t, "Pacific/Kiritimati", "Pacific/Midway")).toBe(1);
  });

  // A ms-difference implementation rounds wrong on the DST day; calendar-date
  // arithmetic does not.
  it("is exact across a DST transition", () => {
    const springForward = new Date("2026-03-08T08:00:00Z");
    expect(dayOffset(springForward, "America/Toronto", "America/Toronto")).toBe(0);
    expect(dayOffset(springForward, "Asia/Tehran", "America/Toronto")).toBe(0);
  });
});

describe("offsetLabel", () => {
  it("says nothing when the day matches", () => {
    expect(offsetLabel(0)).toBe("");
  });

  it("names the adjacent days", () => {
    expect(offsetLabel(1)).toBe("tomorrow");
    expect(offsetLabel(-1)).toBe("yesterday");
  });

  it("falls back to a signed count further out", () => {
    expect(offsetLabel(2)).toBe("+2d");
    expect(offsetLabel(-2)).toBe("-2d");
  });
});

describe("isDaytime", () => {
  it("treats 07:00-18:59 as day", () => {
    expect(isDaytime(7)).toBe(true);
    expect(isDaytime(18)).toBe(true);
    expect(isDaytime(6)).toBe(false);
    expect(isDaytime(19)).toBe(false);
    expect(isDaytime(0)).toBe(false);
  });
});

describe("zoneParts", () => {
  const instant = new Date("2026-08-02T23:00:00Z");

  it("renders the local time of the zone", () => {
    const p = zoneParts(instant, { city: "Tehran", tz: "Asia/Tehran" }, {
      hour24: true,
      localTz: "America/Toronto",
    });
    // 23:00Z + 3:30 = 02:30 the next day.
    expect(p.time).toBe("02:30");
    expect(p.offset).toBe(1);
    expect(p.label).toBe("tomorrow");
    expect(p.day).toBe(false);
  });

  it("renders two zones independently from one instant", () => {
    const zones = [
      { city: "Tehran", tz: "Asia/Tehran" },
      { city: "Toronto", tz: "America/Toronto" },
    ];
    const [a, b] = zones.map((z) =>
      zoneParts(instant, z, { hour24: true, localTz: "America/Toronto" })
    );
    expect(a.time).toBe("02:30");
    expect(b.time).toBe("19:00");
    expect(a.offset).toBe(1);
    expect(b.offset).toBe(0);
    // Both are outside the 07:00-18:59 daytime window at this instant.
    expect(a.day).toBe(false);
    expect(b.day).toBe(false);
  });

  it("marks a zone in working hours as daytime", () => {
    const p = zoneParts(instant, { city: "Tokyo", tz: "Asia/Tokyo" }, {
      hour24: true,
      localTz: "America/Toronto",
    });
    expect(p.time).toBe("08:00");
    expect(p.day).toBe(true);
  });

  it("honours the 12-hour preference", () => {
    const p = zoneParts(instant, { city: "Toronto", tz: "America/Toronto" }, {
      hour24: false,
      localTz: "America/Toronto",
    });
    expect(p.time).toMatch(/7[:.]00/);
  });

  it("degrades instead of throwing on a bad zone", () => {
    const p = zoneParts(instant, { city: "Nowhere", tz: "Not/AZone" });
    expect(p.time).toBe("—");
    expect(p.city).toBe("Nowhere");
  });
});

describe("zoneOffsetLabel", () => {
  // Mid-January and mid-July, so both sides of DST are covered.
  const winter = new Date("2026-01-15T12:00:00Z");
  const summer = new Date("2026-07-15T12:00:00Z");

  it("reports the offset from UTC, not the zone's city", () => {
    expect(zoneOffsetLabel(winter, "Asia/Tokyo")).toBe("UTC+9");
    expect(zoneOffsetLabel(winter, "Asia/Tehran")).toBe("UTC+3:30");
    // Zero offset drops the "+0".
    expect(zoneOffsetLabel(winter, "UTC")).toBe("UTC");
    expect(zoneOffsetLabel(winter, "Europe/London")).toBe("UTC");
  });

  it("follows daylight saving", () => {
    expect(zoneOffsetLabel(winter, "America/New_York")).toBe("UTC-5");
    expect(zoneOffsetLabel(summer, "America/New_York")).toBe("UTC-4");
  });

  it("is empty for a zone it cannot resolve", () => {
    expect(zoneOffsetLabel(winter, "Not/AZone")).toBe("");
    expect(zoneOffsetLabel(winter, "")).toBe("");
  });
});

describe("the two text sizes", () => {
  it("offers exactly two, with regular the default", () => {
    const o = manifest.options.find((x) => x.key === "textSize");
    expect(o.of).toEqual(["regular", "large"]);
    expect(o.default).toBe("regular");
    for (const v of o.of) expect(o.labels[v], v).toBeTruthy();
  });

  // Whether the rows fit the tile is checked in src/core/worldClockFit.test.js,
  // which can import the board's real geometry. Doing it here meant keeping a
  // copy of that geometry next to the widget, and the copy was wrong: it took
  // the label row's 40px maxHeight for its height, when the row actually
  // occupies 14. It had this widget overflowing at the regular size, which it
  // does not.
});
