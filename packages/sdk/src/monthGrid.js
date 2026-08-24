import { formatDate } from "./utils";

// Month-grid maths, shared by the date picker and the calendar widget.
//
// The week can start on any day. The picker leaves it at Sunday, which is its
// own convention and nobody's setting; the calendar widget makes it a choice,
// because a month grid starting on the wrong day is close to unreadable — a
// Saturday-start week is what a calendar in Iran looks like, and a Monday-start
// one is what most of Europe expects.

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export const WEEKDAY_LABELS = LETTERS;

// The header row, rotated to match where the week starts.
export function weekdayLabels(weekStart = 0) {
  const at = ((weekStart % 7) + 7) % 7;
  return LETTERS.map((_, i) => LETTERS[(i + at) % 7]);
}

// Every cell of a month's grid, padded with the trailing days of the previous
// month and the leading days of the next so every row is a full week. Always
// six rows (42 days), even for a month that would fit in five, so the grid
// never changes height as you page between months.
export function monthGrid(year, month, weekStart = 0) {
  const first = new Date(year, month, 1);
  const at = ((weekStart % 7) + 7) % 7;
  // How far back to reach for the first cell. mod 7 so a month whose 1st is
  // already the first day of the week reaches back nothing rather than a
  // whole week.
  const lead = (first.getDay() - at + 7) % 7;
  const start = new Date(year, month, 1 - lead);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push({ date: d, iso: formatDate(d), inMonth: d.getMonth() === month });
  }
  return days;
}

// Adds `delta` months to a {year, month} pair, wrapping the year in either
// direction — the arithmetic `new Date` itself already does, this just reads
// the normalized result back out.
export function addMonths(year, month, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
