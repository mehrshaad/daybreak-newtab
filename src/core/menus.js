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

// Icons are named, not imported.
//
// This module is data — it is built and asserted without React anywhere near
// it — and importing a couple of dozen components into it to hand them back
// would make it a component module that happens to return objects. ContextMenu
// owns the name-to-glyph map, which also means an unknown name is a missing
// icon rather than a crash.

// Right-click inside any text-entry surface needs the native menu (paste,
// spellcheck) — never hijacked by a custom board/tile/chrome menu.
export const isEditableTarget = (target) =>
  !!target?.closest?.('input, textarea, [contenteditable]:not([contenteditable="false"])');

export function boardMenu({
  editing,
  theme,
  hasSaved,
  savedState,
  onStore,
  onToggleEdit,
  onPreset,
  onApplySaved,
  onSaveCurrent,
  onSettings,
}) {
  return {
    title: "Home board",
    items: [
      { label: "Add widget…", icon: "add", hint: hint("Alt A"), run: onStore },
      {
        label: editing ? "Exit layout mode" : "Edit layout",
        icon: editing ? "done" : "edit",
        hint: hint("Alt E"),
        run: onToggleEdit,
      },
      separator,
      ...(hasSaved
        ? [{ label: "Switch to your layout", icon: "layers", run: onApplySaved }]
        : []),
      // The label says which of the two things this does. Saving over an
      // existing snapshot is not the same act as taking the first one, and one
      // label for both read as the harmless one. Absent entirely when the board
      // already matches, so the menu never offers a save that would change
      // nothing.
      ...(savedState === "saved"
        ? []
        : [
            {
              label: hasSaved ? "Save this view over yours" : "Save this as your layout",
              icon: "save",
              run: onSaveCurrent,
            },
          ]),
      { label: "Reset to Balanced", icon: "reset", run: () => onPreset("Balanced") },
      { label: "Change background", icon: "background", run: () => onSettings("background") },
      {
        label: theme === "dark" ? "Switch to light" : "Switch to dark",
        icon: theme === "dark" ? "light" : "dark",
        run: () => onSettings("theme"),
      },
      separator,
      { label: "All settings", icon: "settings", hint: hint("Mod,"), run: () => onSettings() },
    ],
  };
}

export function widgetMenu({
  manifest,
  // The sizes to offer, which a manifest may narrow from its own options — see
  // sizesFor. Defaults to everything it declares, so a caller that does not
  // care need not pass it.
  sizes,
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
      // A manifest may name its own; every action so far is an add.
      icon: action.icon || "add",
      hint: hint(action.hint),
      run: () => onAction(action),
    });
  }
  if (manifest.actions?.length) items.push(separator);

  if (zoomMode !== "None") {
    items.push({ label: "Focus widget", icon: "focus", hint: "↵", run: onFocus });
  }
  items.push({ label: "Widget settings", icon: "settings", hint: hint("Alt,"), run: onSettings });

  const offered = sizes?.length ? sizes : manifest.sizes;
  if (offered.length > 1) {
    items.push({
      type: "sizes",
      sizes: offered,
      current: currentSize,
      onPick: onSize,
    });
  }

  items.push(separator);
  if (manifest.refresh) {
    items.push({ label: "Refresh now", icon: "refresh", hint: hint("Mod R"), run: onRefresh });
  }
  items.push({ label: "Duplicate", icon: "duplicate", run: onDuplicate });
  items.push({ label: "Move to top", icon: "top", run: onMoveTop });
  items.push(separator);
  items.push({ label: "Remove from home", icon: "remove", hint: "⌫", run: onRemove, danger: true });

  return { title: manifest.name, items };
}

export const PRESET_NAMES = Object.keys(PRESETS);
