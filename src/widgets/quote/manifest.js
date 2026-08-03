export default {
  id: "quote",
  name: "Quote of the day",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "One line, changed daily.",
  description:
    "A short quote picked from a bundled list by the day of the year — the " +
    "same one all day, and no network call to get it.",
  sizes: [
    [3, 2],
    [4, 2],
  ],
  defaultSize: [4, 2],
  options: [
    { key: "hideAuthor", label: "Hide attribution", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
