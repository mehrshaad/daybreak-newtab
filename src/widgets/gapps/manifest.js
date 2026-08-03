export default {
  id: "gapps",
  name: "Google Apps",
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
    [4, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "hideLabels", label: "Hide labels", type: "boolean", default: false },
    { key: "newTab", label: "Open in a new tab", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
