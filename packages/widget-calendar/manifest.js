export default {
  id: "calendar",
  name: "Calendar",
  glyph: "calendarRange",
  category: "Productivity",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "Your next events, from a pasted iCal link.",
  description:
    "Paste a private iCal address from Google, Outlook or iCloud and see " +
    "your next two weeks of events, merged across as many calendars as you " +
    "add. Each address is a credential — kept only in your own settings, " +
    "never logged or shown again — and needs one-time permission to fetch " +
    "that single calendar. Daily and weekly recurring events are expanded " +
    "over that window; monthly and yearly ones show only their next " +
    "occurrence.",
  sizes: [
    [3, 3],
    [4, 3],
  ],
  defaultSize: [3, 3],
  options: [{ key: "hour24", label: "24-hour time", type: "boolean", default: false }],
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
