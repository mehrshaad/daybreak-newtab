import { describe, expect, it } from "vitest";
import {
  daysUntil,
  formatRemaining,
  nextOccurrence,
  sortEntries,
  startOfDay,
  visibleEntries,
  yearsAt,
} from "./countdown";

const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const one = (date, extra) => ({ id: date, title: date, date, ...extra });

describe("startOfDay", () => {
  it("drops the time", () => {
    const d = startOfDay(at(2026, 8, 21, 23, 59));
    expect(d.getHours()).toBe(0);
    expect(d.getDate()).toBe(21);
  });
});

describe("nextOccurrence", () => {
  it("is just the date for a one-off", () => {
    expect(nextOccurrence(one("2026-12-25"), at(2026, 8, 21))).toEqual(at(2026, 12, 25, 0, 0));
  });

  it("keeps this year's date for a yearly one still to come", () => {
    const next = nextOccurrence(one("1990-12-25", { yearly: true }), at(2026, 8, 21));
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(11);
  });

  it("rolls a yearly date to next year once it has gone", () => {
    // Without this, a birthday reads as "240 days ago" for eleven months.
    const next = nextOccurrence(one("1990-03-04", { yearly: true }), at(2026, 8, 21));
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(2);
  });

  it("treats today as still to come, not gone", () => {
    const next = nextOccurrence(one("1990-08-21", { yearly: true }), at(2026, 8, 21, 18, 0));
    expect(next.getFullYear()).toBe(2026);
  });

  it("gives nothing for an unparseable date", () => {
    expect(nextOccurrence(one("not a date"), at(2026, 8, 21))).toBe(null);
  });
});

describe("daysUntil", () => {
  it("counts calendar days, not 24-hour blocks", () => {
    // 09:00 tomorrow is "1 day" all through this evening, not "0".
    expect(daysUntil(at(2026, 8, 22, 9, 0), at(2026, 8, 21, 22, 0))).toBe(1);
  });

  it("is zero today whatever the hour", () => {
    expect(daysUntil(at(2026, 8, 21, 1, 0), at(2026, 8, 21, 23, 0))).toBe(0);
  });

  it("goes negative once past", () => {
    expect(daysUntil(at(2026, 8, 18), at(2026, 8, 21))).toBe(-3);
  });

  it("crosses a month end", () => {
    expect(daysUntil(at(2026, 9, 2), at(2026, 8, 30))).toBe(3);
  });
});

describe("yearsAt", () => {
  it("says how many years a yearly date marks", () => {
    const entry = one("1990-12-25", { yearly: true });
    expect(yearsAt(entry, nextOccurrence(entry, at(2026, 8, 21)))).toBe(36);
  });

  it("says nothing for a one-off", () => {
    expect(yearsAt(one("2026-12-25"), at(2026, 12, 25))).toBe(null);
  });

  it("says nothing when the base year is ahead of the occurrence", () => {
    const entry = one("2030-01-01", { yearly: true });
    expect(yearsAt(entry, nextOccurrence(entry, at(2026, 8, 21)))).toBe(null);
  });
});

describe("formatRemaining", () => {
  const now = at(2026, 8, 21, 10, 0);

  it("uses words where a number would be worse", () => {
    // "Tomorrow" beats "in 23h" even though both are under a day, and a date
    // that has already gone by today is just "Today" — there is no countdown
    // left to run.
    expect(formatRemaining(at(2026, 8, 22, 9, 0), now)).toBe("Tomorrow");
    expect(formatRemaining(at(2026, 8, 20), now)).toBe("Yesterday");
    expect(formatRemaining(at(2026, 8, 21, 8, 0), now)).toBe("Today");
  });

  it("counts the hours for something still to come today", () => {
    expect(formatRemaining(at(2026, 8, 21, 18, 0), now)).toBe("in 8h 0m");
  });

  it("counts days out in the distance", () => {
    expect(formatRemaining(at(2026, 9, 1), now)).toBe("11 days");
  });

  it("switches to hours and minutes inside a day", () => {
    expect(formatRemaining(at(2026, 8, 22, 13, 30), at(2026, 8, 22, 9, 0))).toBe("in 4h 30m");
  });

  it("drops to minutes in the last hour", () => {
    expect(formatRemaining(at(2026, 8, 22, 9, 25), at(2026, 8, 22, 9, 0))).toBe("in 25m");
  });

  it("counts up once past", () => {
    expect(formatRemaining(at(2026, 8, 11), now)).toBe("10 days ago");
  });
});

describe("sortEntries", () => {
  const now = at(2026, 8, 21);
  const entries = [
    one("2026-12-25"),
    one("2026-08-22"),
    one("2026-08-10"),
    one("2026-09-01"),
  ];

  it("puts the soonest first", () => {
    expect(sortEntries(entries, now).map((r) => r.entry.date)).toEqual([
      "2026-08-22",
      "2026-09-01",
      "2026-12-25",
      // Past last: a countdown is about what is coming.
      "2026-08-10",
    ]);
  });

  it("leaves the order alone when asked to", () => {
    expect(sortEntries(entries, now, "added").map((r) => r.entry.date)).toEqual(
      entries.map((e) => e.date)
    );
  });

  it("is stable for two dates on the same day", () => {
    const same = [one("2026-09-01"), { ...one("2026-09-01"), id: "b", title: "b" }];
    expect(sortEntries(same, now).map((r) => r.entry.id)).toEqual(["2026-09-01", "b"]);
  });
});

describe("visibleEntries", () => {
  const now = at(2026, 8, 21);

  it("hides what has been and gone", () => {
    const rows = visibleEntries([one("2026-08-10"), one("2026-09-01")], now);
    expect(rows.map((r) => r.entry.date)).toEqual(["2026-09-01"]);
  });

  it("keeps them when asked", () => {
    const rows = visibleEntries([one("2026-08-10")], now, { keepPast: true });
    expect(rows).toHaveLength(1);
  });

  it("never hides a yearly entry, which has already rolled forward", () => {
    const rows = visibleEntries([one("1990-03-04", { yearly: true })], now);
    expect(rows).toHaveLength(1);
    expect(rows[0].days).toBeGreaterThan(0);
  });
});
