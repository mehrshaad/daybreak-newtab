// Whether the board on screen still matches the snapshot in "Yours".
//
// The snapshot is the one thing on the board that can be lost, and until now
// nothing said whether it was current. It got written in two ways — an explicit
// save, and silently on the first preset switch, to stop that switch destroying
// an arrangement with no way back — and afterwards the dock offered a 28px
// rotate-arrow to overwrite it, an icon that reads as "undo" rather than "save".
// So the state a person actually wants to know, "is what I am looking at
// saved", was not shown anywhere.
//
// Compared on ids in order and on the sizes of those ids. Order is part of the
// arrangement, so a reorder counts as a change. Sizes are compared only for ids
// that are on the board: `sizes` keeps entries for widgets that have since been
// removed, and a stale key for something no longer there is not a difference
// anybody can see.
export function savedViewState(board) {
  if (!board?.saved) return "none";
  const ids = board.ids || [];
  const savedIds = board.saved.ids || [];
  if (ids.length !== savedIds.length) return "changed";
  if (ids.some((id, at) => id !== savedIds[at])) return "changed";

  const sizes = board.sizes || {};
  const savedSizes = board.saved.sizes || {};
  const sameSize = (a, b) => {
    // An absent size means "the widget's own default", so absent and absent
    // match, and absent never equals an explicit one.
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a[0] === b[0] && a[1] === b[1];
  };
  if (ids.some((id) => !sameSize(sizes[id], savedSizes[id]))) return "changed";
  return "saved";
}
