export const classNames = (...classes) =>
  classes.filter(Boolean).join(" ");

// Look up a place with the Open-Meteo geocoding API (no API key required).
// Returns { name, country, latitude, longitude, timezone } or null. Cached in
// memory for the session so repeated lookups of the same name are free.
// The `timezone` field is what the World Clocks widget stores per zone.
const _geoCache = {};
export async function geocodeCity(name) {
  const key = (name || "").trim().toLowerCase();
  if (!key) return null;
  if (_geoCache[key]) return _geoCache[key];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        name
      )}&count=1&language=en&format=json`
    );
    const data = await res.json();
    const r = data.results && data.results[0];
    if (!r) return null;
    const geo = {
      name: r.name,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    };
    _geoCache[key] = geo;
    return geo;
  } catch {
    return null;
  }
}

// Type-ahead variant: several matches, for the city pickers.
export async function searchCities(query, count = 8) {
  const q = (query || "").trim();
  if (!q) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q
      )}&count=${count}&language=en&format=json`
    );
    const data = await res.json();
    return (data.results || []).map((r) => ({
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }));
  } catch {
    return [];
  }
}

// Map a WMO weather code (returned by Open-Meteo) to a condition key and a
// short human-readable label.
export function wmoWeather(code) {
  const map = {
    0: ["clear", "Clear"],
    1: ["clear", "Mainly clear"],
    2: ["clouds", "Partly cloudy"],
    3: ["clouds", "Overcast"],
    45: ["fog", "Fog"],
    48: ["fog", "Rime fog"],
    51: ["drizzle", "Light drizzle"],
    53: ["drizzle", "Drizzle"],
    55: ["drizzle", "Dense drizzle"],
    56: ["drizzle", "Freezing drizzle"],
    57: ["drizzle", "Freezing drizzle"],
    61: ["rain", "Light rain"],
    63: ["rain", "Rain"],
    65: ["rain", "Heavy rain"],
    66: ["rain", "Freezing rain"],
    67: ["rain", "Freezing rain"],
    71: ["snow", "Light snow"],
    73: ["snow", "Snow"],
    75: ["snow", "Heavy snow"],
    77: ["snow", "Snow grains"],
    80: ["rain", "Rain showers"],
    81: ["rain", "Rain showers"],
    82: ["rain", "Violent showers"],
    85: ["snow", "Snow showers"],
    86: ["snow", "Snow showers"],
    95: ["thunderstorm", "Thunderstorm"],
    96: ["thunderstorm", "Thunderstorm, hail"],
    99: ["thunderstorm", "Thunderstorm, hail"],
  };
  const [condition, label] = map[code] ?? ["clear", "—"];
  return { condition, label };
}

// Supported web-search engines for the header search box.
export const SEARCH_ENGINES = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
};

// Time-of-day greeting, optionally personalized with a name. v2 renders this
// without the trailing "!" the v1 layout used.
export const greeting = (name, date = new Date()) => {
  const h = date.getHours();
  const part =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const who = (name || "").trim();
  return who ? `${part}, ${who}` : part;
};

export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayKey = () => formatDate(new Date());

// The inverse of formatDate, and it has to be hand-rolled: formatDate builds
// its key from local getters, but `new Date("2026-08-07")` is parsed as UTC
// midnight, which in any negative offset is the previous day. Reading the parts
// out and handing them to the local constructor round-trips exactly.
export const parseDateKey = (key) => {
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "Wed". Through the browser's own locale rather than a hardcoded table, so it
// follows the user's language the way every other date in the app does.
export const weekdayShort = (key, locale) => {
  const date = typeof key === "string" ? parseDateKey(key) : key;
  if (!date) return "";
  return date.toLocaleDateString(locale, { weekday: "short" });
};

// Stable id without pulling in a uuid dependency.
export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Clamp helper used by the grid sliders and size pickers.
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
