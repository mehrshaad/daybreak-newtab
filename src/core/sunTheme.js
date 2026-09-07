import { sunTimes } from "@daybreak/sdk";

// Light by day, dark after sunset, for wherever you are.
//
// "System" already does something like this on a machine set to follow the
// sun, but most are not: they are set to dark, or to light, or to a schedule
// somebody typed in once. And a new tab page is the page you see at 7am and at
// 11pm, so it is the one place where the actual sky is the right answer.
//
// The hard part is not the astronomy — sunTimes is exact and needs no network.
// It is knowing where you are, from a page that has no permission to ask.

// Widgets that hold a city, in the order they are trusted. Weather first: it
// is the one almost everybody sets, and the one they set to where they are
// rather than somewhere they are curious about.
const CITY_WIDGETS = ["weather", "sun", "air", "prayer"];

export const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

// A latitude for a timezone.
//
// Longitude does not need a table — see zoneLocation. Latitude cannot be
// derived from anything the browser will tell us, and it is the half that
// matters: it decides how long the day is, and therefore how wrong the answer
// gets in December.
//
// So: the zones that cover most people, and a per-region average for the rest.
// This is the fallback for when no widget names a city in the local timezone,
// and being twenty minutes out on a theme switch is a fair price for asking
// nobody for their location. When it matters, setting the Weather widget to
// your own city makes it exact.
const ZONE_LATITUDE = {
  "Europe/London": 51.5,
  "Europe/Dublin": 53.3,
  "Europe/Lisbon": 38.7,
  "Europe/Madrid": 40.4,
  "Europe/Paris": 48.9,
  "Europe/Brussels": 50.8,
  "Europe/Amsterdam": 52.4,
  "Europe/Berlin": 52.5,
  "Europe/Zurich": 47.4,
  "Europe/Rome": 41.9,
  "Europe/Vienna": 48.2,
  "Europe/Prague": 50.1,
  "Europe/Warsaw": 52.2,
  "Europe/Stockholm": 59.3,
  "Europe/Oslo": 59.9,
  "Europe/Copenhagen": 55.7,
  "Europe/Helsinki": 60.2,
  "Europe/Athens": 38.0,
  "Europe/Bucharest": 44.4,
  "Europe/Istanbul": 41.0,
  "Europe/Kyiv": 50.5,
  "Europe/Moscow": 55.8,
  "America/New_York": 40.7,
  "America/Toronto": 43.7,
  "America/Chicago": 41.9,
  "America/Denver": 39.7,
  "America/Phoenix": 33.4,
  "America/Los_Angeles": 34.1,
  "America/Vancouver": 49.2,
  "America/Mexico_City": 19.4,
  "America/Bogota": 4.7,
  "America/Lima": -12.0,
  "America/Santiago": -33.4,
  "America/Sao_Paulo": -23.5,
  "America/Argentina/Buenos_Aires": -34.6,
  "Asia/Tehran": 35.7,
  "Asia/Dubai": 25.2,
  "Asia/Riyadh": 24.7,
  "Asia/Jerusalem": 31.8,
  "Asia/Baghdad": 33.3,
  "Asia/Karachi": 24.9,
  "Asia/Kolkata": 22.6,
  "Asia/Calcutta": 22.6,
  "Asia/Dhaka": 23.8,
  "Asia/Bangkok": 13.8,
  "Asia/Jakarta": -6.2,
  "Asia/Singapore": 1.4,
  "Asia/Manila": 14.6,
  "Asia/Hong_Kong": 22.3,
  "Asia/Shanghai": 31.2,
  "Asia/Taipei": 25.0,
  "Asia/Seoul": 37.6,
  "Asia/Tokyo": 35.7,
  "Australia/Perth": -31.9,
  "Australia/Adelaide": -34.9,
  "Australia/Brisbane": -27.5,
  "Australia/Sydney": -33.9,
  "Australia/Melbourne": -37.8,
  "Pacific/Auckland": -36.9,
  "Africa/Cairo": 30.0,
  "Africa/Lagos": 6.5,
  "Africa/Nairobi": -1.3,
  "Africa/Johannesburg": -26.2,
  "Africa/Casablanca": 33.6,
};

// Where a region sits on average, for a zone not named above. Rough on
// purpose: the alternative was four hundred more lines of table for the sake
// of somebody in Kathmandu whose Weather widget would fix it exactly.
const REGION_LATITUDE = {
  Europe: 50,
  America: 38,
  Asia: 30,
  Africa: 5,
  Australia: -30,
  Pacific: -18,
  Atlantic: 35,
  Indian: -12,
  Antarctica: -70,
  Arctic: 78,
};

// The zone's offset from UTC in minutes, for a given moment.
//
// Read from Intl rather than from Date's own getTimezoneOffset, which only
// ever answers for the machine's own zone. Positive east of Greenwich, which
// is the opposite sign from getTimezoneOffset and the same sign as longitude.
//
// Null, not zero, where there is no answer. An empty string and an
// unrecognised name both throw RangeError here, and zero is a real offset —
// Greenwich — so returning it would put somebody whose timezone could not be
// read on the prime meridian at the equator and switch their theme at 6am
// with total confidence. Null means "nobody knows", which resolves to the
// system setting instead. (`undefined` is different: Intl reads that as "the
// local zone", which is a perfectly good answer.)
export function zoneOffsetMinutes(zone, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;
    // "GMT+03:30", or plain "GMT" at zero.
    const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(parts || "");
    if (!match) return /^GMT$/.test(parts || "") ? 0 : null;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
  } catch {
    return null;
  }
}

// A point in the middle of a timezone.
//
// Longitude comes out of the offset exactly, which is what a timezone is for:
// fifteen degrees to the hour, and the meridian at the middle of the zone is
// the one its clock is set to. It is not where any particular person is, but
// it is the centre of the band they are in, and four minutes of degree is the
// whole error.
export function zoneLocation(zone) {
  const offset = zoneOffsetMinutes(zone);
  if (offset == null) return null;
  const region = String(zone || "").split("/")[0];
  const latitude = ZONE_LATITUDE[zone] ?? REGION_LATITUDE[region] ?? 0;
  return { latitude, longitude: (offset / 60) * 15 };
}

// Where to compute the sun for.
//
// A city named in a widget, but only where its timezone is the browser's:
// somebody watching the weather in Tokyo from London is curious about Tokyo,
// not standing in it, and switching their theme at Tokyo's sunset would be
// the wrong answer arrived at confidently. When the two agree, it is where
// they are, and it is exact.
export function sunLocation(widgets, zone = browserZone()) {
  for (const id of CITY_WIDGETS) {
    const city = widgets?.[id]?.config?.city;
    if (!city || city.timezone !== zone) continue;
    if (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) continue;
    return {
      latitude: city.latitude,
      longitude: city.longitude,
      name: city.name || "",
      exact: true,
    };
  }
  const guess = zoneLocation(zone);
  return guess ? { ...guess, name: "", exact: false } : null;
}

// Light between sunrise and sunset, dark otherwise. Null where the sun does
// not rise or set at all — a polar summer or winter, where there is no
// sunset to switch on and the honest thing is to let something else decide.
export function sunTheme(date, place) {
  if (!place) return null;
  const { sunrise, sunset } = sunTimes(date, place.latitude, place.longitude);
  if (!sunrise || !sunset) return null;
  return date >= sunrise && date < sunset ? "light" : "dark";
}

// When the theme next changes, so the switch can be scheduled rather than
// polled. Looks at today's pair and tomorrow's, because after today's sunset
// the next event is tomorrow's sunrise.
export function nextSunSwitch(date, place) {
  if (!place) return null;
  const days = [0, 1].map((ahead) => {
    const d = new Date(date);
    d.setDate(d.getDate() + ahead);
    return sunTimes(d, place.latitude, place.longitude);
  });
  const marks = days
    .flatMap(({ sunrise, sunset }) => [sunrise, sunset])
    .filter((t) => t && t > date)
    .sort((a, b) => a - b);
  return marks[0] || null;
}
