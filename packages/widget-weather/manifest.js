export default {
  id: "weather",
  name: "Weather",
  glyph: "weather",
  category: "Essentials",
  author: "Daybreak",
  version: "2.1.0",
  tagline: "Current conditions and the next few hours.",
  description:
    "Weather from Open-Meteo — no API key, no account, no tracking. Only the " +
    "coordinates of the city you pick are sent, and the last successful " +
    "reading is cached so the tile still shows something offline. Each size " +
    "earns its space: wider adds the high, low and how it feels; taller adds " +
    "a detail grid and an icon on every hour.",
  sizes: [
    [3, 2],
    [4, 2],
    [4, 3],
  ],
  defaultSize: [3, 2],
  options: [
    { key: "fahrenheit", label: "Fahrenheit", type: "boolean", default: false },
    { key: "hour24", label: "24-hour times", type: "boolean", default: false },
    { key: "showHourly", label: "Show hourly strip", type: "boolean", default: true },
  ],
  refresh: ["Live", "5 min", "1 hr"],
  permissions: { chrome: [], hosts: ["api.open-meteo.com", "geocoding-api.open-meteo.com"] },
  load: () => import("./Widget.jsx"),
  // Optional: a richer settings control than the manifest's option toggles.
  settingsPanel: {
    title: "City",
    load: () => import("./Settings.jsx"),
  },
};
