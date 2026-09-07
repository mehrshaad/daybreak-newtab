export default {
  id: "timer",
  name: "Focus Timer",
  glyph: "timer",
  category: "Productivity",
  author: "Daybreak",
  version: "2.5.0",
  tagline: "Pomodoro rounds, quietly.",
  description:
    "Twenty-five minutes of focus, five off, a longer break every fourth " +
    "round. Keeps running when you close the tab, and every new tab shows the " +
    "same countdown.",
  sizes: [
    [2, 2],
    [3, 2],
    [3, 3],
  ],
  defaultSize: [3, 2],
  options: [
    {
      key: "tabTitle",
      label: "Countdown in the tab title",
      type: "boolean",
      // On. The point of a focus round is that you go and do the thing, which
      // means the timer is running in a tab you are not looking at — and the
      // title is the only part of this page a backgrounded tab still shows.
      default: true,
    },
    { key: "longFocus", label: "50-minute rounds", type: "boolean", default: false },
    { key: "autoStart", label: "Auto-start breaks", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
