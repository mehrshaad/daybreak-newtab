export default {
  id: "moon",
  name: "Moon phase",
  glyph: "moon",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "Tonight's moon, drawn as it looks.",
  description:
    "The moon's phase and how much of it is lit, drawn as the real terminator " +
    "rather than picked from a set of icons. Worked out from the date on this " +
    "machine — nothing is fetched, and it needs no key.",
  sizes: [
    [2, 2],
    [3, 2],
    [3, 3],
    [4, 2],
  ],
  defaultSize: [3, 2],
  options: [
    { key: "showNext", label: "Next full and new moon", type: "boolean", default: true },
    { key: "showPercent", label: "Show the lit percentage", type: "boolean", default: true },
    {
      key: "tint",
      label: "Moon",
      type: "enum",
      of: ["silver", "accent"],
      labels: { silver: "Silver", accent: "Accent" },
      default: "silver",
    },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
