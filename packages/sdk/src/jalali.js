// Jalali (Solar Hijri) dates.
//
// This is the calendar in civil use in Iran, and it is not a fixed-rule
// calendar: its leap years follow the true vernal equinox at Tehran, so there
// is no "every fourth year" shortcut that stays correct. The 33-year cycle
// approximation people reach for first drifts by a day within a lifetime.
//
// The algorithm below is Borkowski's, the same one behind jalaali-js, accurate
// from 1178 to 3177 AP — which covers every date anything here will ever be
// asked about. `BREAKS` are the years where the leap pattern shifts; they are
// derived from the astronomy, not chosen.

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

// Integer division and a modulo that stays positive for negative input, which
// JavaScript's % does not.
const div = (a, b) => Math.trunc(a / b);
const mod = (a, b) => a - Math.trunc(a / b) * b;

export const JALALI_MIN_YEAR = BREAKS[0] + 1;
export const JALALI_MAX_YEAR = BREAKS[BREAKS.length - 1] - 1;

// Leap-year count, the March day the year starts on, and the year's length.
function jalCal(jy) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new RangeError(`Jalali year out of range: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

export function isJalaliLeapYear(jy) {
  return jalCal(jy).leap === 0;
}

// Days in a Jalali month. The first six are 31, the next five 30, and Esfand is
// 29 or 30 depending on the leap year — which is the whole reason jalCal exists.
export function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

// Julian Day Number from a Gregorian date.
function g2d(gy, gm, gd) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

// Gregorian date from a Julian Day Number.
function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (jalCal(jy).leap === 1) k += 1;
  }

  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

// A Date to { jy, jm, jd }. Reads the *local* date parts, matching how the rest
// of the app treats dates — a UTC read would land on the wrong day either side
// of midnight.
export function toJalali(date) {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

// { jy, jm, jd } back to a local Date at midnight.
export function fromJalali(jy, jm, jd) {
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd));
  return new Date(gy, gm - 1, gd);
}

export const JALALI_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];

export const JALALI_MONTHS_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Persian digits, for when the whole line is being shown in Farsi. Latin digits
// in a Farsi month name reads as half-translated.
const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
export const toFarsiDigits = (value) =>
  String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

// "31 Mordad 1405", or the same in Farsi script.
export function formatJalali(date, { farsi = false, withYear = true } = {}) {
  const { jy, jm, jd } = toJalali(date);
  const month = farsi ? JALALI_MONTHS_FA[jm - 1] : JALALI_MONTHS[jm - 1];
  const day = farsi ? toFarsiDigits(jd) : jd;
  const year = farsi ? toFarsiDigits(jy) : jy;
  return withYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}
