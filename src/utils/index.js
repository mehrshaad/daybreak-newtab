export const updateVariable = (variables) => {
  const root = document.querySelector(":root");
  Object.entries(variables).forEach(([variable, value]) => {
    root.style.setProperty(variable, value);
  });
};

export const classNames = (...classes) =>
  classes.filter((className) => className !== undefined).join(" ");

export function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Look up a place with the Open-Meteo geocoding API (no API key required).
// Returns { name, country, latitude, longitude, timezone } or null. Cached in
// memory for the session so repeated lookups of the same name are free.
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

// Map a WMO weather code (returned by Open-Meteo) to an icon key understood by
// IconWeather and a short human-readable label.
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

// Supported web-search engines for the search box.
export const SEARCH_ENGINES = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
};

// Time-of-day greeting, optionally personalized with a name.
export const greeting = (name) => {
  const h = new Date().getHours();
  const part =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const who = (name || "").trim();
  return who ? `${part}, ${who}!` : `${part}!`;
};

// Derive a site's own favicon URL, used as a fallback shortcut icon. Kept
// first-party (the bookmarked site itself) so no data goes to a third party.
export const faviconFromUrl = (url) => {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return null;
  }
};

export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
