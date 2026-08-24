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
    "site you click, exactly like a bookmark would. Drag an icon out of the " +
    "grid in edit mode to hide it; restore hidden apps from this widget's " +
    "settings.",
  // Two widths, one height. The taller sizes filled the extra rows by
  // showing more of the long tail of Google's apps, which is exactly what
  // the "+N more" toggle is for. Anyone already on one of the dropped sizes
  // falls back to defaultSize, which resolveSize does for any stored size a
  // widget no longer offers.
  sizes: [
    [4, 2],
    [5, 2],
  ],
  defaultSize: [5, 2],
  options: [
    {
      key: "iconScale",
      label: "Icon size",
      type: "enum",
      of: ["s", "m", "l"],
      labels: { s: "S", m: "M", l: "L" },
      default: "m",
    },
    { key: "hideLabels", label: "Hide labels", type: "boolean", default: false },
    { key: "newTab", label: "Open in a new tab", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Hidden apps",
    load: () => import("./Settings.jsx"),
  },
};
