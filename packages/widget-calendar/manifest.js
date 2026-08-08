export default {
  id: "calendar",
  name: "Calendar",
  glyph: "calendarRange",
  category: "Productivity",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "Your next events, from a pasted iCal link.",
  description:
    "Paste a private iCal address from Google, Outlook or iCloud and see " +
    "your next two weeks of events. That address is a credential — it is " +
    "kept only in your own settings, never logged or shown again, and needs " +
    "one-time permission to fetch that single calendar. Daily and weekly " +
    "recurring events are expanded over that window; monthly and yearly " +
    "ones show only their next occurrence.",
  sizes: [
    [3, 3],
    [4, 3],
  ],
  defaultSize: [3, 3],
  options: [],
  refresh: ["1 hr", "5 min"],
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Connection",
    load: () => import("./Settings.jsx"),
  },
};
