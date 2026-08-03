// Icons for the WMO condition groups that utils' wmoWeather() maps to.
//
// Drawn here rather than pulled from an icon set so they share one visual
// language with the app mark — the same amber sun and blue water — and so the
// night variants can swap the sun for a moon without hunting for a matching
// pair. Colours are fixed rather than themed: weather reads as weather, and an
// amber sun on any accent looks deliberate.

const SUN = "#f9a63a";
const MOON = "#cbd5e6";
const CLOUD_DARK = "#8f9bb3";
const CLOUD_LIGHT = "#c3ccdd";
const RAIN = "#5b93f9";
const SNOW = "#a8c8f5";
const BOLT = "#ffcc4d";

function Sun({ cx = 12, cy = 11, r = 5 }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      {rays.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + Math.cos(a) * (r + 2.2)}
            y1={cy + Math.sin(a) * (r + 2.2)}
            x2={cx + Math.cos(a) * (r + 4.4)}
            y2={cy + Math.sin(a) * (r + 4.4)}
            stroke={SUN}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
    </g>
  );
}

function Moon({ cx = 12, cy = 11, r = 5.5 }) {
  // Crescent by subtraction, so it reads at small sizes.
  return (
    <g>
      <defs>
        <mask id="db-moon">
          <rect width="24" height="24" fill="#fff" />
          <circle cx={cx + r * 0.75} cy={cy - r * 0.6} r={r} fill="#000" />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={MOON} mask="url(#db-moon)" />
    </g>
  );
}

const Cloud = ({ y = 13 }) => (
  <path
    d={`M7 ${y + 3.5}a3.4 3.4 0 0 1 .5-6.8 4.8 4.8 0 0 1 9.1 1.5 3 3 0 0 1-.6 5.3z`}
    fill={CLOUD_DARK}
  />
);

const Drops = ({ from = 18, n = 3, color = RAIN, len = 3 }) =>
  Array.from({ length: n }, (_, i) => (
    <line
      key={i}
      x1={7.5 + i * 4}
      y1={from}
      x2={6.3 + i * 4}
      y2={from + len}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  ));

function ConditionIcon({ condition, day = true, size = 28 }) {
  const shell = {
    width: size,
    height: size,
    display: "block",
    flex: "none",
  };
  const svg = (children) => (
    <svg viewBox="0 0 24 24" style={shell} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );

  switch (condition) {
    case "clouds":
      return svg(
        <>
          {day ? <Sun cx={16} cy={8} r={3.6} /> : <Moon cx={16.5} cy={7.5} r={4} />}
          <path
            d="M6.5 17.5a3.6 3.6 0 0 1 .6-7.2 5 5 0 0 1 9.5 1.6 3.1 3.1 0 0 1-.6 5.6z"
            fill={CLOUD_LIGHT}
          />
        </>
      );

    case "fog":
      return svg(
        <>
          <Cloud y={11} />
          {[16.5, 19, 21.5].map((y, i) => (
            <line
              key={y}
              x1={4 + (i % 2) * 2}
              y1={y}
              x2={20 - (i % 2) * 2}
              y2={y}
              stroke={CLOUD_LIGHT}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ))}
        </>
      );

    case "drizzle":
      return svg(
        <>
          <Cloud y={11} />
          <Drops from={17} n={3} len={2.4} />
        </>
      );

    case "rain":
      return svg(
        <>
          <Cloud y={11} />
          <Drops from={17} n={3} len={4} />
        </>
      );

    case "snow":
      return svg(
        <>
          <Cloud y={11} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={7.5 + i * 4} cy={19 + (i % 2) * 1.5} r="1.5" fill={SNOW} />
          ))}
        </>
      );

    case "thunderstorm":
      return svg(
        <>
          <Cloud y={11} />
          <path d="M12.6 15.5 9.4 20h2.3l-.9 3.2 3.4-4.8h-2.4z" fill={BOLT} />
        </>
      );

    case "clear":
    default:
      return svg(day ? <Sun /> : <Moon />);
  }
}

export default ConditionIcon;
