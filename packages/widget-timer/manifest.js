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
    // Minutes, not a single "50-minute rounds" switch. That switch offered two
    // lengths out of the range people actually work in, and a round is the one
    // thing about a pomodoro timer everybody has an opinion on. A stored
    // longFocus: true becomes fifty here — see migrateWidgetOptions.
    {
      key: "focusMinutes",
      label: "Focus round",
      type: "number",
      min: 5,
      max: 60,
      step: 5,
      suffix: "min",
      default: 25,
    },
    {
      key: "breakMinutes",
      label: "Break",
      type: "number",
      min: 1,
      max: 30,
      step: 1,
      suffix: "min",
      default: 5,
    },
    {
      key: "longBreakMinutes",
      label: "Long break",
      type: "number",
      min: 5,
      max: 60,
      step: 5,
      suffix: "min",
      // Every fourth round, which is what makes it worth its own setting
      // rather than following the short one.
      default: 15,
    },
    { key: "autoStart", label: "Auto-start breaks", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
