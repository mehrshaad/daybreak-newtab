export default {
  id: "bookmarks",
  name: "Bookmarks",
  glyph: "bookmark",
  category: "Essentials",
  author: "Daybreak",
  version: "1.3.0",
  tagline: "The folders you already keep.",
  description:
    "Your browser's own bookmarks, by folder. Read live from Chrome on this " +
    "device and never sent anywhere — and edited there too: rename, move, " +
    "add and remove from the widget's settings, and the change is in Chrome's " +
    "bookmark manager as well. Show every folder in one card, or give each " +
    "folder a card of its own to arrange on the board.",
  // A folder of links wants either a tall card or a wide one. The small sizes
  // are still offered because a single folder of four links in a 2x2 is a
  // perfectly good tile — which is exactly what the separated mode makes.
  sizes: [
    [2, 2],
    [3, 2],
    [4, 2],
    [3, 3],
    [4, 3],
    [6, 3],
    [4, 4],
    [6, 4],
    [12, 4],
  ],
  defaultSize: [4, 3],
  // Every folder in one card needs room for several headings and the links
  // under them, so the sizes that cannot hold two groups are not offered in
  // that mode. One folder to a card has no such problem, which is half the
  // reason the mode exists — and a 2x2 holding four links is a good tile.
  sizesFor: (sizes, options, config) =>
    // A card pinned to one folder can be any size. Only the card showing all
    // of them needs room for several headings — and this reads the config
    // rather than the `separate` option because a card split out of another
    // is given its config in the same tick the original flips that option,
    // so the option is stale exactly when it matters.
    config?.folderId != null ? sizes : sizes.filter(([w, h]) => w >= 4 && h >= 3),
  actions: [
    { id: "add", label: "Add a bookmark", panel: true },
    // Same pair as Quick Links, and offered from the tile's own menu for the
    // same reason. See actionsFor below for when each one shows.
    { id: "separate", label: "Give each folder a card", icon: "layers" },
    { id: "rejoin", label: "Put the folders back in one card", icon: "layers" },
  ],
  // The folders live in Chrome, so this cannot count them from config the way
  // Quick Links does — the widget knows and the manifest does not. Offering
  // the split on an unsplit card is the honest approximation: if there are no
  // folders the widget's own handler declines and says so.
  actionsFor: (actions, options, config) =>
    actions.filter((a) => {
      if (a.id === "separate") return config?.folderId == null;
      if (a.id === "rejoin") return config?.folderId != null;
      return true;
    }),
  options: [
    {
      key: "layout",
      label: "Layout",
      type: "enum",
      of: ["list", "grid"],
      labels: { list: "List", grid: "Grid" },
      // A list, unlike the icon widgets. A bookmark's title is what identifies
      // it — "Anthropic Console", "Q3 planning doc" — and a grid of monograms
      // for pages with no brand mark is a wall of grey letters.
      default: "list",
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
      key: "perFolder",
      label: "Links per folder",
      type: "number",
      min: 0,
      max: 20,
      step: 1,
      default: 6,
    },
    {
      key: "separate",
      label: "A card per folder",
      type: "boolean",
      default: false,
    },
    {
      key: "showHeadings",
      label: "Folder headings",
      type: "boolean",
      default: true,
      // With one folder to a card the heading is the tile's own title, so a
      // second copy inside it is the same words twice.
      showIf: { separate: false },
    },
    { key: "newTab", label: "Open in a new tab", type: "boolean", default: false },
  ],
  refresh: null,
  // Optional, and asked for from inside the widget rather than at install.
  permissions: { chrome: ["bookmarks"], hosts: [] },
  // What the tile's own header adds after the widget's name, so a card holding
  // one folder says which — "BOOKMARKS · AI TOOLS".
  subtitle: (config) => (config?.folderId ? config.folderTitle || "" : ""),
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Folders",
    load: () => import("./Settings.jsx"),
  },
};
