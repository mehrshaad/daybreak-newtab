export default {
  id: "onthisday",
  name: "On this day",
  glyph: "calendarDays",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "A moment from history, changed daily.",
  description:
    "One event from Wikipedia's on-this-day feed — no API key, no account. " +
    "Fetched once and cached for the rest of the day, so opening a new tab " +
    "later never repeats the request. A taller tile shows a few more.",
  sizes: [
    [3, 2],
    [4, 3],
  ],
  defaultSize: [3, 2],
  options: [],
  refresh: null,
  permissions: { chrome: [], hosts: ["en.wikipedia.org"] },
  load: () => import("./Widget.jsx"),
};
