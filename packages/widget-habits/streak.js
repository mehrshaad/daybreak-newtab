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

// Keeps sync's per-item budget from growing without bound: history is
// per-habit maps of the same shape, so trimming is just a date-string
// comparison per habit, oldest days first.
export function trimHistory(history, days = 370, today = new Date()) {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffKey = formatDate(cutoff);
  const out = {};
  for (const [habitId, dates] of Object.entries(history || {})) {
    const kept = {};
    for (const date of Object.keys(dates || {})) {
      if (date >= cutoffKey) kept[date] = true;
    }
    out[habitId] = kept;
  }
  return out;
}
