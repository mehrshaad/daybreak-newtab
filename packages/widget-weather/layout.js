// What each size shows. The extra room has to carry extra information, not the
// same information larger: 3x2 is the baseline, a wider tile gains the
// high/low/feels row, and a taller one gains a labelled detail grid and puts an
// icon on every hour of the strip.
export function layoutFor(size, focused) {
  const cols = size?.[0] ?? 3;
  const rows = size?.[1] ?? 2;
  const tall = rows >= 3;
  return {
    tall,
    // Zoomed, everything is on show whatever the tile's span.
    stats: cols >= 4 || tall || focused,
    details: tall || focused,
    hours: tall ? 6 : cols >= 5 ? 7 : 5,
    hourIcons: tall,
  };
}
