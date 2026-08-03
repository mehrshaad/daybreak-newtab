// What each size shows. The extra room has to carry extra information, not the
// same information larger: 3x2 is the baseline, a wider tile gains the
// high/low/feels row, and a taller one gains a labelled detail grid and puts an
// icon on every hour of the strip.
export function layoutFor(size) {
  const cols = size?.[0] ?? 3;
  const rows = size?.[1] ?? 2;
  const tall = rows >= 3;
  return {
    tall,
    stats: cols >= 4 || tall,
    // The grid replaces the one-line version rather than joining it.
    details: tall,
    hours: tall ? 6 : 5,
    hourIcons: tall,
  };
}
