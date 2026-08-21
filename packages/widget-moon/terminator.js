// Drawing a moon honestly.
//
// The easy way is eight icons, one per named phase, which means the drawing is
// wrong for all but eight moments a month and jumps between them. The moon is
// a lit sphere, so what is visible is a circle with an ellipse taken out of it
// or added to it — and that ellipse's width is a continuous function of phase.
// One path, correct every night, and it animates because it is a number.

// Half-width of the terminator ellipse, as a share of the moon's radius.
//   1 at new and full   -> the shadow edge is a full circle
//   0 at the quarters   -> the shadow edge is a straight line
export function terminatorWidth(phase) {
  const p = ((phase % 1) + 1) % 1;
  // cos runs +1 -> -1 -> +1 across the month, which is exactly the shape
  // wanted; the sign says which side is lit and is handled by the caller.
  return Math.cos(2 * Math.PI * p);
}

export function isWaxing(phase) {
  const p = ((phase % 1) + 1) % 1;
  return p < 0.5;
}

// An SVG path for the lit part of the disc.
//
// Two arcs: the outer limb, which is always half the circle, and the
// terminator, whose bulge is `terminatorWidth`. A negative width flips the
// ellipse's sweep, which is what turns a crescent into a gibbous.
// Sub-pixel precision in a path is noise, and cos(pi/2) lands on 6.1e-17
// rather than 0, which would put "A 0.000000000000002 40" in the markup at
// every quarter moon.
const trim = (n) => Math.round(n * 1000) / 1000;

export function litPath(phase, radius) {
  const width = terminatorWidth(phase);
  const waxing = isWaxing(phase);
  const rx = trim(Math.abs(width) * radius);

  // The lit limb faces east when waxing and west when waning.
  const limbSweep = waxing ? 1 : 0;
  // When the terminator bulges away from the lit side the shape is gibbous, so
  // the inner arc sweeps the other way.
  const innerSweep = width > 0 ? (waxing ? 0 : 1) : (waxing ? 1 : 0);

  return [
    `M 0 ${-radius}`,
    `A ${radius} ${radius} 0 0 ${limbSweep} 0 ${radius}`,
    `A ${rx} ${radius} 0 0 ${innerSweep} 0 ${-radius}`,
    "Z",
  ].join(" ");
}

// "in 6 days", "tomorrow", "tonight".
export function whenLabel(days) {
  if (days == null) return "";
  if (days < 0.5) return "tonight";
  if (days < 1.5) return "tomorrow";
  return `in ${Math.round(days)} days`;
}
