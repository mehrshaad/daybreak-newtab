import { moveItem } from "@daybreak/sdk";

// Reordering only ever sees the *visible* rows (hideCompleted can hide some
// of `items`), so a plain from/to index into `items` itself would be wrong —
// dragging the second visible row past the third would silently also jump
// over any completed tasks sitting between them. Hidden items stay pinned at
// their own positions; the visible ones are woven back in, in their new
// relative order, wherever a visible item used to be.
export function reorderVisible(items, visibleIds, from, to) {
  const newVisibleOrder = moveItem(visibleIds, from, to);
  const byId = new Map(items.map((it) => [it.id, it]));
  const visibleSet = new Set(visibleIds);
  let cursor = 0;
  return items.map((it) =>
    visibleSet.has(it.id) ? byId.get(newVisibleOrder[cursor++]) : it
  );
}
