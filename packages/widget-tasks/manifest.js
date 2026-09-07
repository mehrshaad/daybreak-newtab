export default {
  id: "tasks",
  name: "Tasks",
  glyph: "list",
  category: "Productivity",
  author: "Daybreak",
  version: "2.4.0",
  tagline: "A short list you actually finish.",
  description:
    "A to-do list that lives on your new tab. Double-click a task to rename " +
    "it, pick a due date from a themed calendar, and clear finished tasks in " +
    "one click. Tasks sync with your Chrome profile; nothing is sent " +
    "anywhere else.",
  actions: [{ id: "add", label: "Add a task" }],
  sizes: [
    [4, 2],
    [3, 3],
    [4, 3],
    [5, 3],
    [4, 4],
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
