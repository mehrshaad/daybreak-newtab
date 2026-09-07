import { WEEKDAYS } from "./weeks";

export default {
  id: "habits",
  name: "Habits",
  glyph: "calendar",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.6.0",
  tagline: "Weekly targets, tracked a day at a time.",
  description:
    "Tick a day when you do the thing. Each habit carries its own weekly " +
    "target and its own goal, and a week only counts once the next one " +
    "begins — so a slow start never breaks a run. Weeks that hit the target " +
    "stack up into a streak. History syncs across your signed-in browsers " +
    "when it's small enough to, and otherwise stays on this device.",
  actions: [{ id: "add", label: "Add a habit" }],
  sizes: [
    [3, 2],
    [4, 2],
    [3, 3],
    [4, 3],
  ],
  defaultSize: [4, 2],
  options: [
    // Only the week boundary is shared across habits. Target and goal are per
    // habit, edited on the tile itself, since two habits rarely want the same
    // cadence.
    {
      key: "weekStart",
      label: "Week begins on",
      type: "enum",
      of: WEEKDAYS,
      // Three letters each. The choices are full day names, so the drawer's
      // fallback would render them readably — but "Wednesday" in a row of
      // seven pills is a row that wraps, and every other enum here spells its
      // labels out rather than relying on that fallback.
      labels: Object.fromEntries(WEEKDAYS.map((day) => [day, day.slice(0, 3)])),
      default: "Monday",
    },
    { key: "showStreaks", label: "Show streaks", type: "boolean", default: true },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
