// Presentational grouping on top of parseIcs's output: all-day events float
// to the top, everything else stays in the chronological order it was
// already sorted into.
export function groupEvents(events) {
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);
  return [...allDay, ...timed];
}

export function isToday(date, now) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// A short "in 2h" / "in 3d" label for an upcoming timed event. Null for
// something already under way or past, rather than a confusing "in -4m".
export function relativeLabel(date, now) {
  const diffMin = Math.round((date.getTime() - now.getTime()) / 60_000);
  if (diffMin <= 0) return null;
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `in ${diffHr}h`;
  return `in ${Math.round(diffHr / 24)}d`;
}
