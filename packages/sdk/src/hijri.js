// Hijri (Islamic) dates, from the browser rather than from an algorithm here.
//
// Jalali gets its own implementation next door because it has to: its leap
// years follow the true vernal equinox at Tehran, and getting that right is
// arithmetic somebody has to own. Hijri is the opposite case. The civil Umm
// al-Qura calendar is a published table of month lengths, Chrome already ships
// it through Intl, and a hand-rolled 30-year-cycle approximation — the one
// everybody reaches for — disagrees with the real calendar by a day or two
// most months. Shipping that as "the Hijri date" would be shipping a number
// that is confidently wrong.
//
// So this is a thin reader over Intl, and it says so when it cannot answer
// rather than guessing.

// islamic-umalqura, not plain "islamic": the latter is a calculated variant and
// they differ by a day for the date this was written on. Umm al-Qura is the one
// in civil use.
const CALENDAR = "islamic-umalqura";

let numeric = null;
let monthName = null;
let unavailable = false;

function formatters() {
  if (numeric || unavailable) return { numeric, monthName };
  try {
    numeric = new Intl.DateTimeFormat(`en-u-ca-${CALENDAR}`, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    monthName = new Intl.DateTimeFormat(`en-u-ca-${CALENDAR}`, {
      month: "long",
      timeZone: "UTC",
    });
  } catch {
    unavailable = true;
  }
  return { numeric, monthName };
}

export function hijriAvailable() {
  const { numeric: f } = formatters();
  return !!f;
}

// The date is read in UTC after being shifted to the local calendar day, so a
// local time near midnight cannot land on the neighbouring Hijri day. Formatting
// the raw Date in the local zone would be simpler and wrong in exactly the
// hours where a date display matters most.
function asUtcNoon(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
}

export function toHijri(date) {
  const { numeric: f, monthName: m } = formatters();
  if (!f) return null;
  const at = asUtcNoon(date);
  const parts = {};
  for (const part of f.formatToParts(at)) parts[part.type] = part.value;
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const day = parseInt(parts.day, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day, monthName: m ? m.format(at) : String(month) };
}

// "8 Rabiʻ I" — the day and month, with the year only when asked for, matching
// how formatJalali next door behaves so a caller can swap between them.
export function formatHijri(date, { withYear = true } = {}) {
  const h = toHijri(date);
  if (!h) return "";
  return withYear ? `${h.day} ${h.monthName} ${h.year}` : `${h.day} ${h.monthName}`;
}
