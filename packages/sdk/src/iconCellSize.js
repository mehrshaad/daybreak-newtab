// The footprint of one IconGrid cell. IconGrid uses it for the CSS column
// width; a caller that hides items behind a "+N more" affordance (Google
// Apps) needs the exact same numbers to know how many will actually fit a
// measured container, rather than guessing and clipping whatever guessed
// wrong.
export function iconCellSize(iconSize, showLabels) {
  const pad = Math.max(4, Math.round(iconSize * 0.16));
  const width = showLabels ? Math.round(iconSize * 1.6) : iconSize + 8;
  const fontSize = Math.max(9, Math.round(iconSize * 0.3));
  // padding top+bottom, the icon itself, and — only with a label — the gap
  // above it plus its line height. Mirrors IconGridItem's own button exactly.
  const height = 2 * pad + iconSize + (showLabels ? pad + Math.ceil(fontSize * 1.3) : 0);
  return { width, height };
}

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
export function iconGridSize(size, { hideLabels = false } = {}) {
  const rows = Array.isArray(size) ? size[1] || 2 : 2;
  const base = rows >= 4 ? 46 : rows === 3 ? 40 : 34;
  // Without a label underneath, that row of vertical space goes back into the
  // icon rather than being left empty.
  return hideLabels ? Math.round(base * 1.3) : base;
}
