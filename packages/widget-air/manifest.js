export default {
  id: "air",
  name: "Air quality",
  glyph: "air",
  category: "Essentials",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "How's the air outside.",
  description:
    "US AQI and PM2.5/PM10 from Open-Meteo — the same keyless, no-account " +
    "provider as Weather, just a different endpoint. Only the coordinates of " +
    "the city you pick are sent, and the last successful reading is cached " +
    "so the tile still shows something offline.",
  sizes: [
    [3, 2],
    [4, 2],
  ],
  defaultSize: [3, 2],
  options: [
    {
      key: "scale",
      label: "Index",
      type: "enum",
      of: ["us", "european"],
      labels: ["US AQI", "European"],
      // US by default only because that is what this tile has always shown;
      // the number is meaningless without knowing which index it is on, and
      // 55 is "moderate" in the US and "poor" in Europe.
      default: "us",
    },
    {
      key: "showPollutants",
      label: "Show PM2.5 and PM10",
      type: "boolean",
      default: true,
    },
  ],
  refresh: ["Live", "5 min", "1 hr"],
  permissions: { chrome: [], hosts: ["air-quality-api.open-meteo.com", "geocoding-api.open-meteo.com"] },
  load: () => import("./Widget.jsx"),
};
