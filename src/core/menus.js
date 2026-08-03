import { PRESETS } from "./schema";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

// Render shortcut hints with the platform's real modifier keys.
export const hint = (spec) => {
  if (!spec) return "";
  return isMac()
    ? spec.replace(/\bMod\b/g, "⌘").replace(/\bAlt\b/g, "⌥")
    : spec.replace(/\bMod\b/g, "Ctrl ").replace(/\bAlt\b/g, "Alt ");
};

const separator = { type: "separator" };

export function boardMenu({ editing, theme, onStore, onToggleEdit, onPreset, onSettings }) {
  return {
    title: "Home board",
    items: [
      { label: "Add widget…", hint: hint("Alt A"), run: onStore },
      {
        label: editing ? "Exit layout mode" : "Edit layout",
        hint: hint("Alt E"),
        run: onToggleEdit,
      },
      separator,
      { label: "Reset to Balanced", run: () => onPreset("Balanced") },
      { label: "Change background", run: () => onSettings("background") },
      {
        label: theme === "dark" ? "Switch to light" : "Switch to dark",
        run: () => onSettings("theme"),
      },
      separator,
      { label: "All settings", hint: hint("Mod,"), run: () => onSettings() },
    ],
  };
}

export function widgetMenu({
  manifest,
  currentSize,
  zoomMode,
  onFocus,
  onSettings,
  onSize,
  onRefresh,
  onDuplicate,
  onMoveTop,
  onRemove,
  onAction,
}) {
  const items = [];

  for (const action of manifest.actions || []) {
    items.push({
      label: action.label,
      hint: hint(action.hint),
      run: () => onAction(action),
    });
  }
  if (manifest.actions?.length) items.push(separator);

  if (zoomMode !== "None") {
    items.push({ label: "Focus widget", hint: "↵", run: onFocus });
  }
  items.push({ label: "Widget settings", hint: hint("Alt,"), run: onSettings });

  if (manifest.sizes.length > 1) {
    items.push({
      type: "sizes",
      sizes: manifest.sizes,
      current: currentSize,
      onPick: onSize,
    });
  }

  items.push(separator);
  if (manifest.refresh) {
    items.push({ label: "Refresh now", hint: hint("Mod R"), run: onRefresh });
  }
  items.push({ label: "Duplicate", run: onDuplicate });
  items.push({ label: "Move to top", run: onMoveTop });
  items.push(separator);
  items.push({ label: "Remove from home", hint: "⌫", run: onRemove, danger: true });

  return { title: manifest.name, items };
}

export const PRESET_NAMES = Object.keys(PRESETS);
