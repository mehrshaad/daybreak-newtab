import { formatDate } from "@daybreak/sdk";

// Month-grid maths for the due-date picker. Weeks start on Sunday — a date
// picker's own convention, independent of the habits widget's
// user-configurable week start, so this stays a small, self-contained module
// rather than sharing weeks.js's per-user-preference machinery.

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Every cell of a month's grid, padded with the trailing days of the previous
// month and the leading days of the next so every row is a full week. Always
// six rows (42 days), even for a month that would fit in five, so the picker
// never changes height as you page between months.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
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
