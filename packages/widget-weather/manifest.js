export default {
  id: "weather",
  name: "Weather",
  glyph: "weather",
  category: "Essentials",
  author: "Daybreak",
  version: "2.4.0",
  tagline: "Current conditions and the next few hours.",
  description:
    "Weather from Open-Meteo — no API key, no account, no tracking. Only the " +
    "coordinates of the city you pick are sent, and the last successful " +
    "reading is cached so the tile still shows something offline. Each size " +
    "earns its space: wider adds the high, low and how it feels; taller adds " +
    "an icon on every hour and room for the week ahead. Switch on the day-by-" +
    "day strip, the chance of rain, the wind, the humidity or the UV index, " +
    "and centre the readout if you would rather.",
  sizes: [
    [2, 2],
    [3, 2],
    [4, 2],
    [3, 3],
    [4, 3],
    // Wide and tall, which is what the day-by-day strip wants: seven columns
    // of icon and two temperatures need six board columns to read, and
    // layoutFor already widens to a full week there.
    [6, 3],
  ],
  defaultSize: [3, 2],
  options: [
    {
      key: "align",
      label: "Alignment",
      type: "enum",
      of: ["left", "center"],
      labels: { left: "Left", center: "Centre" },
      // Left is what it has always been, so no board changes by updating.
      default: "left",
    },
    { key: "fahrenheit", label: "Fahrenheit", type: "boolean", default: false },
    { key: "hour24", label: "24-hour times", type: "boolean", default: false },
    {
      key: "forecast",
      label: "Forecast",
      type: "enum",
      of: ["hourly", "daily", "none"],
      labels: { hourly: "Next hours", daily: "Day by day", none: "Neither" },
      // One control, not two switches, because they cannot both be on: the two
      // strips are the same band of the tile and drawing them together filled
      // it edge to edge with numbers. A pair of booleans lets somebody ask for
      // that; an enum cannot express it.
      //
      // "hourly" is what the widget has always shown, so no board changes by
      // updating.
      default: "hourly",
    },
    // Day by day needs the height for an icon and two temperatures per column.
    { key: "showRain", label: "Chance of rain", type: "boolean", default: false, showIf: { wide: true } },
    { key: "showWind", label: "Wind", type: "boolean", default: false, showIf: { wide: true } },
    { key: "showHumidity", label: "Humidity", type: "boolean", default: false, showIf: { wide: true } },
    { key: "showUv", label: "UV index", type: "boolean", default: false, showIf: { wide: true } },
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
