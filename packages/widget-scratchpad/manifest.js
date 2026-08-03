export default {
  id: "scratchpad",
  name: "Scratchpad",
  category: "Productivity",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "One text field. No folders.",
  description:
    "Somewhere to put a thought before it escapes. Saves as you type, stays " +
    "on this device, and never leaves the browser.",
  sizes: [
    [3, 2],
    [4, 2],
    [4, 3],
    [6, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "monospace", label: "Monospace", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
