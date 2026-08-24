export default {
  id: "calendar",
  name: "Calendar",
  glyph: "calendarRange",
  category: "Productivity",
  author: "Daybreak",
  version: "3.0.0",
  tagline: "A real month grid, with your events on it.",
  description:
    "A month you can actually read: today marked, a dot on any day with " +
    "something on it, and an optional second date in the Jalali or Hijri " +
    "calendar under each day. Works with nothing connected. Paste a private " +
    "iCal address from Google, Outlook or iCloud to put your own events on " +
    "it, merged across as many calendars as you add — each address is a " +
    "credential, kept only in your own settings and never shown again, and " +
    "needs one-time permission to fetch that single calendar. Daily and " +
    "weekly recurring events are expanded over the next two weeks; monthly " +
    "and yearly ones show only their next occurrence.",
  sizes: [
    [3, 3],
    [4, 3],
    [4, 4],
    [5, 4],
  ],
  defaultSize: [4, 3],
  options: [
    {
      key: "view",
      label: "Show",
      type: "enum",
      of: ["month", "agenda"],
      labels: ["Month", "Agenda"],
      // The month grid is the default because the widget is called Calendar
      // and a list of the next few events is not one. The agenda is still here
      // for anyone who preferred it, which is what it used to be.
      default: "month",
    },
    {
      key: "alternate",
      label: "Second calendar",
      type: "enum",
      of: ["none", "jalali", "hijri"],
      labels: ["None", "Jalali", "Hijri"],
      default: "none",
    },
    {
      key: "weekStart",
      label: "Week starts",
      type: "enum",
      of: ["sun", "mon", "sat"],
      labels: ["Sun", "Mon", "Sat"],
      default: "sun",
      showIf: { view: "month" },
    },
    {
      key: "showHolidays",
      label: "Mark Iranian holidays",
      type: "boolean",
      default: false,
      showIf: { view: "month" },
    },
    { key: "hour24", label: "24-hour time", type: "boolean", default: false },
  ],
  // Listed low to high for display; defaultRate (not list order) is what
  // actually picks "1 hr" as the default.
  refresh: ["5 min", "1 hr"],
  defaultRate: "1 hr",
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Calendars",
    load: () => import("./Settings.jsx"),
  },
};
