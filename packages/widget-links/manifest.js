export default {
  id: "links",
  name: "Quick Links",
  glyph: "link",
  category: "Essentials",
  author: "Daybreak",
  version: "2.1.0",
  tagline: "The handful of places you actually go.",
  description:
    "Pinned shortcuts with generated app-style icons — a brand mark where one " +
    "is known, a lettered tile otherwise. Name a link yourself when you add " +
    "it, or leave it to the address; hover any icon for its full name, " +
    "address and site icon. Remove one with the badge that appears in edit " +
    "mode.",
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
