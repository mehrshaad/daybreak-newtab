import { PRIMARY_PROFILE } from "./profiles";

// Replaying the tour on a board built for it, without touching the board the
// person actually uses.
//
// The first run has it easy: the board is the default layout and every step
// has something to point at. Replaying it later does not — five of the fifteen
// steps need a widget on the board, and somebody who has cleared theirs down
// to a clock gets a tour that talks about a tile menu it cannot open. Running
// it over their real board is worse: the steps open drawers, enter edit mode
// and change a tile's colour, and doing that to a board somebody has arranged
// is not a demonstration, it is an edit.
//
// So a replay gets a profile of its own, seeded with a board shaped like the
// one the tour describes.
//
// The id is a word rather than a number, which is load-bearing twice over:
// nextProfileId only ever mints numbers, so this can never collide with a real
// profile, and it is not in the roster at all — so it does not count against
// MAX_PROFILES, does not appear in the switcher, and cannot be renamed or
// deleted by accident.
export const TOUR_PROFILE = "tour";

// Where to go back to when the tour ends, and the fact that a tour is running
// at all. In localStorage because switching profiles reloads the page, so this
// has to survive the reload that starts the tour.
const SESSION_KEY = "daybreak2tourReturn";

export function isTourProfile(id) {
  return id === TOUR_PROFILE;
}

// The profile a replay should return to, or null if no replay is running.
export function tourReturnTo() {
  try {
    return localStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
}

export function startTourSession(returnTo) {
  try {
    localStorage.setItem(SESSION_KEY, returnTo || PRIMARY_PROFILE);
  } catch {
    // Without the marker the tour still runs; the guard below is what stops
    // somebody being stranded in it.
  }
}

export function endTourSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
}

// The one state worth guarding against: the tour profile is active and no
// replay is running. That means a reload landed in it after the marker was
// cleared, or a crash took the tour down mid-flow, and without this the person
// is simply stuck on a board that is not theirs with no way back that they
// would think to look for.
export function strandedInTour(activeId) {
  return isTourProfile(activeId) && !tourReturnTo();
}

// The board a replay runs on.
//
// Chosen to match what the steps actually talk about rather than to look
// impressive: the tour opens a tile's menu, its settings panel and its colour
// row, so the board needs tiles; it demonstrates dragging, so it needs more
// than one; and it should be recognisable as Daybreak rather than as a board
// nobody would build.
//
// tourDone stays false — this profile exists to run the tour — and the name
// comes across so the greeting is not addressed to a stranger.
export const TOUR_BOARD = ["clock", "weather", "links", "tasks"];

export function seedForTour(defaults, from) {
  return {
    ...defaults,
    board: {
      ...defaults.board,
      ids: [...TOUR_BOARD],
      installed: [...TOUR_BOARD],
      sizes: { clock: [3, 2], weather: [4, 2], links: [5, 2], tasks: [4, 3] },
      layoutName: "Custom",
      saved: null,
    },
    profile: { ...defaults.profile, name: from?.profile?.name || defaults.profile.name },
    appearance: { ...defaults.appearance, ...(from?.appearance || null) },
    behavior: { ...defaults.behavior, tourDone: false },
  };
}
