export default {
  id: "timer",
  name: "Focus Timer",
  glyph: "timer",
  category: "Productivity",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "Pomodoro rounds, quietly.",
  description:
    "Twenty-five minutes of focus, five off, a longer break every fourth " +
    "round. Keeps running when you close the tab, and every new tab shows the " +
    "same countdown.",
  sizes: [[3, 2]],
  defaultSize: [3, 2],
  options: [
    { key: "longFocus", label: "50-minute rounds", type: "boolean", default: false },
    { key: "autoStart", label: "Auto-start breaks", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
