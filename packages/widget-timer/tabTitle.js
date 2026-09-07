// The countdown in the tab's own title, so a focus round is visible from a
// tab you are not looking at.
//
// The point of a Pomodoro is that you go and do the thing, which means the
// timer is running in a tab you have navigated away from. Until this, the only
// way to see how long was left was to come back to it — which is the one thing
// the round is asking you not to do.

const BASE = "New Tab";

// Who is allowed to write it.
//
// Duplicate is one right-click away, and two timers both writing the document
// title would fight over it every 250ms. The first running instance claims it
// and the rest leave it alone: not a policy anyone has to understand, because
// the second timer's own tile still shows its own countdown.
//
// Module-level rather than in a React context: there is one document title, it
// is not React state, and a widget package has no host context to reach for.
let holder = null;

export function claimTitle(id) {
  if (holder === null) holder = id;
  return holder === id;
}

export function releaseTitle(id) {
  if (holder !== id) return;
  holder = null;
  if (typeof document !== "undefined") document.title = BASE;
}

// "24:59 · Focus", or the plain title when nothing is running.
//
// The phase is named because "24:59" alone in a tab strip is a number with no
// subject, and a break is worth telling apart from a round at a glance.
export function titleFor({ running, clock, phase }) {
  if (!running || !clock) return BASE;
  return phase ? `${clock} · ${phase}` : clock;
}

export function writeTitle(id, text) {
  if (holder !== id || typeof document === "undefined") return;
  if (document.title !== text) document.title = text;
}

// Exported for the test, which has no business knowing the string twice.
export const BASE_TITLE = BASE;

// Only for tests: the claim is module state and a test that claims it would
// otherwise leak into the next one.
export function resetTitleOwner() {
  holder = null;
}
