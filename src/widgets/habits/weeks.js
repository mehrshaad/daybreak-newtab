import { formatDate } from "../../utils";

// Weekly habit accounting.
//
// A week is defined by the day the user says it starts on, not by the calendar.
// A week counts as *completed* only once the following week has begun — that is
// what "when we reach that day, consider the week completed" means — so the week
// in progress is never judged against the target and can never break a streak.

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const weekStartIndex = (name) => {
  const i = WEEKDAYS.indexOf(name);
  return i === -1 ? 1 : i; // default Monday
};

// The most recent occurrence of the start day, at or before `date`.
export function weekStartOf(date, startIndex = 1) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const back = (d.getDay() - startIndex + 7) % 7;
  d.setDate(d.getDate() - back);
  return d;
}

// The seven ISO dates of the week beginning at `start`.
export function weekDays(start) {
  const out = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    d.setDate(d.getDate() + i);
    out.push(formatDate(d));
  }
  return out;
}

export function countDone(history, isoDates) {
  if (!history) return 0;
  return isoDates.filter((iso) => history[iso]).length;
}

// The week currently in progress: its days, how many are ticked, and which of
// those days is today.
export function currentWeek(history, startIndex = 1, today = new Date()) {
  const start = weekStartOf(today, startIndex);
  const days = weekDays(start);
  return { start, days, count: countDone(history, days), today: formatDate(today) };
}

// Consecutive completed weeks meeting the target, counted back from the most
// recently completed week. Stops at the first week that missed.
export function weekStreak(history, { startIndex = 1, target = 5, today = new Date() } = {}) {
  if (!history || target <= 0) return 0;
  const cursor = weekStartOf(today, startIndex);
  // Step back one week: the week in progress is not judged yet.
  cursor.setDate(cursor.getDate() - 7);

  let streak = 0;
  // Bounded so a corrupt history cannot spin forever.
  for (let guard = 0; guard < 520; guard += 1) {
    const days = weekDays(cursor);
    if (countDone(history, days) < target) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// Everything the tile needs for one habit, in one pass.
export function habitProgress(history, { startIndex = 1, target = 5, targetWeeks = 0, today = new Date() } = {}) {
  const week = currentWeek(history, startIndex, today);
  const streak = weekStreak(history, { startIndex, target, today });
  // The week in progress counts toward the goal once it hits the target, so the
  // display does not stall at the old number all week.
  const effective = streak + (week.count >= target ? 1 : 0);
  return {
    ...week,
    target,
    streak,
    metThisWeek: week.count >= target,
    weeksDone: effective,
    targetWeeks,
    goalReached: targetWeeks > 0 && effective >= targetWeeks,
  };
}
