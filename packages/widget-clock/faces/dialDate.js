// The date printed on an analog dial.
//
// Shared by all three faces so they cannot drift: they already disagreed once
// about where the numeral sat, and the fix was to write the same coordinates
// into each of them by hand.
//
// Two forms, because a dial has room for either but not always for both kinds
// of reader. "day" is the bare numeral in a date window, off to one side the
// way a watch prints it. "full" is the whole thing — weekday, day, month —
// which needs the middle of the dial to have room for its width.

export const DIAL_DATES = ["full", "day"];

export function dialDateText(date, mode) {
  if (mode === "day") return String(date.getDate());
  // Short forms throughout: a dial is a small place, and "Wednesday" alone is
  // wider than the whole window the numeral gets.
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Where it goes and how big, in the 100x100 viewBox the round and squared
// faces share.
//
// The numeral keeps each face's own date window, which is not the same spot on
// both: the round face puts it at four o'clock, 31 units out, and the squared
// face uses the corner its shape buys it. Both clear the hour hand. The full
// date cannot go in either — it is four times as wide and would run off the
// dial — so it is centred instead and dropped low enough to clear the hub.
export function dialDatePlacement(mode, dayWindow) {
  if (mode === "day") return { ...dayWindow, fontSize: 9 };
  return { x: 50, y: 76, fontSize: 7.5 };
}
