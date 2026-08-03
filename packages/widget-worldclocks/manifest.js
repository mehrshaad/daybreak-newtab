export default {
  id: "worldclocks",
  name: "World Clocks",
  glyph: "clock",
  category: "Essentials",
  author: "Daybreak",
  version: "2.1.0",
  tagline: "Two to four cities, side by side.",
  description:
    "Track the time in the places you care about. Add a city and Daybreak " +
    "picks up its timezone automatically; the browser handles DST, so there " +
    "is nothing to keep up to date and nothing to fetch after the first " +
    "lookup. Rows are shaded by whether it is daytime there, and can be " +
    "dragged into whatever order you like while editing the layout.",
  // The taller sizes are where the extra room pays: four cities sit
  // comfortably and each row can carry its timezone.
  sizes: [
    [3, 2],
    [4, 2],
    [3, 3],
    [4, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "hour24", label: "24-hour time", type: "boolean", default: false },
    { key: "hideZone", label: "Hide UTC offsets", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: ["geocoding-api.open-meteo.com"] },
  load: () => import("./Widget.jsx"),
};
