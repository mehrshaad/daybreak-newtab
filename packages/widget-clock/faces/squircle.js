// The squared face's geometry, kept out of the component so it can be tested
// and so that file exports only a component.
//
// A superellipse rather than a rounded rectangle: a rounded rect meets its
// sides at a curvature discontinuity, and at this size the eye catches it.

export const HALF = 47;
// Squarer than a circle (2), well short of a rectangle. Chosen so the corner
// point still lands inside the 100-unit viewBox with the stroke on.
export const N = 4.6;

// Distance from the centre to the edge at a bearing, in degrees clockwise from
// twelve. Larger at the corners than on the flats, which is what gives the
// minute hand a gap that opens and closes as it sweeps.
export function edgeRadius(degrees) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return HALF / Math.pow(Math.pow(cos, N) + Math.pow(sin, N), 1 / N);
}

// The outline, sampled once at module load. 180 steps is smooth at every size
// this renders at and costs nothing after the first call.
export function squirclePath(scale = 1) {
  const steps = 180;
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const deg = (i / steps) * 360;
    const radians = ((deg - 90) * Math.PI) / 180;
    const r = edgeRadius(deg) * scale;
    d += `${i === 0 ? "M" : "L"} ${(50 + Math.cos(radians) * r).toFixed(2)} ${(
      50 +
      Math.sin(radians) * r
    ).toFixed(2)} `;
  }
  return `${d}Z`;
}
