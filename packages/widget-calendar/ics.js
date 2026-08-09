// A deliberately small iCalendar (RFC 5545) reader: just enough to list
// upcoming events from a real Google/Outlook/iCloud export. It does not
// attempt to be a complete parser — see expandRecurrence for what RRULE
// support is (and is not) covered.

// Folded lines: a line longer than 75 octets continues on the next line,
// which starts with a single space or tab. Unfolding must happen before any
// other parsing, or a folded SUMMARY/DESCRIPTION reads as two properties.
export function unfold(text) {
  return (text || "").replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

// TEXT escaping: \\ -> \, \; -> ;, \, -> ,, \n or \N -> a real newline.
// A single pass so an escaped backslash immediately before a literal "n"
// (\\n, two backslashes then n) is not mistaken for an escaped newline (\n).
export function unescapeText(value) {
  return (value || "").replace(/\\\\|\\[nN]|\\,|\\;/g, (m) => {
    if (m === "\\\\") return "\\";
    if (m === "\\," ) return ",";
    if (m === "\\;") return ";";
    return "\n";
  });
}

function parseLine(line) {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = head.split(";");
  const params = {};
  for (const part of paramParts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

// Converts a wall-clock time in a named IANA zone to the UTC instant it
// represents, using only Intl.DateTimeFormat's own timezone database — no
// hand-maintained offset or DST table. Returns null for a timezone name
// Intl does not recognise (legacy Windows zone names some older Outlook
// exports still use) so the caller can fall back rather than guess.
export function zonedTimeToUtc(y, mo, d, h, mi, s, timeZone) {
  let dtf;
  try {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return null;
  }
  const guessUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  const parts = Object.fromEntries(
    dtf.formatToParts(new Date(guessUtc)).map((p) => [p.type, p.value])
  );
  const shownAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  // shownAsUtc is what the target zone's clock reads at guessUtc; the gap
  // between them is that zone's offset from UTC at this specific instant.
  const offset = shownAsUtc - guessUtc;
  return new Date(guessUtc - offset);
}

const DATE_RE = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/;

// The three DTSTART/DTEND forms this reads: UTC ("...Z"), floating local (no
// zone at all — meant to float with whoever is viewing it, so it is left in
// the browser's own local time), and an all-day VALUE=DATE with no time.
export function parseDateValue(value, params = {}) {
  const m = DATE_RE.exec(value || "");
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  const Y = Number(y);
  const Mo = Number(mo);
  const D = Number(d);

  if (params.VALUE === "DATE" || h === undefined) {
    return { date: new Date(Y, Mo - 1, D), allDay: true };
  }
  const H = Number(h);
  const Mi = Number(mi);
  const S = Number(s);
  if (z) {
    return { date: new Date(Date.UTC(Y, Mo - 1, D, H, Mi, S)), allDay: false };
  }
  if (params.TZID) {
    const zoned = zonedTimeToUtc(Y, Mo, D, H, Mi, S, params.TZID);
    if (zoned) return { date: zoned, allDay: false };
  }
  return { date: new Date(Y, Mo - 1, D, H, Mi, S), allDay: false };
}

export function parseRRule(value) {
  const out = {};
  for (const part of (value || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    out[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  }
  const untilParsed = out.UNTIL ? parseDateValue(out.UNTIL) : null;
  return {
    freq: out.FREQ || null,
    interval: Math.max(1, Number(out.INTERVAL) || 1),
    byday: out.BYDAY ? out.BYDAY.split(",") : null,
    until: untilParsed?.date || null,
    count: out.COUNT ? Number(out.COUNT) : null,
  };
}

const WEEKDAY_NUM = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

// Expands FREQ=DAILY and FREQ=WEEKLY (with BYDAY, INTERVAL, UNTIL, COUNT)
// into individual occurrences overlapping [windowStart, windowEnd]. COUNT
// and UNTIL are still honoured against the *full* series, not just the
// window, so a rule that already ended before the window correctly yields
// nothing.
//
// Deliberately out of scope: FREQ=MONTHLY/YEARLY, and EXDATE (excluded
// dates) — a full RRULE engine is a much larger project, and expanding only
// what is implemented here leaves a gap in the list rather than ever
// inventing a wrong date. BYDAY math also walks calendar days in the
// viewer's local time on the already-resolved occurrence, not the event's
// original zone, so a recurrence is very rare to land on the wrong weekday
// only right at a DST boundary in a distant zone.
export function expandRecurrence(dtstart, dtend, rrule, windowStart, windowEnd) {
  const duration = dtend.getTime() - dtstart.getTime();
  const hardStop = Math.min(
    rrule.until ? rrule.until.getTime() : Infinity,
    windowEnd.getTime()
  );
  const out = [];

  if (rrule.freq === "DAILY") {
    let count = 0;
    let cursor = new Date(dtstart);
    while (cursor.getTime() <= hardStop) {
      if (rrule.count != null && count >= rrule.count) break;
      if (cursor.getTime() >= windowStart.getTime()) {
        out.push({ start: new Date(cursor), end: new Date(cursor.getTime() + duration) });
      }
      count += 1;
      cursor.setDate(cursor.getDate() + rrule.interval);
    }
    return out;
  }

  if (rrule.freq === "WEEKLY") {
    const weekdays = (
      rrule.byday?.map((d) => WEEKDAY_NUM[d]).filter((d) => d !== undefined) || [
        dtstart.getDay(),
      ]
    ).sort((a, b) => a - b);
    let count = 0;
    let weekStart = new Date(dtstart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    for (let guard = 0; guard < 1000; guard += 1) {
      if (weekStart.getTime() > hardStop) break;
      let stop = false;
      for (const wd of weekdays) {
        const occurrence = new Date(weekStart);
        occurrence.setDate(occurrence.getDate() + wd);
        occurrence.setHours(dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds(), 0);
        if (occurrence < dtstart) continue;
        if (occurrence.getTime() > hardStop) {
          stop = true;
          break;
        }
        if (rrule.count != null && count >= rrule.count) {
          stop = true;
          break;
        }
        if (occurrence.getTime() >= windowStart.getTime()) {
          out.push({ start: occurrence, end: new Date(occurrence.getTime() + duration) });
        }
        count += 1;
      }
      if (stop) break;
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7 * rrule.interval);
    }
    return out;
  }

  // Unsupported frequency: yield the plain, non-recurring occurrence only.
  return dtstart.getTime() >= windowStart.getTime() && dtstart.getTime() <= windowEnd.getTime()
    ? [{ start: dtstart, end: dtend }]
    : [];
}

// Reads every VEVENT block in the calendar and expands it into concrete
// occurrences within the next `windowDays` days (default 14, per the
// recurrence-expansion limit above — a non-recurring event further out would
// not have anything to expand anyway, so the same window applies to both).
export function parseIcs(icsText, { now = new Date(), windowDays = 14 } = {}) {
  const windowStart = now;
  const windowEnd = new Date(now.getTime() + windowDays * 86_400_000);

  const lines = unfold(icsText).split("\n");
  const events = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const prop = parseLine(line);
    if (!prop) continue;

    if (prop.name === "SUMMARY") current.summary = unescapeText(prop.value);
    else if (prop.name === "LOCATION") current.location = unescapeText(prop.value);
    else if (prop.name === "DTSTART") current.dtstart = parseDateValue(prop.value, prop.params);
    else if (prop.name === "DTEND") current.dtend = parseDateValue(prop.value, prop.params);
    else if (prop.name === "RRULE") current.rrule = parseRRule(prop.value);
  }

  const out = [];
  for (const ev of events) {
    if (!ev.dtstart) continue;
    const dtstart = ev.dtstart.date;
    const dtend = ev.dtend?.date || dtstart;
    const allDay = ev.dtstart.allDay;
    const occurrences = ev.rrule
      ? expandRecurrence(dtstart, dtend, ev.rrule, windowStart, windowEnd)
      : dtstart.getTime() <= windowEnd.getTime() && dtend.getTime() >= windowStart.getTime()
      ? [{ start: dtstart, end: dtend }]
      : [];

    for (const occ of occurrences) {
      out.push({
        title: ev.summary || "(untitled)",
        location: ev.location || "",
        start: occ.start,
        end: occ.end,
        allDay,
      });
    }
  }

  out.sort((a, b) => a.start - b.start);
  return out;
}
