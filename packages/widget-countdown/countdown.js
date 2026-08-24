import { parseDateKey } from "@daybreak/sdk";

// A countdown's arithmetic, kept pure so the awkward parts are testable: the
// day something falls on is a local calendar question, not a millisecond one,
// and a yearly date has to roll forward on its own or the widget is wrong for
// eleven months after every birthday.

const DAY = 86400000;

// Midnight local, so "days until" counts calendar days rather than 24-hour
// blocks. Without this, an event at 09:00 tomorrow reads as "0 days" all
// evening, which is not what anybody means by tomorrow.
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// When the entry next happens. A one-off is simply its date; a yearly one is
// this year's occurrence if it has not gone by, and next year's if it has.
export function nextOccurrence(entry, now = new Date()) {
  const base = parseDateKey(entry.date);
  if (!base) return null;
  if (!entry.yearly) return base;

  const today = startOfDay(now);
  const thisYear = new Date(today.getFullYear(), base.getMonth(), base.getDate());
  if (thisYear >= today) return thisYear;
  // 29 February rolls to 1 March in a common year, which is what the Date
  // constructor does with (year, 1, 29) — the sensible reading, and the same
  // one calendar apps take.
  return new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
}

// Whole calendar days between today and the target. Negative once it has gone.
export function daysUntil(target, now = new Date()) {
  if (!target) return null;
  return Math.round((startOfDay(target) - startOfDay(now)) / DAY);
}

// How many years old this makes it, for a yearly entry — a birthday's whole
// point. Null for a one-off, and null if the entry's own year is in the future.
export function yearsAt(entry, occurrence) {
  if (!entry.yearly || !occurrence) return null;
  const base = parseDateKey(entry.date);
  if (!base) return null;
  const years = occurrence.getFullYear() - base.getFullYear();
  return years > 0 ? years : null;
}

// The line under the title. Days while there are days, hours and minutes once
// it is close enough that days stop being useful, and plain language at the
// ends where a number would be worse.
export function formatRemaining(target, now = new Date()) {
  if (!target) return "";
  const days = daysUntil(target, now);

  // Today and still to come is the one case where the clock beats the
  // calendar: "in 25m" is what you want to know, and "Today" is not. Only
  // today, though — "Tomorrow" reads better than "in 23h" even though both
  // are under a day.
  if (days === 0) {
    const ms = target - now;
    if (ms <= 0) return "Today";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.round((ms % 3600000) / 60000);
    return hours ? `in ${hours}h ${minutes}m` : `in ${minutes}m`;
  }
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return `${days} days`;
  return `${Math.abs(days)} days ago`;
}

// Soonest first, but with anything already past pushed to the end rather than
// leading — a countdown is about what is coming.
export function sortEntries(entries, now = new Date(), mode = "soonest") {
  const withDates = entries.map((entry, index) => {
    const occurrence = nextOccurrence(entry, now);
    return { entry, occurrence, days: daysUntil(occurrence, now), index };
  });

  if (mode === "added") return withDates;

  return withDates.sort((a, b) => {
    const aPast = a.days != null && a.days < 0;
    const bPast = b.days != null && b.days < 0;
    if (aPast !== bPast) return aPast ? 1 : -1;
    if (a.days == null) return 1;
    if (b.days == null) return -1;
    if (a.days !== b.days) return a.days - b.days;
    return a.index - b.index;
  });
}

// Past entries are dropped unless the user asked to keep them. A yearly entry
// is never past — it has already rolled forward — so this only ever hides
// one-offs that have been and gone.
export function visibleEntries(entries, now, { keepPast = false, sort = "soonest" } = {}) {
  const sorted = sortEntries(entries, now, sort);
  return keepPast ? sorted : sorted.filter((row) => row.days == null || row.days >= 0);
}
