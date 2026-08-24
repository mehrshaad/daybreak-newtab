// Prayer times, computed here rather than fetched.
//
// Every prayer time is the moment the sun reaches a particular altitude, so
// this is the same geometry the Sun widget uses — no network, no key, and it
// works on a plane. What it is *not* is a single formula: the conventions
// disagree, by up to twenty minutes for Fajr, and picking one silently would be
// wrong for most of the people it is wrong for.
//
// So the method is a setting. The numbers below are the published parameters of
// each authority, not adjustments invented here.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// Fajr and Isha are defined by how far the sun is below the horizon. Maghrib is
// sunset except in the Jafari reckoning, where it is a depression angle too,
// and Isha is sometimes a fixed interval after Maghrib rather than an angle.
export const METHODS = {
  tehran: {
    label: "Tehran (Institute of Geophysics)",
    fajr: 17.7,
    isha: 14,
    maghrib: 4.5,
  },
  jafari: {
    label: "Jafari (Leva Institute)",
    fajr: 16,
    isha: 14,
    maghrib: 4,
  },
  mwl: { label: "Muslim World League", fajr: 18, isha: 17 },
  isna: { label: "ISNA (North America)", fajr: 15, isha: 15 },
  egypt: { label: "Egyptian General Authority", fajr: 19.5, isha: 17.5 },
  karachi: { label: "University of Karachi", fajr: 18, isha: 18 },
  makkah: {
    label: "Umm al-Qura (Makkah)",
    fajr: 18.5,
    // Umm al-Qura does not use an angle for Isha: it is 90 minutes after
    // Maghrib, and 120 during Ramadan. The Ramadan variation is deliberately
    // not applied — it needs a Hijri calendar and a decision about which day
    // Ramadan starts, which is exactly the sort of thing that goes stale.
    ishaInterval: 90,
  },
  dubai: { label: "Dubai", fajr: 18.2, isha: 18.2 },
  qatar: { label: "Qatar", fajr: 18, ishaInterval: 90 },
  singapore: { label: "Singapore", fajr: 20, isha: 18 },
};

export const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_LABELS = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const PRAYER_LABELS_FA = {
  fajr: "اذان صبح",
  sunrise: "طلوع آفتاب",
  dhuhr: "اذان ظهر",
  asr: "عصر",
  maghrib: "اذان مغرب",
  isha: "عشا",
};

const J2000 = 2451545;
const MS_PER_DAY = 86400000;
const UNIX_EPOCH_JD = 2440587.5;

// Days since J2000 for the *noon* of a local calendar day. Prayer times are a
// property of a day in a place, not of an instant, so the day is fixed first
// and every time within it derived from that.
function daysFor(date) {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  return noon.getTime() / MS_PER_DAY + UNIX_EPOCH_JD - J2000;
}

// Solar declination and the equation of time, in degrees and minutes.
function sunParams(d) {
  const g = RAD * (357.529 + 0.98560028 * d);
  const q = 280.459 + 0.98564736 * d;
  const L = RAD * (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const e = RAD * (23.439 - 0.00000036 * d);

  const declination = Math.asin(Math.sin(e) * Math.sin(L)) * DEG;
  let ra = (Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) * DEG) / 15;
  ra = ((ra % 24) + 24) % 24;

  // `q` is a mean longitude that grows without bound — about 9,900 degrees by
  // 2026 — so it has to come back into 0..360 before being read as an hour
  // angle. Skipping that made the equation of time come out at ~645 *hours*.
  // It hid well: 645h happened to be close to a whole number of days, so every
  // prayer landed at the right time of day on a date 27 days adrift, and only a
  // test that asked which day it was could see it.
  const qHours = ((((q % 360) + 360) % 360)) / 15;
  let equationOfTime = qHours - ra;
  if (equationOfTime > 12) equationOfTime -= 24;
  if (equationOfTime < -12) equationOfTime += 24;

  return { declination, equationOfTime };
}

// Hour angle, in hours, at which the sun sits `angle` degrees below the
// horizon. Null where it never does — a high-latitude summer, where these
// definitions simply run out.
function hourAngle(angle, latitude, declination) {
  const lat = RAD * latitude;
  const dec = RAD * declination;
  const cos = (-Math.sin(RAD * angle) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  if (cos > 1 || cos < -1) return null;
  return (Math.acos(cos) * DEG) / 15;
}

// Asr is not a depression angle: it is when a shadow has grown by a factor over
// its noon length. One in the standard reckoning, two for the Hanafi.
function asrHourAngle(shadowFactor, latitude, declination) {
  const lat = RAD * latitude;
  const dec = RAD * declination;
  const angle = -DEG * Math.atan(1 / (shadowFactor + Math.tan(Math.abs(lat - dec) * RAD)));
  return hourAngle(angle, latitude, declination);
}

const toDate = (date, hours) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(base.getTime() + Math.round(hours * 3600000));
};

// Every prayer for one day in one place.
//
// `timeZoneOffsetHours` is the place's offset from UTC, not the viewer's: a
// prayer time in Tehran belongs on Tehran's clock, and formatting it against
// the browser's zone is what makes Fajr look like it happens in the evening.
export function prayerTimes({
  date = new Date(),
  latitude,
  longitude,
  method = "tehran",
  asr = "standard",
  timeZoneOffsetHours,
  adjustments = {},
}) {
  const config = METHODS[method] || METHODS.tehran;
  const d = daysFor(date);
  const { declination, equationOfTime } = sunParams(d);

  // Local solar noon, expressed on the place's own clock.
  const offset = Number.isFinite(timeZoneOffsetHours)
    ? timeZoneOffsetHours
    : -new Date().getTimezoneOffset() / 60;
  const dhuhr = 12 - equationOfTime - longitude / 15 + offset;

  const sunriseAngle = 0.833;
  const riseSpan = hourAngle(sunriseAngle, latitude, declination);
  const fajrSpan = hourAngle(config.fajr, latitude, declination);
  const asrSpan = asrHourAngle(asr === "hanafi" ? 2 : 1, latitude, declination);
  const maghribSpan =
    config.maghrib != null ? hourAngle(config.maghrib, latitude, declination) : riseSpan;

  const times = {
    fajr: fajrSpan == null ? null : dhuhr - fajrSpan,
    sunrise: riseSpan == null ? null : dhuhr - riseSpan,
    dhuhr,
    asr: asrSpan == null ? null : dhuhr + asrSpan,
    maghrib: maghribSpan == null ? null : dhuhr + maghribSpan,
    isha: null,
  };

  if (config.ishaInterval != null) {
    times.isha = times.maghrib == null ? null : times.maghrib + config.ishaInterval / 60;
  } else {
    const ishaSpan = hourAngle(config.isha, latitude, declination);
    times.isha = ishaSpan == null ? null : dhuhr + ishaSpan;
  }

  const out = {};
  for (const name of PRAYERS) {
    const hours = times[name];
    const shift = Number(adjustments[name]) || 0;
    out[name] = hours == null ? null : toDate(date, hours + shift / 60);
  }
  return out;
}

// Which one is now, and which is next. Sunrise is a marker rather than a
// prayer, so it can be next but is never "current".
export function currentAndNext(times, now = new Date()) {
  const ordered = PRAYERS.map((name) => ({ name, at: times[name] })).filter((p) => p.at);

  let current = null;
  let next = null;
  for (const entry of ordered) {
    if (entry.at <= now) current = entry;
    else if (!next) next = entry;
  }
  // Past Isha the next prayer is tomorrow's Fajr, which this day's table cannot
  // name. The caller asks for tomorrow rather than being told "nothing".
  return { current, next };
}

export function untilLabel(target, now = new Date()) {
  if (!target) return "";
  const ms = target - now;
  if (ms <= 0) return "now";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `in ${minutes}m`;
  return `in ${hours}h ${String(minutes).padStart(2, "0")}m`;
}
