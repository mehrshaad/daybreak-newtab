// The notification queue's logic, kept out of the component so it can be
// tested without a DOM or a clock.
//
// A notice is not just a message: it can carry an action, it belongs to a
// category the user can switch off, and it owns a countdown that freezes while
// the pointer is on it. All of that is state, and state that lives inside a
// component with three timers in it is state nobody can check.

export const CATEGORIES = ["info", "undo", "update", "performance", "sync", "error"];

// What each category is called in settings, and why someone would keep it.
export const CATEGORY_LABELS = {
  info: "Confirmations",
  undo: "Undo prompts",
  update: "New versions",
  performance: "Performance hints",
  sync: "Sync problems",
  error: "Widget errors",
};

// How long each kind sits there. An undo prompt has to outlast the moment of
// doubt; a confirmation that something saved does not.
export const CATEGORY_DURATION = {
  info: 2600,
  undo: 7000,
  update: 12000,
  performance: 12000,
  sync: 12000,
  error: 9000,
};

// More than this on screen at once and it stops being information. Oldest go
// first — the newest message is the one the user just caused.
export const MAX_VISIBLE = 3;

let seq = 0;

export function makeNotice(input) {
  const category = CATEGORIES.includes(input.category) ? input.category : "info";
  const duration = Number.isFinite(input.duration)
    ? Math.max(0, input.duration)
    : CATEGORY_DURATION[category];
  return {
    id: (seq += 1),
    message: String(input.message ?? ""),
    category,
    // 0 means it stays until dismissed. Anything that needs an explicit
    // decision should say so rather than vanishing mid-thought.
    duration,
    action: input.action ? { label: input.action.label, run: input.action.run } : null,
    // Kept as a fraction so the border can be drawn without the component
    // needing to know how long the notice was meant to last.
    remaining: 1,
    frozen: false,
  };
}

// Silence is checked here, not at the call site: a caller should be able to
// report a condition without first asking whether anyone wants to hear it.
export function isSilenced(settings, category) {
  const n = settings?.notifications;
  if (!n) return false;
  if (n.enabled === false) return true;
  return n.categories?.[category] === false;
}

export function addNotice(list, notice) {
  // A repeat of a message already on screen refreshes it rather than stacking a
  // duplicate — a widget retrying a failing fetch every 30s should not build a
  // tower of identical warnings.
  const duplicate = list.findIndex(
    (n) => n.message === notice.message && n.category === notice.category
  );
  if (duplicate !== -1) {
    const next = list.slice();
    next[duplicate] = { ...next[duplicate], remaining: 1, frozen: false };
    return next;
  }
  const next = [...list, notice];
  return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
}

export function removeNotice(list, id) {
  return list.filter((n) => n.id !== id);
}

export function freezeNotice(list, id, frozen) {
  return list.map((n) => (n.id === id ? { ...n, frozen } : n));
}

// One tick of the countdown. Frozen notices and ones with no duration are left
// alone; anything that has run out is reported so the caller can drop it.
export function tickNotices(list, elapsed) {
  const expired = [];
  const next = list.map((n) => {
    if (n.frozen || !n.duration) return n;
    const remaining = n.remaining - elapsed / n.duration;
    if (remaining <= 0) {
      expired.push(n.id);
      return { ...n, remaining: 0 };
    }
    return { ...n, remaining };
  });
  return { list: next, expired };
}
