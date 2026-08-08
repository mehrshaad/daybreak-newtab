import { describe, expect, it } from "vitest";
import { groupEvents, isToday, relativeLabel } from "./agenda";

describe("groupEvents", () => {
  it("floats all-day events to the top, keeping each group's order", () => {
    const events = [
      { title: "Timed 1", allDay: false },
      { title: "All day 1", allDay: true },
      { title: "Timed 2", allDay: false },
      { title: "All day 2", allDay: true },
    ];
    expect(groupEvents(events).map((e) => e.title)).toEqual([
      "All day 1",
      "All day 2",
      "Timed 1",
      "Timed 2",
    ]);
  });

  it("is empty for an empty list", () => {
    expect(groupEvents([])).toEqual([]);
  });
});

describe("isToday", () => {
  const now = new Date(2026, 7, 7, 15, 0, 0);

  it("is true for a different time on the same calendar day", () => {
    expect(isToday(new Date(2026, 7, 7, 0, 0, 0), now)).toBe(true);
  });

  it("is false for tomorrow or yesterday", () => {
    expect(isToday(new Date(2026, 7, 8), now)).toBe(false);
    expect(isToday(new Date(2026, 7, 6), now)).toBe(false);
  });
});

describe("relativeLabel", () => {
  const now = new Date(2026, 7, 7, 12, 0, 0);

  it("uses minutes under an hour away", () => {
    expect(relativeLabel(new Date(now.getTime() + 30 * 60_000), now)).toBe("in 30m");
  });

  it("uses hours under a day away", () => {
    expect(relativeLabel(new Date(now.getTime() + 3 * 3_600_000), now)).toBe("in 3h");
  });

  it("uses days beyond that", () => {
    expect(relativeLabel(new Date(now.getTime() + 2 * 86_400_000), now)).toBe("in 2d");
  });

  it("is null for something already under way or past", () => {
    expect(relativeLabel(new Date(now.getTime() - 60_000), now)).toBeNull();
    expect(relativeLabel(now, now)).toBeNull();
  });
});
