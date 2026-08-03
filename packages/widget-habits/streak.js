import { formatDate } from "@daybreak/sdk";

// A habit's history is a set of ISO dates: { "2026-08-01": true }. Storing
// dates rather than offsets means the grid stays correct when the tab is left
// open across midnight.

export function lastNDays(n, today = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(formatDate(d));
  }
  return out;
}

// Consecutive days done, counting back from today. A gap today does not break
// the streak until tomorrow — otherwise every streak reads zero each morning.
export function streakFor(history, today = new Date()) {
  let count = 0;
  const cursor = new Date(today);
  if (!history?.[formatDate(cursor)]) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    if (!history?.[formatDate(cursor)]) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function toggleDay(history, date) {
  const next = { ...(history || {}) };
  if (next[date]) delete next[date];
  else next[date] = true;
  return next;
}
