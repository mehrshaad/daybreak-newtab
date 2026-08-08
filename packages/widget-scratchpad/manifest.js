export default {
  id: "scratchpad",
  name: "Scratchpad",
  glyph: "note",
  category: "Productivity",
  author: "Daybreak",
  version: "2.1.0",
  tagline: "One text field. No folders.",
  description:
    "Somewhere to put a thought before it escapes. Saves as you type, and " +
    "syncs across your signed-in browsers up to about 6KB — longer notes " +
    "just stay on this device rather than losing anything you typed.",
  sizes: [
    [3, 2],
    [4, 2],
    [4, 3],
    [6, 3],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "monospace", label: "Monospace", type: "boolean", default: false },
    {
      key: "fontSize",
      label: "Font size",
      type: "number",
      min: 6,
      max: 24,
      step: 2,
      suffix: "px",
      default: 13,
    },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
