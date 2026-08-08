import { describe, expect, it } from "vitest";
import {
  expandRecurrence,
  parseDateValue,
  parseIcs,
  parseRRule,
  unescapeText,
  unfold,
  zonedTimeToUtc,
} from "./ics";

describe("unfold", () => {
  it("joins a folded line back together", () => {
    const text = "SUMMARY:Long meeting title that got\n  folded across two lines";
    expect(unfold(text)).toBe("SUMMARY:Long meeting title that got folded across two lines");
  });

  it("handles a tab as the continuation marker too", () => {
    expect(unfold("A:one\n\ttwo")).toBe("A:onetwo");
  });

  it("normalises CRLF before unfolding", () => {
    expect(unfold("A:one\r\n two")).toBe("A:onetwo");
  });

  it("leaves an ordinary multi-line file alone", () => {
    expect(unfold("A:one\nB:two")).toBe("A:one\nB:two");
  });
});

describe("unescapeText", () => {
  it("unescapes commas, semicolons and newlines", () => {
    expect(unescapeText("Coffee\\, tea\\; or water\\nPick one")).toBe(
      "Coffee, tea; or water\nPick one"
    );
  });

  it("resolves an escaped backslash before a literal n as \\n, not a newline", () => {
    expect(unescapeText("C:\\\\network")).toBe("C:\\network");
  });

  it("passes plain text through unchanged", () => {
    expect(unescapeText("Team standup")).toBe("Team standup");
  });
});

describe("zonedTimeToUtc", () => {
  it("converts a New York wall-clock time to the matching UTC instant in summer (EDT, UTC-4)", () => {
    const d = zonedTimeToUtc(2026, 8, 11, 14, 0, 0, "America/New_York");
    expect(d.toISOString()).toBe("2026-08-11T18:00:00.000Z");
  });

  it("uses the winter offset (EST, UTC-5) on a winter date, proving it is not a fixed offset", () => {
    const d = zonedTimeToUtc(2026, 1, 11, 14, 0, 0, "America/New_York");
    expect(d.toISOString()).toBe("2026-01-11T19:00:00.000Z");
  });

  it("returns null for a timezone name Intl does not recognise", () => {
    expect(zonedTimeToUtc(2026, 1, 1, 0, 0, 0, "Eastern Standard Time")).toBeNull();
  });
});

describe("parseDateValue", () => {
  it("parses a UTC value", () => {
    const { date, allDay } = parseDateValue("20260810T090000Z");
    expect(date.toISOString()).toBe("2026-08-10T09:00:00.000Z");
    expect(allDay).toBe(false);
  });

  it("parses a floating value in the local timezone, not UTC", () => {
    const { date, allDay } = parseDateValue("20260810T090000");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getHours()).toBe(9);
    expect(allDay).toBe(false);
  });

  it("parses an all-day VALUE=DATE with no time component", () => {
    const { date, allDay } = parseDateValue("20260812", { VALUE: "DATE" });
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(12);
    expect(allDay).toBe(true);
  });

  it("resolves a TZID value through zonedTimeToUtc", () => {
    const { date } = parseDateValue("20260811T140000", { TZID: "America/New_York" });
    expect(date.toISOString()).toBe("2026-08-11T18:00:00.000Z");
  });

  it("falls back to floating local time for an unrecognised TZID", () => {
    const { date } = parseDateValue("20260811T140000", { TZID: "Eastern Standard Time" });
    expect(date.getHours()).toBe(14);
  });

  it("is null for a value that does not match any known form", () => {
    expect(parseDateValue("not-a-date")).toBeNull();
  });
});

describe("parseRRule", () => {
  it("parses FREQ, INTERVAL, BYDAY and COUNT", () => {
    expect(parseRRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6")).toEqual({
      freq: "WEEKLY",
      interval: 2,
      byday: ["MO", "WE"],
      until: null,
      count: 6,
    });
  });

  it("defaults interval to 1 when absent", () => {
    expect(parseRRule("FREQ=DAILY").interval).toBe(1);
  });

  it("parses an UNTIL value into a real date", () => {
    const rule = parseRRule("FREQ=DAILY;UNTIL=20260901T000000Z");
    expect(rule.until.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("expandRecurrence", () => {
  const windowStart = new Date(2026, 7, 1);
  const windowEnd = new Date(2026, 7, 15);

  it("expands FREQ=DAILY within the window", () => {
    const dtstart = new Date(2026, 7, 3, 9, 0, 0);
    const dtend = new Date(2026, 7, 3, 10, 0, 0);
    const out = expandRecurrence(dtstart, dtend, { freq: "DAILY", interval: 1 }, windowStart, windowEnd);
    // Aug 3 9am through Aug 14 9am: Aug 15 9am falls after windowEnd, which
    // is midnight at the start of Aug 15, not the end of it.
    expect(out).toHaveLength(12);
    expect(out[0].start).toEqual(dtstart);
    expect(out[1].start.getDate()).toBe(4);
  });

  it("respects an INTERVAL greater than 1", () => {
    const dtstart = new Date(2026, 7, 1, 9, 0, 0);
    const dtend = new Date(2026, 7, 1, 10, 0, 0);
    const out = expandRecurrence(dtstart, dtend, { freq: "DAILY", interval: 3 }, windowStart, windowEnd);
    expect(out.map((o) => o.start.getDate())).toEqual([1, 4, 7, 10, 13]);
  });

  it("stops at COUNT even though the window would allow more", () => {
    const dtstart = new Date(2026, 7, 1, 9, 0, 0);
    const dtend = new Date(2026, 7, 1, 10, 0, 0);
    const out = expandRecurrence(
      dtstart,
      dtend,
      { freq: "DAILY", interval: 1, count: 3 },
      windowStart,
      windowEnd
    );
    expect(out).toHaveLength(3);
  });

  it("expands FREQ=WEEKLY with BYDAY across multiple weekdays", () => {
    // Aug 3 2026 is a Monday.
    const dtstart = new Date(2026, 7, 3, 14, 0, 0);
    const dtend = new Date(2026, 7, 3, 15, 0, 0);
    const out = expandRecurrence(
      dtstart,
      dtend,
      { freq: "WEEKLY", interval: 1, byday: ["MO", "WE", "FR"] },
      windowStart,
      windowEnd
    );
    const days = out.map((o) => o.start.getDate());
    expect(days).toEqual([3, 5, 7, 10, 12, 14]);
    // Every occurrence keeps the original time of day.
    expect(out.every((o) => o.start.getHours() === 14)).toBe(true);
  });

  it("defaults WEEKLY with no BYDAY to the start date's own weekday", () => {
    const dtstart = new Date(2026, 7, 3, 9, 0, 0); // Monday
    const dtend = new Date(2026, 7, 3, 10, 0, 0);
    const out = expandRecurrence(dtstart, dtend, { freq: "WEEKLY", interval: 1 }, windowStart, windowEnd);
    expect(out.map((o) => o.start.getDay())).toEqual([1, 1]);
  });

  it("never yields an occurrence before the series' own dtstart", () => {
    const dtstart = new Date(2026, 7, 5, 9, 0, 0); // Wednesday
    const dtend = new Date(2026, 7, 5, 10, 0, 0);
    const out = expandRecurrence(
      dtstart,
      dtend,
      { freq: "WEEKLY", interval: 1, byday: ["MO", "WE"] },
      windowStart,
      windowEnd
    );
    expect(out.every((o) => o.start >= dtstart)).toBe(true);
    expect(out.some((o) => o.start.getDay() === 1 && o.start < dtstart)).toBe(false);
  });

  it("honours UNTIL", () => {
    const dtstart = new Date(2026, 7, 1, 9, 0, 0);
    const dtend = new Date(2026, 7, 1, 10, 0, 0);
    const out = expandRecurrence(
      dtstart,
      dtend,
      { freq: "DAILY", interval: 1, until: new Date(2026, 7, 3, 23, 59, 59) },
      windowStart,
      windowEnd
    );
    expect(out.map((o) => o.start.getDate())).toEqual([1, 2, 3]);
  });

  it("falls back to the single occurrence for an unsupported frequency (monthly/yearly)", () => {
    const dtstart = new Date(2026, 7, 5, 9, 0, 0);
    const dtend = new Date(2026, 7, 5, 10, 0, 0);
    const out = expandRecurrence(dtstart, dtend, { freq: "MONTHLY" }, windowStart, windowEnd);
    expect(out).toEqual([{ start: dtstart, end: dtend }]);
  });
});

describe("parseIcs — fixtures", () => {
  const now = new Date(2026, 7, 7, 8, 0, 0); // Aug 7 2026, 8am

  it("reads a Google Calendar export (UTC times)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Google Inc//Google Calendar 70.9054//EN",
      "BEGIN:VEVENT",
      "DTSTART:20260810T090000Z",
      "DTEND:20260810T100000Z",
      "DTSTAMP:20260807T120000Z",
      "UID:abc123@google.com",
      "SUMMARY:Team standup",
      "LOCATION:Zoom",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = parseIcs(ics, { now });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ title: "Team standup", location: "Zoom", allDay: false });
    expect(out[0].start.toISOString()).toBe("2026-08-10T09:00:00.000Z");
  });

  it("reads an Outlook export (TZID-qualified local times)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Microsoft Corporation//Outlook 16.0 MIMEDIR//EN",
      "BEGIN:VEVENT",
      "DTSTART;TZID=America/New_York:20260811T140000",
      "DTEND;TZID=America/New_York:20260811T150000",
      "SUMMARY:1:1 with manager",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = parseIcs(ics, { now });
    expect(out).toHaveLength(1);
    expect(out[0].start.toISOString()).toBe("2026-08-11T18:00:00.000Z");
  });

  it("reads an all-day event", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20260812",
      "DTEND;VALUE=DATE:20260813",
      "SUMMARY:Company holiday",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = parseIcs(ics, { now });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ title: "Company holiday", allDay: true });
  });

  it("reads a weekly recurrence and expands it within the 14-day window", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260803T140000Z",
      "DTEND:20260803T150000Z",
      "SUMMARY:Standing sync",
      "RRULE:FREQ=WEEKLY;BYDAY=MO",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    // now is Aug 7; the window runs to Aug 21, so Mondays Aug 10 and Aug 17 fall inside it.
    const out = parseIcs(ics, { now });
    expect(out.map((e) => e.start.getUTCDate())).toEqual([10, 17]);
    expect(out.every((e) => e.title === "Standing sync")).toBe(true);
  });

  it("reads an event whose SUMMARY was folded across two lines", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260810T090000Z",
      "DTEND:20260810T100000Z",
      "SUMMARY:A meeting title long enough that some exporters",
      "  would fold it onto a second line",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = parseIcs(ics, { now });
    expect(out[0].title).toBe(
      "A meeting title long enough that some exporters would fold it onto a second line"
    );
  });

  it("excludes an event outside the 14-day window", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260901T090000Z",
      "DTEND:20260901T100000Z",
      "SUMMARY:Far future",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    expect(parseIcs(ics, { now })).toEqual([]);
  });

  it("sorts events chronologically regardless of file order", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260812T090000Z",
      "DTEND:20260812T100000Z",
      "SUMMARY:Second",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:20260808T090000Z",
      "DTEND:20260808T100000Z",
      "SUMMARY:First",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = parseIcs(ics, { now });
    expect(out.map((e) => e.title)).toEqual(["First", "Second"]);
  });

  it("is empty for a calendar with no events", () => {
    expect(parseIcs("BEGIN:VCALENDAR\nEND:VCALENDAR", { now })).toEqual([]);
  });
});
