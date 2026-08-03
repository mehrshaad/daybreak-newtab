import { defaultSettings } from "./schema";
import { SEARCH_ENGINES } from "../utils";

// One-time upgrade from the v1 layout's settings blob. v1 stored one object
// under `daybreakSettings`; v2 splits the same information across the board,
// appearance/behaviour sections and per-widget config.
//
// Anything unmapped is intentionally dropped: v1 wallpapers (v2 backgrounds are
// procedural), the tour flag, bookmarks display toggles, and the leftbar mode.

const MAX_ZONES = 4;

export function migrateV1(v1) {
  const out = defaultSettings();
  if (!v1 || typeof v1 !== "object") return out;

  const name = v1.general?.name;
  if (typeof name === "string" && name.trim()) out.profile.name = name.trim();

  const engine = v1.general?.searchEngine;
  if (engine && SEARCH_ENGINES[engine]) out.behavior.searchEngine = engine;

  const cities = Array.isArray(v1.cities?.cityList) ? v1.cities.cityList : [];
  const unit = v1.cities?.unit === "f" ? "f" : "c";

  // First city drives Weather; every city (up to four) becomes a World Clock,
  // which is exactly what a v1 user with Tehran + Toronto would expect.
  if (cities[0]?.latitude != null) {
    const c = cities[0];
    out.widgets.weather = {
      options: { fahrenheit: unit === "f" },
      rate: "Live",
      config: {
        city: {
          name: c.name,
          country: c.country,
          latitude: c.latitude,
          longitude: c.longitude,
          timezone: c.timezone,
        },
      },
    };
  }

  const zones = cities
    .filter((c) => c && c.timezone)
    .slice(0, MAX_ZONES)
    .map((c) => ({ city: c.name, tz: c.timezone }));
  if (zones.length) {
    out.widgets.worldclocks = { options: {}, rate: "Live", config: { zones } };
  }

  const todos = Array.isArray(v1.todo?.todoList) ? v1.todo.todoList : [];
  if (todos.length) {
    out.widgets.tasks = {
      options: {},
      rate: "Live",
      config: {
        items: todos.map((t, i) => ({
          id: t.id || `v1-${i}`,
          text: t.task || "",
          done: !!t.completed,
          due: t.date || null,
        })),
      },
    };
  }

  const links = Array.isArray(v1.bookmarks?.bookmarksList)
    ? v1.bookmarks.bookmarksList
    : [];
  if (links.length) {
    out.widgets.links = {
      options: {},
      rate: "Live",
      config: {
        items: links
          .filter((b) => b && b.url)
          .map((b, i) => ({ id: `v1-${i}`, name: b.name || b.url, url: b.url })),
      },
    };
  }

  return out;
}

// Scratchpad text can be long, and the whole settings object shares one 8KB
// chrome.storage.sync item, so migrated note text is seeded into local storage
// (where the widget keeps it) rather than into settings.
export function migrateV1Local(v1) {
  const text = v1?.notes?.text;
  if (typeof text !== "string" || !text) return null;
  return { "scratchpad:text": text };
}

export function needsMigration(v1) {
  return !!v1 && typeof v1 === "object" && Object.keys(v1).length > 0;
}
