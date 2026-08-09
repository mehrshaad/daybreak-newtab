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
