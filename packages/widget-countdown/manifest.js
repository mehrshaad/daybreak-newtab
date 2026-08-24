export default {
  id: "countdown",
  name: "Countdown",
  glyph: "calendarDays",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.3.0",
  tagline: "The dates you are counting toward.",
  description:
    "Deadlines, trips, birthdays, a launch. Counts down in days, and in hours " +
    "and minutes once it is close. Anything marked yearly rolls to next year " +
    "on its own, so a birthday is added once and never again.",
  sizes: [
    [2, 2],
    [3, 2],
    [3, 3],
    [4, 2],
  ],
  defaultSize: [3, 2],
  options: [
    {
      key: "sort",
      label: "Order",
      type: "enum",
      of: ["soonest", "added"],
      labels: { soonest: "Soonest first", added: "As added" },
      default: "soonest",
    },
    {
      key: "calendar",
      label: "Show dates in",
      type: "enum",
      of: ["gregorian", "jalali", "both"],
      labels: { gregorian: "Gregorian", jalali: "Jalali", both: "Both" },
      default: "gregorian",
    },
    { key: "keepPast", label: "Keep dates once they pass", type: "boolean", default: false },
    { key: "showEmoji", label: "Show emoji", type: "boolean", default: true },
  ],
  // Its own ticker: a countdown under a day needs the minute, and the widget
  // refresh rates are coarser than that.
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Dates",
    load: () => import("./Settings.jsx"),
  },
};
