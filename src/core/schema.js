import { essentialsFirst } from "./essentials";
import { DEFAULTS as VISUAL_DEFAULTS } from "./tokens";
import { knownIds } from "../widgets/registry";

export const SCHEMA_VERSION = 2;

// Tile sizes offered everywhere (menu, drawer, resize cycling), as [cols, rows]
// against the 12-column / 96px-row grid.
export const SIZES = [
  [3, 2],
  [4, 2],
  [5, 2],
  [4, 3],
];

// Click-to-zoom is parked for a future release: the interaction is not good
// enough yet, so "None" is the default and the picker is not offered in
// settings. The modes and their maths are kept intact so the work can be picked
// back up rather than rewritten.
export const ZOOM_MODES = ["Camera", "Expand", "Spotlight", "None"];
export const DEFAULT_ZOOM_MODE = "None";

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
  Minimal: ["clock", "weather", "links"],
};

export const DEFAULT_LAYOUT = "Balanced";

// The user's own layout, kept alongside the built-in presets. Stored as a
// snapshot of ids + per-tile sizes so applying it restores the arrangement
// exactly, not just which widgets were on the board.
export const SAVED_LAYOUT = "Yours";

// The board patch for switching to a built-in preset. The first switch would
// otherwise destroy whatever arrangement was on the board with no way back,
// so it is captured into `saved` — the "Yours" layout — before being
// overwritten. Once a snapshot exists (from here, or an explicit save),
// later preset switches leave it alone rather than repeatedly overwriting it
// with whatever the board happened to look like right before the click.
export function presetBoardPatch(name, board) {
  const next = essentialsFirst(knownIds(PRESETS[name] || []));
  return {
    ids: next,
    sizes: {},
    layoutName: name,
    installed: [...new Set([...board.installed, ...next])],
    ...(board.saved ? null : { saved: { ids: [...board.ids], sizes: { ...board.sizes } } }),
  };
}

export function defaultSettings() {
  return {
    v: SCHEMA_VERSION,
    board: {
      ids: essentialsFirst(PRESETS[DEFAULT_LAYOUT]),
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
      radius: VISUAL_DEFAULTS.radius,
      alpha: VISUAL_DEFAULTS.alpha,
      pageZoom: VISUAL_DEFAULTS.pageZoom,
      blur: VISUAL_DEFAULTS.blur,
      // What sits above a widget's content: its dot, its name, both, or
      // nothing. "none" gives that row's height back to the widget rather than
      // leaving it blank.
      tileLabels: VISUAL_DEFAULTS.tileLabels,
      boardWidth: VISUAL_DEFAULTS.boardWidth,
    },
    behavior: {
      showGreeting: true,
      shortcuts: true,
      tourDone: false,
      searchEngine: "google",
      // Only the permission-free source is on by default; the others are
      // opt-in and each asks for its Chrome permission when switched on.
      // `answers` needs no permission and is on by default: it only ever fires
      // on something that already evaluates to a number, so it costs a person
      // who does not want it nothing until they type a sum.
      suggest: { links: true, tabs: false, bookmarks: false, history: false, answers: true },
      // All on by default, and switchable one kind at a time: "undo" and
      // "a new version is available" are not the same sort of message, so one
      // master switch would have made silencing update nags cost you the undo
      // prompts too. `hydrate` merges one level deep, so a stored `behavior`
      // without this key keeps these defaults — and isSilenced() treats a
      // missing `categories` as "nothing silenced" rather than throwing.
      notifications: {
        enabled: true,
        categories: {
          info: true,
          undo: true,
          update: true,
          performance: true,
          sync: true,
          error: true,
        },
      },
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
  // tourDone is new: an install that already had *something* saved predates
  // it and should not suddenly see a first-run card, so only a genuinely
  // fresh install (the !saved branch above) leaves it at the false default.
  if (saved.behavior?.tourDone === undefined) out.behavior.tourDone = true;
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
