// The colour of the sky, as a function of how high the sun is.
//
// Kept apart from the component and kept pure, because "does dusk actually look
// like dusk" is a question about numbers before it is a question about taste,
// and because the moon widget borrows the same night end of the scale so the
// two sit next to each other without clashing.

// Stops down the altitude scale, in degrees. Between any two the colours are
// interpolated, so the sky moves continuously through the day rather than
// switching between four presets.
const STOPS = [
  // Deep night.
  { alt: -18, top: [8, 11, 24], bottom: [12, 16, 32], glow: [30, 38, 64] },
  // Astronomical to nautical twilight: the first hint of colour.
  { alt: -12, top: [14, 20, 44], bottom: [26, 30, 58], glow: [58, 62, 104] },
  // Civil twilight — the blue hour.
  { alt: -6, top: [30, 44, 92], bottom: [86, 74, 126], glow: [140, 106, 150] },
  // Sunrise and sunset themselves.
  { alt: 0, top: [64, 88, 150], bottom: [232, 138, 96], glow: [255, 172, 108] },
  // Golden hour, the sun clear of the horizon but still low.
  { alt: 6, top: [88, 132, 196], bottom: [244, 186, 126], glow: [255, 206, 140] },
  // Full day.
  { alt: 20, top: [92, 152, 220], bottom: [176, 208, 240], glow: [255, 232, 176] },
  { alt: 60, top: [70, 138, 224], bottom: [156, 198, 244], glow: [255, 244, 208] },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const mix = (a, b, t) => a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
export const rgb = (channels) => `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;

// The three colours a sky needs: the top of the dome, the horizon, and the
// light the sun itself is throwing.
export function skyAt(altitude) {
  const alt = clamp(altitude, STOPS[0].alt, STOPS[STOPS.length - 1].alt);

  let lower = STOPS[0];
  let upper = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    if (alt >= STOPS[i].alt && alt <= STOPS[i + 1].alt) {
      lower = STOPS[i];
      upper = STOPS[i + 1];
      break;
    }
  }

  const span = upper.alt - lower.alt;
  const t = span === 0 ? 0 : (alt - lower.alt) / span;

  return {
    top: mix(lower.top, upper.top, t),
    bottom: mix(lower.bottom, upper.bottom, t),
    glow: mix(lower.glow, upper.glow, t),
  };
}

// Where on the arc the sun sits, as a point on a half circle. `progress` is 0
// at sunrise and 1 at sunset, so the sun travels left to right over the top.
export function arcPoint(progress, { width, height, padding = 16 }) {
  const radius = (width - padding * 2) / 2;
  const cx = width / 2;
  const cy = height;
  const angle = Math.PI * clamp(progress, 0, 1);
  return {
    x: cx - radius * Math.cos(angle),
    // Squashed a little: a true semicircle in a wide short tile puts the sun
    // absurdly high at noon relative to how far it has travelled.
    y: cy - radius * Math.sin(angle) * 0.72,
  };
}

// How much of the day is gone, phrased the way a person would say it.
export function lengthLabel(seconds) {
  if (seconds == null) return "—";
  const total = Math.round(seconds / 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

// "+2m 14s longer than yesterday", or the other direction. Seconds are worth
// keeping: near a solstice the daily change is under a minute, and rounding it
// away leaves the line reading "the same as yesterday" for a fortnight.
export function deltaLabel(seconds, short = false) {
  if (seconds == null) return "";
  const sign = seconds >= 0 ? "+" : "−";
  const abs = Math.abs(Math.round(seconds));
  const minutes = Math.floor(abs / 60);
  const rest = abs % 60;
  const amount = minutes ? `${minutes}m ${String(rest).padStart(2, "0")}s` : `${rest}s`;
  return short ? `${sign}${amount}` : `${sign}${amount} on yesterday`;
}
