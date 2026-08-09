import { describe, expect, it } from "vitest";
import { PROVIDER_ICON_NAME, PROVIDER_LABEL, providerFor, resolveCalendars } from "./calendars";

describe("providerFor", () => {
  it("recognises Google Calendar links", () => {
    expect(providerFor("https://calendar.google.com/calendar/ical/abc/basic.ics")).toBe("google");
  });

  it("recognises Outlook / Office 365 links", () => {
    expect(providerFor("https://outlook.office365.com/owa/calendar/abc/cal.ics")).toBe("outlook");
    expect(providerFor("https://outlook.live.com/owa/calendar/abc/cal.ics")).toBe("outlook");
    expect(providerFor("https://office.com/calendar/abc.ics")).toBe("outlook");
  });

  it("recognises iCloud links", () => {
    expect(providerFor("https://p123-caldav.icloud.com/published/2/abc")).toBe("apple");
  });

  it("falls back to other for anything else", () => {
    expect(providerFor("https://example.com/my-calendar.ics")).toBe("other");
  });

  it("is other for an unparseable url rather than throwing", () => {
    expect(providerFor("not a url")).toBe("other");
    expect(providerFor("")).toBe("other");
    expect(providerFor(undefined)).toBe("other");
  });
});

describe("PROVIDER_LABEL / PROVIDER_ICON_NAME", () => {
  it("has an entry for every provider providerFor can return", () => {
    for (const provider of ["google", "outlook", "apple", "other"]) {
      expect(PROVIDER_LABEL[provider]).toBeTruthy();
      expect(PROVIDER_ICON_NAME[provider]).toBeTruthy();
    }
  });
});

describe("resolveCalendars", () => {
  it("returns the calendars list when present", () => {
    const config = { calendars: [{ id: "1", url: "https://a", provider: "other" }] };
    expect(resolveCalendars(config)).toEqual(config.calendars);
  });

  it("adapts a legacy single icsUrl into a one-element list", () => {
    const config = { icsUrl: "https://calendar.google.com/basic.ics" };
    expect(resolveCalendars(config)).toEqual([
      { id: "legacy", url: "https://calendar.google.com/basic.ics", provider: "google" },
    ]);
  });

  it("prefers the new shape over a lingering legacy field", () => {
    const config = {
      calendars: [{ id: "1", url: "https://a", provider: "other" }],
      icsUrl: "https://old",
    };
    expect(resolveCalendars(config)).toEqual(config.calendars);
  });

  it("is empty when neither shape is present", () => {
    expect(resolveCalendars({})).toEqual([]);
    expect(resolveCalendars(null)).toEqual([]);
    expect(resolveCalendars(undefined)).toEqual([]);
  });
});
