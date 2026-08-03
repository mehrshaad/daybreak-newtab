import { WEEKDAYS } from "./weeks";

export default {
  id: "habits",
  name: "Habits",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.1.0",
  tagline: "Weekly targets, tracked a day at a time.",
  description:
    "Tick a day when you do the thing. Each habit has a weekly target, and a " +
    "week only counts once the next one begins — so a slow start never breaks " +
    "a run. Weeks that hit the target stack up into a streak. History stays " +
    "on this device.",
  sizes: [
    [3, 2],
    [4, 2],
  ],
  defaultSize: [3, 2],
  options: [
    {
      key: "weekStart",
      label: "Week begins on",
      type: "enum",
      of: WEEKDAYS,
      default: "Monday",
    },
    {
      key: "target",
      label: "Days per week",
      type: "number",
      min: 1,
      max: 7,
      step: 1,
      default: 5,
    },
    {
      key: "targetWeeks",
      label: "Goal (0 = none)",
      type: "number",
      min: 0,
      max: 52,
      step: 1,
      default: 0,
      suffix: " weeks",
    },
    { key: "showStreaks", label: "Show streaks", type: "boolean", default: true },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
