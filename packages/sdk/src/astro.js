// Where the sun and moon are, worked out on the spot.
//
// Every widget built on this — Sun & daylight, Moon phase, Prayer times — needs
// nothing from the network and no API key. The sky is a function of time and
// a place on a sphere, and that function is short enough to carry around.
//
// The algorithms are the standard low-precision ones from Astronomical
// Algorithms (Meeus), which is what NOAA's own solar calculator uses. Accurate
// to well under a minute for sunrise and sunset, which is far finer than a
// widget showing "05:42" can express.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// Days from the J2000.0 epoch (2000-01-01 12:00 TT).
const J2000 = 2451545;
const MS_PER_DAY = 86400000;
// Julian date of the Unix epoch.
const UNIX_EPOCH_JD = 2440587.5;

export function toJulian(date) {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

export function fromJulian(julian) {
  return new Date((julian - UNIX_EPOCH_JD) * MS_PER_DAY);
}

function days(date) {
  return toJulian(date) - J2000;
}

// --- The sun -------------------------------------------------------------

// Mean anomaly of the sun.
function solarMeanAnomaly(d) {
  return RAD * (357.5291 + 0.98560028 * d);
}

// Apparent ecliptic longitude, mean anomaly plus the equation of the centre
// plus the perihelion of Earth.
function eclipticLongitude(m) {
  const centre = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
  const perihelion = RAD * 102.9372;
  return m + centre + perihelion + Math.PI;
}

// Obliquity of the ecliptic.
const OBLIQUITY = RAD * 23.4397;

function declination(longitude) {
  return Math.asin(Math.sin(OBLIQUITY) * Math.sin(longitude));
}

function rightAscension(longitude) {
  return Math.atan2(Math.sin(longitude) * Math.cos(OBLIQUITY), Math.cos(longitude));
}

function siderealTime(d, longitudeWest) {
  return RAD * (280.16 + 360.9856235 * d) - longitudeWest;
}

function altitude(hourAngle, latitude, dec) {
  return Math.asin(
    Math.sin(latitude) * Math.sin(dec) + Math.cos(latitude) * Math.cos(dec) * Math.cos(hourAngle)
  );
}

function azimuth(hourAngle, latitude, dec) {
  return Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(dec) * Math.cos(latitude)
  );
}

// Where the sun is, right now, from here.
export function sunPosition(date, latitude, longitude) {
  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const d = days(date);
  const m = solarMeanAnomaly(d);
  const l = eclipticLongitude(m);
  const dec = declination(l);
  const ra = rightAscension(l);
  const h = siderealTime(d, lw) - ra;
  return {
    // Degrees above the horizon. Negative is below it.
    altitude: altitude(h, phi, dec) * DEG,
    // Degrees clockwise from north.
    azimuth: (azimuth(h, phi, dec) * DEG + 180) % 360,
    declination: dec * DEG,
  };
}

// --- Sunrise, sunset and the rest of the day's marks ---------------------

const J0 = 0.0009;

function julianCycle(d, lw) {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}

function approxTransit(ht, lw, n) {
  return J0 + (ht + lw) / (2 * Math.PI) + n;
}

function solarTransitJulian(ds, m, l) {
  return J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);
}

function hourAngle(h, phi, dec) {
  return Math.acos(
    (Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))
  );
}

// The moment the sun's centre reaches a given altitude, going down (set) — and
// its mirror going up (rise). Returns null where it never gets there, which is
// the honest answer inside a polar summer or winter rather than a wrong time.
function timesAtAltitude(angleDeg, date, latitude, longitude) {
  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const d = days(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const m = solarMeanAnomaly(ds);
  const l = eclipticLongitude(m);
  const dec = declination(l);
  const noon = solarTransitJulian(ds, m, l);

  const h = RAD * angleDeg;
  const cos = (Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  // Outside [-1, 1] the sun never crosses that altitude on this day at all.
  if (cos > 1 || cos < -1) return { rise: null, set: null, noon: fromJulian(noon) };

  const w = hourAngle(h, phi, dec);
  const setJ = solarTransitJulian(approxTransit(w, lw, n), m, l);
  const riseJ = noon - (setJ - noon);
  return { rise: fromJulian(riseJ), set: fromJulian(setJ), noon: fromJulian(noon) };
}

// The altitudes each mark is defined at. Sunrise uses -0.833° rather than 0°:
// the sun's own radius plus atmospheric refraction means its upper edge clears
// the horizon while its centre is still below it, which is what "sunrise"
// actually means.
export const SUN_ANGLES = {
  sunrise: -0.833,
  goldenHour: 6,
  civilDusk: -6,
  nauticalDusk: -12,
  astronomicalDusk: -18,
};

// Everything a day is made of, for a place.
export function sunTimes(date, latitude, longitude) {
  const day = timesAtAltitude(SUN_ANGLES.sunrise, date, latitude, longitude);
  const golden = timesAtAltitude(SUN_ANGLES.goldenHour, date, latitude, longitude);
  const civil = timesAtAltitude(SUN_ANGLES.civilDusk, date, latitude, longitude);

  return {
    sunrise: day.rise,
    sunset: day.set,
    solarNoon: day.noon,
    // The soft light: below this the sun is low enough for it.
    goldenHourEnd: golden.rise,
    goldenHour: golden.set,
    dawn: civil.rise,
    dusk: civil.set,
    // Null through a polar day or night, where there is no length to give.
    dayLength: day.rise && day.set ? (day.set - day.rise) / 1000 : null,
  };
}

// How much longer today is than yesterday, in seconds. The number that makes a
// daylight widget worth looking at twice.
export function dayLengthDelta(date, latitude, longitude) {
  const today = sunTimes(date, latitude, longitude).dayLength;
  const before = new Date(date);
  before.setDate(before.getDate() - 1);
  const yesterday = sunTimes(before, latitude, longitude).dayLength;
  if (today == null || yesterday == null) return null;
  return today - yesterday;
}

// How far through the day the sun is, 0 at sunrise and 1 at sunset. Outside
// those it clamps, so a widget can place the sun on an arc without deciding
// what "before sunrise" means on its own.
export function dayProgress(date, latitude, longitude) {
  const { sunrise, sunset } = sunTimes(date, latitude, longitude);
  if (!sunrise || !sunset) return null;
  const span = sunset - sunrise;
  if (span <= 0) return null;
  return Math.max(0, Math.min(1, (date - sunrise) / span));
}

// --- The moon ------------------------------------------------------------

function moonCoords(d) {
  // Geocentric ecliptic coordinates.
  const eclipticLongitudeMoon = RAD * (218.316 + 13.176396 * d);
  const meanAnomaly = RAD * (134.963 + 13.064993 * d);
  const meanDistance = RAD * (93.272 + 13.22935 * d);

  const longitude = eclipticLongitudeMoon + RAD * 6.289 * Math.sin(meanAnomaly);
  const latitude = RAD * 5.128 * Math.sin(meanDistance);
  const distance = 385001 - 20905 * Math.cos(meanAnomaly);

  return {
    ra: rightAscension(longitude),
    dec: Math.asin(
      Math.sin(latitude) * Math.cos(OBLIQUITY) +
        Math.cos(latitude) * Math.sin(OBLIQUITY) * Math.sin(longitude)
    ),
    distance,
  };
}

// Phase as a fraction: 0 and 1 are new, 0.5 is full, 0.25 first quarter, 0.75
// last quarter. Illumination is the lit fraction of the disc, which is *not*
// the same number — it peaks at 1 when the phase is 0.5.
export function moonPhase(date) {
  const d = days(date);
  const s = { ...moonCoords(d) };
  const m = solarMeanAnomaly(d);
  const sunLongitude = eclipticLongitude(m);
  const sunDistance = 149598000;

  const phi = Math.acos(
    Math.sin(declination(sunLongitude)) * Math.sin(s.dec) +
      Math.cos(declination(sunLongitude)) * Math.cos(s.dec) * Math.cos(rightAscension(sunLongitude) - s.ra)
  );
  const inc = Math.atan2(sunDistance * Math.sin(phi), s.distance - sunDistance * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(declination(sunLongitude)) * Math.sin(rightAscension(sunLongitude) - s.ra),
    Math.sin(declination(sunLongitude)) * Math.cos(s.dec) -
      Math.cos(declination(sunLongitude)) * Math.sin(s.dec) * Math.cos(rightAscension(sunLongitude) - s.ra)
  );

  return {
    // 0..1 through the synodic month.
    phase: 0.5 + (0.5 * inc * Math.sign(angle)) / Math.PI,
    illumination: (1 + Math.cos(inc)) / 2,
    // Which way the lit limb faces, so a drawing can be tilted the way the
    // real thing is rather than always lit from one side.
    angle,
  };
}

export const MOON_PHASE_NAMES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];

// The eight names, with the four exact phases given a narrow window so that
// "First quarter" means near enough the quarter rather than a whole week of it.
export function moonPhaseName(phase) {
  const p = ((phase % 1) + 1) % 1;
  const near = 0.02;
  if (p < near || p > 1 - near) return MOON_PHASE_NAMES[0];
  if (Math.abs(p - 0.25) < near) return MOON_PHASE_NAMES[2];
  if (Math.abs(p - 0.5) < near) return MOON_PHASE_NAMES[4];
  if (Math.abs(p - 0.75) < near) return MOON_PHASE_NAMES[6];
  if (p < 0.25) return MOON_PHASE_NAMES[1];
  if (p < 0.5) return MOON_PHASE_NAMES[3];
  if (p < 0.75) return MOON_PHASE_NAMES[5];
  return MOON_PHASE_NAMES[7];
}

// Mean length of a synodic month, in days — new moon to new moon.
export const SYNODIC_MONTH = 29.530588853;

// Days until the next full or new moon, from the current phase. Approximate by
// design: it assumes the mean month rather than solving for the real one, which
// is good to a few hours and plenty for "full moon in 6 days".
export function daysUntilPhase(currentPhase, targetPhase) {
  let delta = targetPhase - currentPhase;
  if (delta < 0) delta += 1;
  return delta * SYNODIC_MONTH;
}
