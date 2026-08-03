import { DEFAULTS as VISUAL_DEFAULTS } from "./tokens";

export const SCHEMA_VERSION = 2;

// Tile sizes offered everywhere (menu, drawer, resize cycling), as [cols, rows]
// against the 12-column / 96px-row grid.
export const SIZES = [
  [3, 2],
  [4, 2],
  [5, 2],
  [4, 3],
];

export const ZOOM_MODES = ["Camera", "Expand", "Spotlight", "None"];

export const REFRESH_RATES = ["Live", "5 min", "1 hr"];

// Layout presets. Ids that are not installed are filtered out at apply time,
// so a preset naming a widget the user removed is harmless.
export const PRESETS = {
  Balanced: [
    "clock",
    "weather",
    "worldclocks",
    "tasks",
    "links",
    "scratchpad",
    "quote",
    "timer",
  ],
  Focus: ["clock", "tasks", "timer", "scratchpad", "habits"],
  Dense: [
    "clock",
    "weather",
    "worldclocks",
    "tasks",
    "links",
    "scratchpad",
    "quote",
    "timer",
    "habits",
    "gapps",
    "recenttabs",
  ],
  Minimal: ["clock", "links", "weather"],
};

export const DEFAULT_LAYOUT = "Balanced";

// The user's own layout, kept alongside the built-in presets. Stored as a
// snapshot of ids + per-tile sizes so applying it restores the arrangement
// exactly, not just which widgets were on the board.
export const SAVED_LAYOUT = "Yours";

export function defaultSettings() {
  return {
    v: SCHEMA_VERSION,
    board: {
      ids: [...PRESETS[DEFAULT_LAYOUT]],
      sizes: {},
      layoutName: DEFAULT_LAYOUT,
      installed: [...PRESETS[DEFAULT_LAYOUT]],
      // null until the user saves one: { ids, sizes }
      saved: null,
    },
    appearance: {
      theme: VISUAL_DEFAULTS.theme,
      accent: VISUAL_DEFAULTS.accent,
      wall: VISUAL_DEFAULTS.wall,
      gap: VISUAL_DEFAULTS.gap,
      radius: VISUAL_DEFAULTS.radius,
      alpha: VISUAL_DEFAULTS.alpha,
    },
    behavior: {
      zoomMode: "Camera",
      showGreeting: true,
      shortcuts: true,
      searchEngine: "google",
    },
    profile: { name: "" },
    widgets: {},
  };
}

// Merge stored settings over the defaults one level deep, so a new key added
// in a later version appears for existing users without a migration.
export function hydrate(saved) {
  const base = defaultSettings();
  if (!saved || typeof saved !== "object") return base;
  const out = { ...base };
  for (const key of Object.keys(base)) {
    const s = saved[key];
    if (s === undefined || s === null) continue;
    out[key] =
      typeof base[key] === "object" && !Array.isArray(base[key])
        ? { ...base[key], ...s }
        : s;
  }
  out.v = SCHEMA_VERSION;
  // `installed` must always cover what is on the board.
  const ids = Array.isArray(out.board.ids) ? out.board.ids : [];
  const installed = Array.isArray(out.board.installed) ? out.board.installed : [];
  out.board.installed = [...new Set([...installed, ...ids])];
  return out;
}

// Per-widget settings record, created lazily.
export function widgetState(settings, id) {
  return settings.widgets?.[id] || { options: {}, rate: "Live", config: {} };
}
