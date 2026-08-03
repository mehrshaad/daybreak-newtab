export default {
  id: "clock",
  name: "Clock",
  category: "Essentials",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "The time and today's date.",
  description:
    "A large, quiet clock with the full date underneath. Reads your system " +
    "clock, so it works offline and sends nothing anywhere.",
  sizes: [
    [3, 2],
    [4, 2],
    [6, 2],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "hour24", label: "24-hour time", type: "boolean", default: false },
    { key: "seconds", label: "Show seconds", type: "boolean", default: false },
    { key: "hideDate", label: "Hide the date", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
