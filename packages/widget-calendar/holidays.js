import { toHijri, toJalali } from "@daybreak/sdk";

// Iranian public holidays, bundled rather than fetched.
//
// There is no keyless, CORS-open API for these — the small services that exist
// need a key, and one of them going away would take the feature with it. A
// table is the honest shape for data that changes once a year at most.
//
// Two kinds, and they behave differently, which is the whole reason this file
// needs a comment rather than just a list:
//
// Solar. Fixed to a Jalali month and day, so they are the same date every year
// and correct for as long as the official list stands.
//
// Lunar. Fixed to a Hijri month and day, which means they move about eleven
// days earlier in the Gregorian year each year. Worse, Iran sets them by
// sighting the moon, so the official day can land one either side of what the
// Umm al-Qura calendar computes. They are marked as computed for that reason,
// and the widget says so. A calendar quietly showing a religious holiday on the
// wrong day is worse than one that admits it might be a day out.
export const HOLIDAY_SOURCE_YEAR = 1404;

// Named by the Jalali month index (1 = Farvardin) and the day.
export const SOLAR_HOLIDAYS = [
  { month: 1, day: 1, name: "Nowruz" },
  { month: 1, day: 2, name: "Nowruz" },
  { month: 1, day: 3, name: "Nowruz" },
  { month: 1, day: 4, name: "Nowruz" },
  { month: 1, day: 12, name: "Islamic Republic Day" },
  { month: 1, day: 13, name: "Sizdah Bedar" },
  { month: 3, day: 14, name: "Death of Khomeini" },
  { month: 3, day: 15, name: "Revolt of Khordad 15" },
  { month: 11, day: 22, name: "Anniversary of the Revolution" },
  { month: 12, day: 29, name: "Nationalisation of the oil industry" },
];

// Named by the Hijri month index (1 = Muharram) and the day.
export const LUNAR_HOLIDAYS = [
  { month: 1, day: 9, name: "Tasu'a" },
  { month: 1, day: 10, name: "Ashura" },
  { month: 2, day: 20, name: "Arbaeen" },
  { month: 2, day: 28, name: "Death of the Prophet and Hasan ibn Ali" },
  // The last day of Safar, whether that is the 29th or the 30th, rather than
  // both. Listing it as two fixed days put it on two consecutive days in every
  // year where Safar runs to 30 — which August 2026 does, and which is how this
  // was spotted: three red days in a row in the grid.
  { month: 2, lastDay: true, name: "Death of Ali al-Rida" },
  { month: 3, day: 8, name: "Death of Hasan al-Askari" },
  { month: 3, day: 17, name: "Birth of the Prophet and Ja'far al-Sadiq" },
  { month: 6, day: 3, name: "Death of Fatima" },
  { month: 7, day: 13, name: "Birth of Ali" },
  { month: 7, day: 27, name: "Mission of the Prophet" },
  { month: 8, day: 15, name: "Birth of the Mahdi" },
  { month: 9, day: 21, name: "Death of Ali" },
  { month: 10, day: 1, name: "Eid al-Fitr" },
  { month: 10, day: 2, name: "Eid al-Fitr" },
  { month: 10, day: 25, name: "Death of Ja'far al-Sadiq" },
  { month: 12, day: 10, name: "Eid al-Adha" },
  { month: 12, day: 18, name: "Eid al-Ghadir" },
];

// Indexed once rather than scanned per cell: a month grid asks this 42 times per
// render, and a calendar paging through a year asks it hundreds of times.
const solarIndex = new Map();
for (const h of SOLAR_HOLIDAYS) {
  const key = `${h.month}-${h.day}`;
  solarIndex.set(key, [...(solarIndex.get(key) || []), h.name]);
}

const lunarIndex = new Map();
const lunarLastDay = new Map();
for (const h of LUNAR_HOLIDAYS) {
  if (h.lastDay) {
    lunarLastDay.set(h.month, [...(lunarLastDay.get(h.month) || []), h.name]);
    continue;
  }
  const key = `${h.month}-${h.day}`;
  lunarIndex.set(key, [...(lunarIndex.get(key) || []), h.name]);
}

// Whether a date is the last day of its Hijri month, asked by looking at the
// next day rather than by knowing month lengths — the month-length table is
// Intl's business and duplicating it here is how the two would drift apart.
function isLastDayOfHijriMonth(date, hijri) {
  const next = toHijri(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
  return !!next && next.month !== hijri.month;
}

// Every holiday falling on a given day, each saying whether its date is fixed
// or computed. Returns an empty array rather than null so a caller can map over
// it without checking.
export function holidaysOn(date) {
  const out = [];
  const jalali = toJalali(date);
  for (const name of solarIndex.get(`${jalali.jm}-${jalali.jd}`) || []) {
    out.push({ name, kind: "solar" });
  }
  const hijri = toHijri(date);
  if (hijri) {
    const names = [...(lunarIndex.get(`${hijri.month}-${hijri.day}`) || [])];
    if (lunarLastDay.has(hijri.month) && isLastDayOfHijriMonth(date, hijri)) {
      names.push(...lunarLastDay.get(hijri.month));
    }
    // Deduplicated by name, so a day that satisfies two rules for the same
    // holiday still reports it once.
    for (const name of names) {
      if (!out.some((h) => h.name === name)) out.push({ name, kind: "lunar" });
    }
  }
  return out;
}

export function isHoliday(date) {
  return holidaysOn(date).length > 0;
}
