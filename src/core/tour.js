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
// A step can name several, and the spotlight covers all of them at once — some
// ideas are one idea across three controls.
//
// Bodies mark their key phrases with **double asterisks**. Nobody reads a
// paragraph on a card they did not ask for; they scan it, and the bold is what
// they scan. Kept as a marker in the copy rather than as structured segments so
// the sentences stay readable in this file, which is where they get edited.
export const SCENES = ["board", "menu", "widget", "edit", "store", "settings"];

export const TOUR_STEPS = [
  {
    id: "welcome",
    scene: "board",
    target: null,
    title: "Hello!",
    body:
      "This is your new tab now. Everything on it is **yours to move, resize, " +
      "recolour or throw away**. Here is the quick version — about a minute, and " +
      "**Escape** gets you out whenever you have had enough.",
  },
  {
    id: "search",
    scene: "board",
    target: "search",
    placement: "bottom",
    title: "Start typing",
    body:
      "**Ctrl K** puts you here from anywhere on the page. The icon on the left " +
      "**switches engine**. It will suggest your quick links as you go, plus your " +
      "tabs, bookmarks and history once you say yes to those. And it **does " +
      "sums**: type “15% of 82” and the answer is just there.",
  },
  {
    needs: "widget",
    id: "tile",
    scene: "menu",
    // The tile and the menu it opened, lit as one. Lighting only the tile left
    // the menu itself sitting in the dimmed half of the screen, which is an odd
    // thing to do to the subject of the step.
    targets: ["tile", "tile-menu"],
    placement: "right",
    title: "Right-click does most of it",
    body:
      "This is the menu you get on **any tile** — resize, refresh, duplicate, send " +
      "to the top, remove. Right-clicking **the board itself** has its own menu " +
      "too. When you are not sure how to do something, **try right-clicking it**.",
  },
  {
    needs: "widget",
    id: "widget-settings",
    scene: "widget",
    target: "panel",
    placement: "left",
    title: "Every widget has a panel of its own",
    body:
      "This one belongs to **the widget, not the app**. Its size, its own options, " +
      "how often it refreshes, and whatever it needs from you — a city, a " +
      "calendar link, which coins to watch. **No two widgets offer quite the same " +
      "things here**, so it is worth a look at the ones you use.",
  },
  {
    needs: "widget",
    id: "widget-colour",
    scene: "widget",
    target: "panel-colour",
    placement: "left",
    title: "Give it a colour",
    body:
      "**One widget at a time**, so you can pick your tasks out of a full board " +
      "without reading a word. Everything inside the tile follows along, right " +
      "down to its buttons.",
  },
  {
    // Shown before anything is pressed, so the button is still a button rather
    // than something that already happened. The next step is what goes in.
    id: "edit-button",
    scene: "board",
    target: "edit-button",
    placement: "bottom",
    title: "Moving things around",
    body:
      "**Edit layout**, or **Alt E**. It puts the whole board into a state where " +
      "every tile can be picked up and shifted. Here is what that looks like.",
  },
  {
    needs: "widget",
    id: "drag",
    scene: "edit",
    target: "handle",
    placement: "top",
    title: "Grab the little bar",
    body:
      "And there it is. That short bar under a tile is **the handle** — pick a " +
      "tile up by it and the others shuffle out of the way as you go. **You do " +
      "not need edit mode for this**; hover any tile and its handle appears.",
  },
  {
    id: "dock",
    scene: "edit",
    target: "dock",
    placement: "top",
    title: "Presets, and your own",
    body:
      "Try a **preset** if you would rather not start from nothing. Once the board " +
      "is how you like it, keep it as **“Yours”** and you can always come back " +
      "to it. **Auto arrange** just tidies up what is already there.",
  },
  {
    id: "store-button",
    scene: "board",
    target: "store-button",
    placement: "bottom",
    title: "Want more widgets?",
    body: "They live behind **this button**. **Alt A** gets you there too.",
  },
  {
    id: "store",
    scene: "store",
    target: null,
    title: "Have a browse",
    body:
      "Clocks, weather, tasks, habits, a calendar, prayer times, crypto, and a " +
      "good few more. Take **as many as you like** — including **two of the same " +
      "one**, if you want two clocks in different cities.",
  },
  {
    // The same shape as the Store pair: the button first, then what it opens.
    id: "settings-button",
    scene: "board",
    target: "settings-button",
    placement: "bottom",
    title: "And everything else",
    body:
      "**Settings** lives here — how the whole board looks, what the search box " +
      "may look through, and a few things worth knowing about. Two minutes " +
      "in here is what turns this into your page rather than mine.",
  },
  {
    id: "appearance",
    scene: "settings",
    targets: ["settings-appearance", "settings-accent", "settings-background"],
    placement: "left",
    title: "Make it look like yours",
    body:
      "**Theme, accent, and the background** behind it all. Further down there is " +
      "how round and how solid the tiles are, and whether they show their names " +
      "at all — **turning those off gives the space back to the widget**.",
  },
  {
    id: "backup",
    scene: "settings",
    target: "settings-backup",
    placement: "left",
    title: "It is yours to keep",
    body:
      "Your board **follows your Chrome profile on its own**. This is for the " +
      "other cases: **save the lot to a file** and bring it back on a different " +
      "machine. **Nothing is sent anywhere else**, ever.",
  },
  {
    id: "profiles",
    scene: "board",
    target: "profile-slot",
    placement: "bottom",
    title: "Room for a second board",
    body:
      "Work and home, say — **up to three**, each with its own layout, look and " +
      "widget settings. Add one in Settings and **a switcher appears right here**, " +
      "so you are one click from the other.",
  },
  {
    id: "done",
    scene: "board",
    target: null,
    celebrate: true,
    title: "That is everything!",
    body:
      "Go and make a mess of it — **nothing here is permanent**, and there is an " +
      "undo for most of it. If you ever want this again, it is at **the bottom " +
      "of Settings**.",
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

// Splits a body into runs of plain and emphasised text. A three-line parser
// rather than a markdown dependency: the only syntax here is **, the copy is
// written in this file by the people who read this file, and a renderer that
// accepted more would only invite more.
//
// Odd-numbered runs are the emphasised ones, which falls out of splitting on
// the delimiter. An unclosed ** leaves its tail plain rather than swallowing
// the rest of the sentence.
export function emphasise(body) {
  const parts = String(body || "").split("**");
  const balanced = parts.length % 2 === 1;
  return parts
    .map((text, i) => ({ text, strong: balanced && i % 2 === 1 }))
    .filter((run) => run.text.length > 0);
}

// Every handle a step wants lit, whether it named one or several.
export function targetsOf(step) {
  if (!step) return [];
  if (step.targets) return step.targets;
  return step.target ? [step.target] : [];
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
