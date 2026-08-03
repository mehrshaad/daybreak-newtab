export default {
  id: "habits",
  name: "Habits",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "A seven-day dot grid per habit.",
  description:
    "Tap a dot to mark a day done. Shows a rolling seven days ending today, " +
    "so the rightmost dot is always today. History stays on this device.",
  sizes: [
    [3, 2],
    [4, 2],
    [4, 3],
  ],
  defaultSize: [3, 2],
  options: [
    { key: "showStreaks", label: "Show streaks", type: "boolean", default: true },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
