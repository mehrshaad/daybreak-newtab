// A 7-day sparkline is ~168 hourly points — far more detail than a ~64px-wide
// line needs. Downsampled to a fixed point count so the SVG stays cheap and
// every coin's sparkline is built the same way regardless of how many
// samples CoinGecko actually returned.
const TARGET_POINTS = 24;

function downsample(points, target) {
  if (points.length <= target) return points;
  const step = (points.length - 1) / (target - 1);
  return Array.from({ length: target }, (_, i) => points[Math.round(i * step)]);
}

// Normalises a series of prices into an SVG `points` attribute string for a
// polyline filling a w×h box (SVG y grows downward, so the highest price
// lands at y=0). A flat series (every value equal) centers on the vertical
// midpoint rather than dividing by zero.
export function sparkPath(points, w, h) {
  if (!Array.isArray(points) || points.length < 2) return "";
  const sample = downsample(points, TARGET_POINTS);
  const min = Math.min(...sample);
  const max = Math.max(...sample);
  const range = max - min;
  return sample
    .map((v, i) => {
      const x = (i / (sample.length - 1)) * w;
      const y = range === 0 ? h / 2 : h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
