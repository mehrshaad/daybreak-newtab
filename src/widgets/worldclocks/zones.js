// Timezone rendering via Intl, so there is no timezone database to ship and
// no network call: the browser already knows every IANA zone, including its
// DST rules. Zones are stored as { city, tz } where `tz` is the IANA id that
// Open-Meteo's geocoder returns alongside the coordinates.

export const MAX_ZONES = 4;

export function isValidZone(tz) {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// "2026-08-03" for the given instant, as observed in `tz`. en-CA gives
// ISO-ordered output, which makes these directly comparable as strings.
function isoDateIn(date, tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hourIn(date, tz) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      hour12: false,
    }).format(date)
  );
}

// Whole-day difference between the local date and the zone's date. Computed
// from calendar dates at UTC noon rather than by dividing a millisecond
// difference, so a DST transition can never round it to the wrong day.
export function dayOffset(date, tz, localTz) {
  const here = isoDateIn(date, localTz || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const there = isoDateIn(date, tz);
  const toUTC = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(there) - toUTC(here)) / 86400000);
}

export function offsetLabel(offset) {
  if (offset === 0) return "";
  if (offset === 1) return "tomorrow";
  if (offset === -1) return "yesterday";
  return offset > 0 ? `+${offset}d` : `${offset}d`;
}

// Working hours shade the row, as the design's World Clocks entry described.
export const isDaytime = (hour) => hour >= 7 && hour < 19;

export function zoneParts(date, zone, { hour24 = false, localTz } = {}) {
  if (!isValidZone(zone?.tz)) {
    return { city: zone?.city || "—", time: "—", offset: 0, label: "", day: true };
  }
  const time = new Intl.DateTimeFormat(undefined, {
    timeZone: zone.tz,
    hour: hour24 ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: !hour24,
  }).format(date);
  const offset = dayOffset(date, zone.tz, localTz);
  const hour = hourIn(date, zone.tz);
  return {
    city: zone.city,
    tz: zone.tz,
    time,
    offset,
    label: offsetLabel(offset),
    day: isDaytime(hour),
  };
}

// Shorten "America/Argentina/Buenos_Aires" to something that fits a tile.
export function shortZone(tz) {
  if (!tz) return "";
  const tail = String(tz).split("/").pop();
  return tail.replace(/_/g, " ");
}
