export default {
  id: "gapps",
  name: "Google Apps",
  glyph: "grid",
  category: "Essentials",
  author: "Daybreak",
  version: "2.3.0",
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
    [3, 3],
    [5, 2],
    [4, 4],
  ],
  defaultSize: [5, 2],
  options: [
    {
      key: "layout",
      label: "Layout",
      type: "enum",
      of: ["grid", "list"],
      labels: { grid: "Grid", list: "List" },
      default: "grid",
    },
    {
      key: "iconScale",
      label: "Icon size",
      type: "enum",
      of: ["s", "m", "l"],
      labels: { s: "S", m: "M", l: "L" },
      default: "m",
    },
    {
      key: "hideLabels",
      label: "Hide labels",
      type: "boolean",
      default: false,
      // A list row is a name with a mark beside it. Without the name
      // it is a column of icons in a tile's full width, so the option
      // is not offered there rather than being offered and ignored.
      showIf: { layout: "grid" },
    },
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
