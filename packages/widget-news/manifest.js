export default {
  id: "news",
  name: "News",
  glyph: "news",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "Hacker News by default, or your own feed.",
  description:
    "Hacker News' top stories, keyless and no account. Swap in your own " +
    "RSS or Atom feed instead — that needs one-time permission for that " +
    "single address, asked for the moment you add it, since most feeds are " +
    "not otherwise reachable from a browser tab.",
  sizes: [
    [3, 2],
    [3, 3],
    [4, 3],
  ],
  defaultSize: [3, 3],
  options: [],
  // "1 hr" first so it is the default — the plan calls for it, and Hacker
  // News' front page does not move fast enough to justify 5 min by default.
  refresh: ["1 hr", "5 min"],
  permissions: { chrome: [], hosts: ["hacker-news.firebaseio.com"] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Source",
    load: () => import("./Settings.jsx"),
  },
};
