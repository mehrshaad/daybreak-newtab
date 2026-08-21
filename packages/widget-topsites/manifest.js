export default {
  id: "topsites",
  name: "Most visited",
  glyph: "grid",
  category: "Essentials",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "The places you actually go.",
  description:
    "Chrome's own most-visited list, the tiles the default new tab page shows " +
    "— which replacing that page otherwise takes away. Read from the browser " +
    "on this device, never sent anywhere. Hide any entry you would rather not " +
    "see.",
  sizes: [
    [3, 2],
    [4, 2],
    [5, 2],
    [4, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "hideLabels", label: "Hide labels", type: "boolean", default: false },
    { key: "count", label: "How many", type: "number", min: 4, max: 20, step: 1, default: 10 },
  ],
  refresh: ["5 min", "1 hr"],
  // Optional, and asked for on a click inside the widget rather than up front.
  permissions: { chrome: ["topSites"], hosts: [] },
  load: () => import("./Widget.jsx"),
};
