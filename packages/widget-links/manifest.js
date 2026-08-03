export default {
  id: "links",
  name: "Quick Links",
  glyph: "link",
  category: "Essentials",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "The handful of places you actually go.",
  description:
    "Pinned shortcuts with generated app-style icons — a brand mark where one " +
    "is known, a lettered tile otherwise. Nothing is fetched from the sites " +
    "themselves, so opening a new tab contacts nobody.",
  sizes: [
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [4, 3],
    [6, 3],
  ],
  defaultSize: [5, 2],
  options: [
    { key: "hideLabels", label: "Hide labels", type: "boolean", default: false },
    { key: "newTab", label: "Open in a new tab", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
