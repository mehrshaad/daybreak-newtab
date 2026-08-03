import { handAngles, handPoint } from "./angles";

// Drawn on a 100x100 viewBox and scaled by the caller, so one set of
// proportions covers every tile size. Colours come from the host's tokens, which
// is what keeps the face in step with the theme and the accent.

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

function Hand({ degrees, length, width, colour, cap = "round", back = 0 }) {
  const tip = handPoint(degrees, length);
  const tail = handPoint(degrees + 180, back);
  return (
    <line
      x1={tail.x}
      y1={tail.y}
      x2={tip.x}
      y2={tip.y}
      stroke={colour}
      strokeWidth={width}
      strokeLinecap={cap}
    />
  );
}

function AnalogFace({ date, size, showSeconds, label }) {
  const { hour, minute, second } = handAngles(date);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
      }}
    >
      {/* Sized in CSS rather than by the width attribute, so `size` can be a
          min() expression: a percentage of the tile, capped in pixels so a short
          tile cannot be overflowed by a wide one. */}
      <svg
        viewBox="0 0 100 100"
        style={{ width: size, aspectRatio: "1 / 1", display: "block", flex: "none" }}
        role="img"
        aria-label={label}
      >
        <circle cx="50" cy="50" r="48" fill="var(--panel)" stroke="var(--line)" />
        {TICKS.map((deg) => {
          const quarter = deg % 90 === 0;
          const from = handPoint(deg, quarter ? 38 : 41);
          const to = handPoint(deg, 44);
          return (
            <line
              key={deg}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={quarter ? "var(--dim)" : "var(--line)"}
              strokeWidth={quarter ? 2.4 : 1.6}
              strokeLinecap="round"
            />
          );
        })}

        <Hand degrees={hour} length={25} width={4.4} colour="var(--fg)" back={7} />
        <Hand degrees={minute} length={37} width={3} colour="var(--fg)" back={9} />
        {showSeconds ? (
          <Hand degrees={second} length={40} width={1.4} colour="var(--accent)" back={12} />
        ) : null}
        <circle cx="50" cy="50" r="3" fill="var(--fg)" />
        {showSeconds ? <circle cx="50" cy="50" r="1.4" fill="var(--accent)" /> : null}
      </svg>
    </div>
  );
}

export default AnalogFace;
