export default {
  id: "sun",
  name: "Sun & daylight",
  glyph: "sun",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "Where the sun is, and how long it stays.",
  description:
    "Sunrise, sunset, solar noon and golden hour for a city you pick, with " +
    "the sun drawn where it actually is in the sky. Worked out from the date " +
    "and the coordinates on this machine — nothing is fetched, and it needs " +
    "no key.",
  // The wider sizes earn their space: the arc gets room to read as a sky, and
  // the taller one adds the golden-hour and twilight rows underneath.
  sizes: [
    [3, 2],
    [4, 2],
    [4, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "hour24", label: "24-hour time", type: "boolean", default: false },
    { key: "showDelta", label: "Compare with yesterday", type: "boolean", default: true },
    { key: "showAzimuth", label: "Show the sun's bearing", type: "boolean", default: false },
    {
      key: "arc",
      label: "Sky",
      type: "enum",
      of: ["gradient", "plain"],
      labels: { gradient: "Coloured", plain: "Plain" },
      default: "gradient",
    },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
