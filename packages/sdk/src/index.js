// @daybreak/sdk — everything a widget is allowed to build against.
//
// Widgets import from this package rather than reaching into the app, which is
// what lets each one live in its own workspace (and, later, its own repo)
// without knowing anything about Daybreak's internals. The app consumes the
// same surface, so there is one implementation of each helper.

// Storage: small synced settings live in the host's settings object; content
// belongs in the per-widget local bucket.
export { clearBucket, flushBucket, readBucket, useWidgetLocal, writeBucket } from "./bucket";

// Widget content synced across signed-in Chrome profiles, capped so one
// widget's content cannot break the 8KB-per-item sync limit.
export { fitForSync, resolveSynced, useWidgetSynced } from "./synced";

// Storage plumbing. The host owns the settings schema; the sdk owns the
// mechanics of reading and writing it, so both sides share one implementation.
export {
  LOCAL_KEY,
  SYNC_KEY,
  V1_KEY,
  debounceWriter,
  hasChromeLocal,
  hasChromeSync,
  localArea,
  readV1Settings,
  syncArea,
} from "./storage";

// Refresh + clock hooks.
export { RATE_MS, useMinutes, useRefresh, useSeconds, useTick } from "./useRefresh";

// Optional Chrome permissions. Requests must be made from a user gesture.
export {
  dropOrigin,
  dropPermission,
  hasAllPermissions,
  hasOrigin,
  hasPermission,
  hasPermissionsApi,
  originOf,
  requestAllPermissions,
  requestOrigin,
  requestPermission,
} from "./permissions";

// Real site icons from Chrome's own favicon cache — no request to the site.
export { faviconUrl } from "./favicon";

// Styling helpers. Widgets should otherwise theme themselves from the CSS
// custom properties on the app root (--fg, --dim, --accent, ...).
export {
  CONTROL_TRANSITION,
  HOVER_LIFT,
  MONO,
  labelStyle,
  mark,
  pill,
  primaryButton,
  roundControl,
  seedFor,
  softButton,
  toggleStyles,
} from "./styles";

// Glyph names a widget manifest can ask for on its chip.
export { GLYPHS, glyphNames } from "./glyphs";

// Keeps a floating rectangle inside the viewport. Shared by the context menu
// and Popover, so there is one implementation of "don't run off the screen".
export { clampToViewport } from "./clamp";

// Brand marks for app-style icons.
export { BRANDS, brandFor, hashHue } from "./brands";

// Animation + drag primitives, shared with the host so a widget's internal
// grid behaves exactly like the board.
export {
  ENTER_DURATION,
  FLIP_DURATION,
  FLIP_EASING,
  FLIP_ITEMS,
  animateExit,
  useFlip,
} from "./useFlip";
export {
  moveItem,
  pointInRect,
  slotIndexAt,
  usePointerReorder,
} from "./usePointerReorder";
export { useHover } from "./useHover";
export { useLongPress } from "./useLongPress";
export { usePresence } from "./usePresence";
export { useTooltip } from "./useTooltip";

// Small utilities.
export {
  SEARCH_ENGINES,
  clamp,
  classNames,
  formatDate,
  geocodeCity,
  greeting,
  searchCities,
  todayKey,
  uid,
  wmoWeather,
} from "./utils";

// Shared components.
export { APPEAR_MS, default as Appear } from "./components/Appear";
export { default as CitySearch } from "./components/CitySearch";
export { default as EditableText } from "./components/EditableText";
export { default as Favicon } from "./components/Favicon";
export { default as IconGrid } from "./components/IconGrid";
export { default as IconTile } from "./components/IconTile";
export { default as Popover } from "./components/Popover";
export { default as Tooltip } from "./components/Tooltip";
export { default as WidgetMark } from "./components/WidgetMark";
