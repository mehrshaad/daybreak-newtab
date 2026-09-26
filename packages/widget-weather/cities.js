// Which cities this widget holds, and which of them are on screen.
//
// The widget used to hold exactly one, as `config.city`. It holds up to five
// now, and the pure part of that — migration, keys, how many fit, which ones
// show — lives here so it can be reasoned about without a fetch or a render.

export const MAX_CITIES = 5;

// A stable identity for a city, for cache keys and for the picker's checkboxes.
//
// Coordinates and not the name: Open-Meteo returns several places called
// Kyoto, and two of them on one board would share a cache entry and overwrite
// each other's readings. Rounded, because the same place searched twice can
// come back with coordinates that differ in the sixth decimal.
export function cityKey(city) {
  if (!city) return "";
  const lat = Number(city.latitude);
  const lon = Number(city.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return String(city.name || "");
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

// Every city on the widget, from a config written by either version.
//
// A board saved before this existed has `config.city` and no `cities`, and
// must come back as a one-city widget rather than as an empty one asking them
// to pick a place they already picked.
export function citiesOf(config) {
  const list = Array.isArray(config?.cities) ? config.cities : null;
  if (list) return list.filter((c) => c && Number.isFinite(Number(c.latitude))).slice(0, MAX_CITIES);
  return config?.city?.latitude ? [config.city] : [];
}

// How many readouts fit side by side.
//
// Width only. Two readouts each need room for a temperature and a place name,
// and a tall narrow tile has no more room across than a short one.
//
// Four columns, measured rather than guessed: a four-column tile is 511px, so
// each half is about 245px, and a half renders at the narrow scale — a 26 to
// 32px temperature, the place name, and three hours. Checked on the board at
// 4x2 and 4x3 with two cities: no horizontal overflow at either, and 4x2 has
// no vertical overflow either. Six was the first guess and it was one size too
// cautious.
export function slotsFor(size) {
  const cols = Array.isArray(size) ? size[0] || 4 : 4;
  return cols >= 4 ? 2 : 1;
}

// The cities actually on screen, and never more than fit.
//
// `shown` is a list of keys the person ticked. It is filtered against the
// cities that still exist, because removing a city must not leave a tick
// behind pointing at nothing, and padded from the front of the list so a
// widget always shows something rather than going blank when the ticks and
// the slots disagree.
export function shownCities(config, size) {
  const all = citiesOf(config);
  const slots = Math.min(slotsFor(size), all.length);
  if (!all.length) return [];
  const wanted = Array.isArray(config?.shown) ? config.shown : [];
  const picked = [];
  for (const key of wanted) {
    const found = all.find((c) => cityKey(c) === key);
    if (found && !picked.includes(found)) picked.push(found);
    if (picked.length === slots) break;
  }
  for (const city of all) {
    if (picked.length >= slots) break;
    if (!picked.includes(city)) picked.push(city);
  }
  return picked;
}

// Ticking a city in the picker.
//
// A checkbox that can refuse is a checkbox that feels broken, so ticking a
// city when the slots are full drops the one that has been shown longest
// rather than doing nothing. Unticking the last one is refused instead — an
// empty weather widget is not a state anybody is asking for.
export function toggleShown(config, size, key) {
  const current = shownCities(config, size).map(cityKey);
  if (current.includes(key)) {
    if (current.length === 1) return current;
    return current.filter((k) => k !== key);
  }
  const slots = slotsFor(size);
  return [...current, key].slice(-slots);
}

// Adding a city, with the cap and the duplicate check in one place.
export function addCity(config, city) {
  const all = citiesOf(config);
  const key = cityKey(city);
  if (!key || all.some((c) => cityKey(c) === key)) return all;
  return [...all, city].slice(0, MAX_CITIES);
}

export function removeCity(config, key) {
  return citiesOf(config).filter((c) => cityKey(c) !== key);
}
