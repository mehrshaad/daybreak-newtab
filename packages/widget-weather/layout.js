// What each size shows. The extra room has to carry extra information, not the
// same information larger: 3x2 is the baseline, a wider tile gains the
// high/low/feels row, and a taller one gains a labelled detail grid and puts an
// icon on every hour of the strip.
//
// 2x2 is the other end of that, and it is not a smaller 3x2. Two columns is
// about 210px of usable width, where five hours of a mono strip needs closer
// to 190 before its gaps — so it wrapped onto a second line and pushed itself
// out of a two-row tile. A narrow tile shows three hours and a smaller
// readout, which is what actually fits.
export function layoutFor(size) {
  const cols = size?.[0] ?? 3;
  const rows = size?.[1] ?? 2;
  const tall = rows >= 3;
  const narrow = cols <= 2;
  return {
    tall,
    narrow,
    stats: cols >= 4 || tall,
    // The grid replaces the one-line version rather than joining it.
    details: tall && !narrow,
    hours: narrow ? 3 : tall ? 6 : 5,
    hourIcons: tall && !narrow,
  };
}
