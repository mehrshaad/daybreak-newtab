// The guided tour, as data.
//
// Kept apart from the component that draws it for the obvious reason — the copy
// and the order are the part worth changing often, and neither should mean
// touching an overlay's geometry code.
//
// Each step names a `scene`: the state the app has to be in for the step to
// make sense. Explaining the presets dock is useless while it is hidden, and
// telling somebody where a widget's options live only lands with the panel
// actually open. App owns a single function that puts the world into a scene,
// so a step declares where it wants to be rather than opening and closing
// things itself — which is what stops a half-open drawer being left behind when
// somebody skips out halfway.
//
// `target` is a data-tour attribute rather than a CSS selector into the markup.
// A selector like ".db-dock button:nth-child(3)" is a tour that breaks silently
// the next time the dock is edited; a named handle breaks loudly, in a test.
export const SCENES = ["board", "widget", "edit", "store", "settings"];

export const TOUR_STEPS = [
  {
    id: "welcome",
    scene: "board",
    target: null,
    title: "This is your board",
    body:
      "Everything on this page is a widget you chose, at a size and place you " +
      "chose. Nothing here is fixed. This takes about a minute, and you can " +
      "leave at any point with Escape.",
  },
  {
    id: "search",
    scene: "board",
    target: "search",
    placement: "bottom",
    title: "Search from here",
    body:
      "Ctrl K from anywhere on the page. The icon on the left switches engine. " +
      "As you type it offers your quick links, and your open tabs, bookmarks " +
      "and history if you turn those on. It also answers sums and conversions " +
      "outright, so “15% of 82” or “40 km in miles” needs no search at all.",
  },
  {
    needs: "widget",
    id: "tile",
    scene: "board",
    target: "tile",
    placement: "bottom",
    title: "Every tile is a widget",
    body:
      "Right-click any tile for its own menu: resize it, refresh it, duplicate " +
      "it, send it to the top, or remove it. That menu is the quickest way to " +
      "everything a single widget can do.",
  },
  {
    needs: "widget",
    id: "widget-settings",
    scene: "widget",
    target: "panel",
    placement: "left",
    title: "Each widget has its own settings",
    body:
      "This panel is the widget you clicked, not the app. Its size, its own " +
      "options, how often it refreshes, and anything it needs from you — a " +
      "city, a calendar address, a list of coins. Different widgets offer " +
      "different things here.",
  },
  {
    needs: "widget",
    id: "widget-colour",
    scene: "widget",
    target: "panel-colour",
    placement: "left",
    title: "Colour one widget at a time",
    body:
      "Set per widget rather than for the whole board, so you can tell one from " +
      "another at a glance. Everything inside the tile follows the colour you " +
      "pick, including its inputs and buttons.",
  },
  {
    id: "edit",
    scene: "edit",
    target: "edit-button",
    placement: "bottom",
    title: "Edit layout",
    body:
      "Alt E, or this button. In edit mode every tile shows its handles, and " +
      "you are in it now — the board behind this looks different already.",
  },
  {
    needs: "widget",
    id: "drag",
    scene: "edit",
    target: "handle",
    placement: "top",
    title: "Drag a widget by its bar",
    body:
      "The short bar under a tile is its handle. Pick it up and the other tiles " +
      "move out of the way as you go. You do not need edit mode for this — the " +
      "handle appears whenever you hover a tile.",
  },
  {
    id: "dock",
    scene: "edit",
    target: "dock",
    placement: "top",
    title: "Presets, and your own layout",
    body:
      "Start from a preset, or keep your own arrangement as “Yours” and come " +
      "back to it whenever you like. Auto arrange tidies what is already there " +
      "without adding or removing anything.",
  },
  {
    id: "store",
    scene: "store",
    target: null,
    title: "Add more widgets",
    body:
      "Alt A, or the Store button. Everything is here — clocks, weather, tasks, " +
      "habits, a calendar, prayer times, crypto, and more. Add as many as you " +
      "like, including two of the same one.",
  },
  {
    id: "appearance",
    scene: "settings",
    target: "settings-appearance",
    placement: "left",
    title: "Make it yours",
    body:
      "Theme, accent colour, wallpaper, how round and how solid the tiles are, " +
      "and whether they show their names at all. Turning the labels off gives " +
      "that row of space back to the widget.",
  },
  {
    id: "profiles",
    scene: "settings",
    target: "settings-profiles",
    placement: "left",
    title: "More than one board",
    body:
      "Up to three separate boards on one install — work and home, say. Each " +
      "keeps its own layout, appearance and widget settings. Switching is one " +
      "click from the top left once you have a second one.",
  },
  {
    id: "backup",
    scene: "settings",
    target: "settings-backup",
    placement: "left",
    title: "It is all yours to keep",
    body:
      "Export everything to a file and bring it back on another machine. Your " +
      "board syncs with your Chrome profile on its own, and nothing here is " +
      "sent anywhere else.",
  },
  {
    id: "done",
    scene: "board",
    target: null,
    title: "That is the tour",
    body:
      "Right-click anything you are unsure about — tiles, and the board itself, " +
      "both have menus. You can run this again any time from Settings.",
  },
];

// Steps that apply to this board.
//
// Filtered on what the board *has*, not on what is currently on screen. The
// first version asked whether each target existed in the DOM, which is only
// true once that step's scene has been staged — so at the moment the tour
// opened, the drawer, the dock and the store were all shut and it threw away
// nine of its thirteen steps and announced itself as "1 of 3".
//
// A board with no widgets is the one case where a step genuinely cannot apply:
// there is no tile to point at, no handle to drag and no widget whose settings
// to open. Pointing at nothing is worse than one step fewer — the card would
// sit in a corner describing something the reader cannot see.
export function usableSteps(steps, { hasWidgets = true } = {}) {
  return steps.filter((step) => step.needs !== "widget" || hasWidgets);
}

// Clamped rather than wrapped. A tour is a line with two ends, and arrowing
// past the last step onto the first would read as a bug.
export function stepAt(steps, index) {
  if (!steps.length) return null;
  return steps[Math.max(0, Math.min(steps.length - 1, index))];
}

export function nextIndex(steps, index) {
  return Math.min(steps.length - 1, index + 1);
}

export function prevIndex(index) {
  return Math.max(0, index - 1);
}

export function isLast(steps, index) {
  return index >= steps.length - 1;
}
