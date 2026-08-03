export default {
  id: "tasks",
  name: "Tasks",
  category: "Productivity",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "A short list you actually finish.",
  description:
    "A to-do list that lives on your new tab. Tasks sync with your Chrome " +
    "profile; nothing is sent anywhere else.",
  sizes: [
    [4, 2],
    [4, 3],
    [5, 3],
  ],
  defaultSize: [4, 3],
  options: [
    { key: "hideCompleted", label: "Hide completed", type: "boolean", default: false },
    { key: "showDates", label: "Show due dates", type: "boolean", default: true },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
