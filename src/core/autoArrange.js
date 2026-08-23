import { essentialsFirst } from "./essentials";
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

  // The shelf packing above sorts purely by size, so clock and weather can
  // land anywhere; move them back to the front once the packing is decided.
  return essentialsFirst(out);
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

// How many columns the arrangement actually occupies at its widest.
//
// The board is twelve tracks, and a board whose widest row reaches eleven of
// them has a dead strip a full column wide down its right-hand side, on every
// row. Nothing is wrong with the tiles; the grid is simply wider than anything
// in it. Board.jsx narrows the grid to this many tracks and lets it centre, so
// the slack is split between both margins instead of all landing on the right.
//
// This has to model what the browser actually does, and the browser does
// `grid-auto-flow: row dense` — a two-dimensional placement that backfills
// holes left by earlier tiles. A first-fit walk over the widths is not the same
// thing and gets a different answer: on the board that prompted this, the walk
// said twelve while the rendered layout only ever reached eleven, so the fix
// did nothing. Tile heights matter, which is why this tracks occupancy rather
// than a running total.
//
// The occupancy map is bounded by the tallest sensible board, and a tile that
// cannot be placed within it is simply skipped rather than looping forever.
const MAX_ROWS = 400;

export function usedColumns(ids, sizes, columns = 12) {
  const taken = new Set();
  const free = (row, col, w, h) => {
    for (let r = row; r < row + h; r += 1) {
      for (let c = col; c < col + w; c += 1) {
        if (taken.has(`${r},${c}`)) return false;
      }
    }
    return true;
  };

  let widest = 0;
  for (const id of ids) {
    // Skipped for the same reason the board skips it: an unknown id renders
    // nothing, and an invisible tile must not reserve grid space.
    if (!getWidget(id)) continue;
    const [rawW, rawH] = resolveSize(id, sizes);
    const w = Math.max(1, Math.min(rawW, columns));
    const h = Math.max(1, rawH);

    let placed = false;
    for (let row = 0; row < MAX_ROWS && !placed; row += 1) {
      for (let col = 0; col + w <= columns; col += 1) {
        if (!free(row, col, w, h)) continue;
        for (let r = row; r < row + h; r += 1) {
          for (let c = col; c < col + w; c += 1) taken.add(`${r},${c}`);
        }
        if (col + w > widest) widest = col + w;
        placed = true;
        break;
      }
    }
  }
  return Math.max(1, Math.min(columns, widest));
}
