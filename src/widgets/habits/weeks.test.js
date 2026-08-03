import { describe, expect, it } from "vitest";
import {
  WEEKDAYS,
  countDone,
  currentWeek,
  habitProgress,
  weekDays,
  weekStartIndex,
  weekStartOf,
  weekStreak,
} from "./weeks";

// 2026-08-05 is a Wednesday.
const WED = new Date(2026, 7, 5);

const markRange = (from, to) => {
  const out = {};
  const d = new Date(from);
  while (d <= to) {
    out[
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    ] = true;
    d.setDate(d.getDate() + 1);
  }
  return out;
};

describe("weekStartIndex", () => {
  it("maps names to Date.getDay() numbers", () => {
    expect(weekStartIndex("Sunday")).toBe(0);
    expect(weekStartIndex("Monday")).toBe(1);
    expect(weekStartIndex("Saturday")).toBe(6);
  });

  it("defaults to Monday for anything unknown", () => {
    expect(weekStartIndex("nonsense")).toBe(1);
    expect(weekStartIndex(undefined)).toBe(1);
  });

  it("covers all seven days", () => {
    expect(WEEKDAYS).toHaveLength(7);
  });
});

describe("weekStartOf", () => {
  it("walks back to the chosen start day", () => {
    // Monday of that week is the 3rd; Sunday is the 2nd; Wednesday is itself.
    expect(weekStartOf(WED, 1).getDate()).toBe(3);
    expect(weekStartOf(WED, 0).getDate()).toBe(2);
    expect(weekStartOf(WED, 3).getDate()).toBe(5);
  });

  it("returns the same day when the date already is the start", () => {
    const mon = new Date(2026, 7, 3);
    expect(weekStartOf(mon, 1).getTime()).toBe(mon.getTime());
  });

  it("crosses a month boundary", () => {
    // 2026-09-01 is a Tuesday; its Monday is 2026-08-31.
    const start = weekStartOf(new Date(2026, 8, 1), 1);
    expect(start.getMonth()).toBe(7);
    expect(start.getDate()).toBe(31);
  });
});

describe("weekDays", () => {
  it("returns seven consecutive ISO dates from the start", () => {
    expect(weekDays(new Date(2026, 7, 3))).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
      "2026-08-09",
    ]);
  });

  it("spans a month boundary correctly", () => {
    const days = weekDays(new Date(2026, 7, 31));
    expect(days[0]).toBe("2026-08-31");
    expect(days[6]).toBe("2026-09-06");
  });
});

describe("countDone", () => {
  it("counts only ticked days", () => {
    const history = { "2026-08-03": true, "2026-08-05": true };
    expect(countDone(history, weekDays(new Date(2026, 7, 3)))).toBe(2);
  });

  it("is zero for empty history", () => {
    expect(countDone(null, ["2026-08-03"])).toBe(0);
    expect(countDone({}, ["2026-08-03"])).toBe(0);
  });
});

describe("currentWeek", () => {
  it("reports the week in progress and today's date", () => {
    const week = currentWeek({ "2026-08-03": true }, 1, WED);
    expect(week.days[0]).toBe("2026-08-03");
    expect(week.count).toBe(1);
    expect(week.today).toBe("2026-08-05");
  });
});

describe("weekStreak", () => {
  // Three full weeks before the current one: Jul 13-19, Jul 20-26, Jul 27-Aug 2.
  const threeFullWeeks = markRange(new Date(2026, 6, 13), new Date(2026, 7, 2));

  it("counts consecutive completed weeks meeting the target", () => {
    expect(weekStreak(threeFullWeeks, { startIndex: 1, target: 5, today: WED })).toBe(3);
  });

  // The week in progress is not judged, so a slow start cannot break a streak.
  it("ignores the week in progress", () => {
    const history = { ...threeFullWeeks };
    expect(weekStreak(history, { startIndex: 1, target: 5, today: WED })).toBe(3);
    // Even with nothing at all ticked this week, the streak stands.
    expect(weekStreak(threeFullWeeks, { startIndex: 1, target: 7, today: WED })).toBe(3);
  });

  it("stops at the first week that missed the target", () => {
    const history = { ...threeFullWeeks };
    // Knock the middle week (Jul 20-26) down to two days.
    for (const d of ["2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26"]) {
      delete history[d];
    }
    expect(weekStreak(history, { startIndex: 1, target: 5, today: WED })).toBe(1);
  });

  it("is zero with no history, no target, or a target nobody meets", () => {
    expect(weekStreak({}, { target: 5, today: WED })).toBe(0);
    expect(weekStreak(null, { target: 5, today: WED })).toBe(0);
    expect(weekStreak(threeFullWeeks, { target: 0, today: WED })).toBe(0);
  });

  it("respects the chosen week start", () => {
    // Same ticks, Sunday-start weeks are offset by a day, so the run of
    // fully-ticked weeks differs from the Monday-start reading.
    const monday = weekStreak(threeFullWeeks, { startIndex: 1, target: 7, today: WED });
    const sunday = weekStreak(threeFullWeeks, { startIndex: 0, target: 7, today: WED });
    expect(monday).toBe(3);
    expect(sunday).toBeLessThan(monday);
  });
});

describe("habitProgress", () => {
  const threeFullWeeks = markRange(new Date(2026, 6, 13), new Date(2026, 7, 2));

  it("adds the week in progress once it meets the target", () => {
    const history = { ...threeFullWeeks, "2026-08-03": true, "2026-08-04": true };
    const p = habitProgress(history, { startIndex: 1, target: 2, today: WED });
    expect(p.metThisWeek).toBe(true);
    expect(p.streak).toBe(3);
    expect(p.weeksDone).toBe(4);
  });

  it("does not count the week in progress before the target is met", () => {
    const p = habitProgress(threeFullWeeks, { startIndex: 1, target: 5, today: WED });
    expect(p.metThisWeek).toBe(false);
    expect(p.weeksDone).toBe(3);
  });

  it("flags the goal only once the target week count is reached", () => {
    const p = habitProgress(threeFullWeeks, {
      startIndex: 1,
      target: 5,
      targetWeeks: 3,
      today: WED,
    });
    expect(p.goalReached).toBe(true);

    const notYet = habitProgress(threeFullWeeks, {
      startIndex: 1,
      target: 5,
      targetWeeks: 8,
      today: WED,
    });
    expect(notYet.goalReached).toBe(false);
  });

  it("treats no target week count as no goal", () => {
    const p = habitProgress(threeFullWeeks, { startIndex: 1, target: 5, today: WED });
    expect(p.targetWeeks).toBe(0);
    expect(p.goalReached).toBe(false);
  });
});
