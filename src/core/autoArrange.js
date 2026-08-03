import { getWidget, resolveSize } from "../widgets/registry";

// Repack the board so tiles tile neatly instead of leaving the ragged holes
// that `grid-auto-flow: dense` produces once sizes have been changed by hand.
//
// Nothing is added or removed — this only reorders, and only ever returns a
// permutation of the ids it was given.
//
// Rows are filled greedily: walk the remaining tiles and take the widest one
// that still fits the space left on the current row, which is the standard
// first-fit-decreasing shelf heuristic and is plenty for a dozen tiles.
export function autoArrange(ids, sizes, columns = 12) {
  const items = ids.map((id) => ({
    id,
    w: Math.min(resolveSize(id, sizes)[0], columns),
    h: resolveSize(id, sizes)[1],
  }));

  // Taller tiles first at equal width, so a 4x3 anchors a row rather than
  // being stranded at the end.
  const pending = [...items].sort((a, b) => b.w - a.w || b.h - a.h);
  const out = [];

  while (pending.length) {
    let left = columns;
    let placedAny = false;
    // Fill one row.
    for (let i = 0; i < pending.length; ) {
      if (pending[i].w <= left) {
        left -= pending[i].w;
        out.push(pending[i].id);
        pending.splice(i, 1);
        placedAny = true;
        if (left === 0) break;
      } else {
        i += 1;
      }
    }
    // A tile wider than the whole row would loop forever; give it its own row.
    if (!placedAny) out.push(pending.shift().id);
  }

  return out;
}

// How much of the grid the current arrangement leaves empty, as a fraction.
// Used to decide whether auto-arrange is worth offering.
export function packingWaste(ids, sizes, columns = 12) {
  if (!ids.length) return 0;
  let used = 0;
  let rowLeft = columns;
  let rows = 1;
  for (const id of ids) {
    if (!getWidget(id)) continue;
    const [w, h] = resolveSize(id, sizes);
    const width = Math.min(w, columns);
    if (width > rowLeft) {
      rows += 1;
      rowLeft = columns;
    }
    rowLeft -= width;
    used += width * h;
  }
  const capacity = rows * columns;
  return capacity ? Math.max(0, 1 - used / capacity) : 0;
}
