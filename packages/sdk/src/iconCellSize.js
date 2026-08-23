// The footprint of one IconGrid cell, and every measurement inside it.
//
// IconGrid uses this for the CSS column width and for the padding on each
// button; a caller that hides items behind a "+N more" affordance (Google
// Apps) needs the same numbers to know how many will actually fit a measured
// container, rather than guessing and clipping whatever guessed wrong.
//
// Everything the cell is made of comes out of here, rather than each caller
// recomputing `Math.max(4, Math.round(iconSize * 0.16))` from memory. That
// duplication is what the old comment meant by "mirrors IconGridItem's own
// button exactly" — a promise kept by hand, in four places, in two packages.

// Padding between the icon and the edge of its own button. Was 0.16, which on a
// 34px icon put 6px of dead space above and below every row and left a 2x2 tile
// showing small icons inside a large empty box.
const PAD = 0.1;

// Between the icon and its caption. Kept looser than the outer padding, or the
// caption reads as part of the icon rather than as a label under it.
const LABEL_GAP = 0.14;

// The caption tracks the icon only until it reaches a normal caption size, and
// then stops. It is a label, not part of the artwork: at the largest icon size
// an unbounded 0.3 put 30px type under the name of a bookmark, which reads as
// a heading with a picture above it rather than an icon with a caption.
const FONT = 0.3;
const FONT_MAX = 11;

// Between cells. Wider than the padding inside them, so the space between two
// icons reads as a gap and not as more of the same cushion.
const GRID_GAP = 0.16;

// A cell is wider than its icon so a short caption has somewhere to go. Without
// captions it needs only enough to not touch its neighbour.
//
// 1.38 and not the 1.6 this started from, because cell width is what decides
// how many icons land on a row, and a bigger icon in a proportionally wider
// cell buys nothing: a 4x3 tile on a 1100px window went from four icons across
// to three, which wraps the four links both widgets ship with. Captions
// truncate a character or two sooner and that is the cheaper loss.
const WIDTH_WITH_LABEL = 1.38;
const WIDTH_BARE = 6;

// What the icon gains when there is no caption under it. Not the full 1.3 it
// was: a bare icon is already the widest thing in its cell, and at 1.3 the same
// 4x3 tile lost a column that way instead.
const BARE_GAIN = 1.22;

export function iconCellSize(iconSize, showLabels) {
  const pad = Math.max(3, Math.round(iconSize * PAD));
  const labelGap = Math.max(4, Math.round(iconSize * LABEL_GAP));
  const fontSize = Math.max(9, Math.min(FONT_MAX, Math.round(iconSize * FONT)));
  const gap = Math.max(4, Math.round(iconSize * GRID_GAP));
  const width = showLabels ? Math.round(iconSize * WIDTH_WITH_LABEL) : iconSize + WIDTH_BARE;
  // padding top+bottom, the icon itself, and — only with a label — the gap
  // above it plus its line height.
  const height = 2 * pad + iconSize + (showLabels ? labelGap + Math.ceil(fontSize * 1.3) : 0);
  return { width, height, pad, labelGap, fontSize, gap };
}

// The three sizes the icon widgets offer, smallest first.
export const ICON_STEPS = ["s", "m", "l"];

// M is 1, so it is whatever the size rules below already decided and nobody's
// board changes by updating. The other two are far enough either side to be
// worth choosing: a step you cannot see is a setting that looks broken.
const STEP_SCALE = { s: 0.78, m: 1, l: 1.22 };

// How big an icon should be for a tile of a given size.
//
// This used to be `150 / columnSpan` in each of the three grid widgets, which
// is backwards: it made a *wider* tile draw *smaller* icons. A 3-wide tile got
// 42px and a 5-wide one got 30px, so growing the widget shrank its contents.
//
// The formula made sense when the grid had a fixed number of columns and the
// icons had to divide a fixed width between them. IconGrid packs with
// `auto-fit` now, so the tile's width decides how many icons fit per row and
// has no business deciding how big they are. Height is what constrains size:
// a taller tile can afford a bigger icon and still fit a second row of them.
//
// The bases went up with the padding coming down — the room freed by tighter
// cells belongs to the icons, which is the whole point of the change.
export function iconGridSize(size, { hideLabels = false, step = "m" } = {}) {
  const rows = Array.isArray(size) ? size[1] || 2 : 2;
  const base = rows >= 4 ? 62 : rows === 3 ? 52 : 42;
  const scaled = base * (STEP_SCALE[step] ?? STEP_SCALE.m);
  // Without a label underneath, that row of vertical space goes back into the
  // icon rather than being left empty.
  return Math.round(hideLabels ? scaled * BARE_GAIN : scaled);
}

// The padding a scrolling icon grid needs. Each cell's remove badge sits 2px
// outside its own box, and a scroller clips whatever leaves it — without this
// every badge would lose its top-right corner.
export const ICON_GRID_PAD = 4;
