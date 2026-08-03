export default {
  id: "recenttabs",
  name: "Recent Tabs",
  glyph: "history",
  category: "Essentials",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "Reopen what you closed by accident.",
  description:
    "Lists recently closed tabs and windows, and puts them back with one " +
    "click. Needs Chrome's `sessions` permission, which is optional — " +
    "Daybreak asks for it only when you add this widget, and the list is " +
    "read locally and never sent anywhere.",
  sizes: [
    [4, 2],
    [4, 3],
    [5, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "showWindows", label: "Include closed windows", type: "boolean", default: true },
  ],
  refresh: ["Live", "5 min", "1 hr"],
  permissions: { chrome: ["sessions"], hosts: [] },
  load: () => import("./Widget.jsx"),
};
