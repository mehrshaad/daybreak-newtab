export default {
  id: "links",
  name: "Quick Links",
  glyph: "link",
  category: "Essentials",
  author: "Daybreak",
  version: "2.3.0",
  tagline: "The handful of places you actually go.",
  description:
    "Pinned shortcuts with generated app-style icons — a brand mark where one " +
    "is known, a lettered tile otherwise. Name a link yourself when you add " +
    "it, or leave it to the address; hover any icon for its full name, " +
    "address and site icon. Remove one with the badge that appears in edit " +
    "mode, or drag it out of the grid.",
  // Answered by the widget, not here: see useWidgetAction.
  actions: [{ id: "add", label: "Add a link" }],
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
      label: "Card on hover",
      type: "boolean",
      // Off. The card is a deliberate reveal and it was appearing on the way
      // past: crossing a row of icons to reach the one you wanted popped a
      // card over the others. The tooltip still names the icon, which is what
      // the hover was mostly being used for, so nothing is lost by default.
      default: false,
    },
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
};
