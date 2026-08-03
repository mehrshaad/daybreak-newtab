export default {
  id: "gapps",
  name: "Google Apps",
  glyph: "grid",
  category: "Essentials",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "The launcher grid, without the extra click.",
  description:
    "Direct links to Google's apps. Plain links — the tile just opens the " +
    "site you click, exactly like a bookmark would.",
  sizes: [
    [4, 2],
    [5, 2],
    [6, 2],
    [6, 3],
    [8, 3],
    [8, 4],
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
