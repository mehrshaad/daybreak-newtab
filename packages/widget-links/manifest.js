import { LOOSE } from "./folders";

export default {
  id: "links",
  name: "Quick Links",
  glyph: "link",
  category: "Essentials",
  author: "Daybreak",
  version: "3.4.0",
  tagline: "The handful of places you actually go.",
  description:
    "Pinned shortcuts with generated app-style icons — a brand mark where one " +
    "is known, a lettered tile otherwise. Name a link yourself when you add " +
    "it, or leave it to the address; hover any icon for its full name, " +
    "address and site icon. Remove one with the badge that appears in edit " +
    "mode, or drag it out of the grid.",
  // Answered by the widget, not here: see useWidgetAction.
  actions: [
    { id: "add", label: "Add a link" },
    // Offered from the tile's own menu, not only from the settings panel: the
    // moment somebody has just made a folder is the moment they want to see
    // what a folder can do, and sending them to a drawer to find a switch is
    // a worse answer than a row in the menu that is already open.
    { id: "separate", label: "Give each folder a card", icon: "layers" },
    { id: "rejoin", label: "Put the folders back in one card", icon: "layers" },
  ],
  // Neither of the two is worth showing all the time. "Give each folder a
  // card" on a widget with no folders is a row that does nothing, and the way
  // back is only meaningful once there is something to come back from.
  actionsFor: (actions, options, config) => {
    const items = Array.isArray(config?.items) ? config.items : [];
    // How many cards a split would make: one per folder, plus one for
    // whatever is unfiled. Offering it at one card is offering to rearrange
    // the board into exactly what it already is.
    const folders = new Set();
    let loose = 0;
    for (const link of items) {
      const name = String(link?.folder || "").trim();
      if (name) folders.add(name);
      else loose += 1;
    }
    const groups = folders.size + (loose ? 1 : 0);
    const split = config?.folder != null;
    return actions.filter((a) => {
      if (a.id === "separate") return groups > 1 && !split;
      if (a.id === "rejoin") return split;
      return true;
    });
  },
  // A card holding one folder says which — "QUICK LINKS · AI". The loose links
  // get the sentinel rather than an empty title, or the card would look like
  // it had failed to name itself.
  subtitle: (config) =>
    config?.folder == null ? "" : config.folder === LOOSE ? "Ungrouped" : config.folder,
  // Narrowed only when the card is actually showing more than one group.
  //
  // Several folders stacked in one card need room for their headings and their
  // links; a card holding one group does not, and a card with no folders at
  // all never did — so the first version of this, which keyed off the
  // `separate` option, took 2x2 away from a plain Quick Links that had never
  // heard of folders.
  //
  // Config and not options, for the reason the folder display already learned:
  // a card split out of another is created and given its config in the same
  // tick that the original sets `separate`, so an option read at that moment
  // is the old value. The result was folder cards missing 2x2 while the card
  // they came from had it.
  sizesFor: (sizes, options, config) => {
    if (config?.folder != null) return sizes;
    const items = Array.isArray(config?.items) ? config.items : [];
    const folders = new Set();
    let loose = 0;
    for (const link of items) {
      const name = String(link?.folder || "").trim();
      if (name) folders.add(name);
      else loose += 1;
    }
    const groups = folders.size + (loose ? 1 : 0);
    return groups > 1 ? sizes.filter(([w, h]) => w >= 3 || h >= 3) : sizes;
  },
  sizes: [
    [2, 2],
    [3, 2],
    [4, 2],
    [3, 3],
    [5, 2],
    [6, 2],
    [4, 3],
    [4, 4],
    [6, 3],
  ],
  defaultSize: [5, 2],
  options: [
    {
      key: "hoverCard",
      // "Card on hover" asked people to know what a card is. It is the panel
      // with the name and the address in it, and now that switching this off
      // means nothing pops up at all, "details" is what it actually controls.
      // The key is unchanged, so nobody's setting resets.
      label: "Details on hover",
      type: "boolean",
      // Off. The card is a deliberate reveal and it was appearing on the way
      // past: crossing a row of icons to reach the one you wanted popped a
      // card over the others. The tooltip still names the icon, which is what
      // the hover was mostly being used for, so nothing is lost by default.
      default: false,
    },
    {
      key: "folderHeadings",
      label: "Folder headings",
      type: "boolean",
      default: true,
      // Only worth showing where folders are actually in use, which the widget
      // knows and a manifest does not — so it is gated on the mode instead.
      showIf: { separate: false },
    },
    {
      key: "separate",
      label: "A card per folder",
      type: "boolean",
      default: false,
    },
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
  settingsPanel: {
    title: "Folders",
    load: () => import("./Settings.jsx"),
  },
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
