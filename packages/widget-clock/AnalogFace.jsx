import { handAngles, handPoint } from "./angles";

// Drawn on a 100x100 viewBox and scaled by the caller, so one set of
// proportions covers every tile size. Colours come from the host's tokens, which
// is what keeps the face in step with the theme and the accent.
//
// The hands are rotated with a transform rather than having their endpoints
// recomputed. That is what lets them be transitioned: a line whose x2/y2 change
// jumps, while a rotation can be eased. It also means the minute hand creeps
// between minutes instead of stepping, which is what a real one does.

const HOURS = Array.from({ length: 12 }, (_, i) => i * 30);
const MINUTES = Array.from({ length: 60 }, (_, i) => i * 6).filter((d) => d % 30 !== 0);

function Hand({ degrees, length, width, colour, back = 0, tapered = false, transition }) {
  return (
    <g
      style={{
        // Rotated about the centre. -degrees + 0 because handPoint already put
        // 12 o'clock at the top; a plain rotate needs the same origin.
        transform: `rotate(${degrees}deg)`,
        transformOrigin: "50px 50px",
        transition,
      }}
    >
      {tapered ? (
        // A hand that narrows towards its tip, which is most of what makes a
        // face look drawn rather than plotted.
        <polygon
          points={`50,${50 - length} ${50 + width / 2},${50 - length * 0.2} 50,${50 + back} ${
            50 - width / 2
          },${50 - length * 0.2}`}
          fill={colour}
        />
      ) : (
        <line
          x1="50"
          y1={50 + back}
          x2="50"
          y2={50 - length}
          stroke={colour}
          strokeWidth={width}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function AnalogFace({ date, size, showSeconds, label, accentFace = false }) {
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
        <defs>
          {/* Lit from the top left, like everything else on the board. A flat
              disc is the thing that made the old face read as a diagram. */}
          <radialGradient id="db-clock-dial" cx="34%" cy="28%" r="88%">
            <stop offset="0%" stopColor="var(--panel2)" />
            <stop offset="100%" stopColor="var(--panel)" />
          </radialGradient>
          <radialGradient id="db-clock-vignette" cx="50%" cy="50%" r="50%">
            <stop offset="72%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.16)" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#db-clock-dial)" />
        <circle cx="50" cy="50" r="48" fill="url(#db-clock-vignette)" />
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={accentFace ? "var(--accentLine)" : "var(--line)"}
          strokeWidth="1"
        />
        {/* An inner ring, which is what gives a dial its edge without a heavy
            border. */}
        <circle cx="50" cy="50" r="42.5" fill="none" stroke="var(--line)" strokeWidth=".6" />

        {/* Sixty marks, not twelve: the minute ticks are most of the difference
            between a watch face and a pie chart. Kept very light so they read
            as texture rather than as data. */}
        {MINUTES.map((deg) => {
          const from = handPoint(deg, 39.5);
          const to = handPoint(deg, 42);
          return (
            <line
              key={`m${deg}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--line)"
              strokeWidth=".8"
              strokeLinecap="round"
            />
          );
        })}

        {HOURS.map((deg) => {
          const quarter = deg % 90 === 0;
          const from = handPoint(deg, quarter ? 34 : 37.5);
          const to = handPoint(deg, 42);
          return (
            <line
              key={`h${deg}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={quarter ? "var(--fg)" : "var(--dim)"}
              strokeWidth={quarter ? 2.6 : 1.5}
              strokeLinecap="round"
              opacity={quarter ? 0.9 : 0.5}
            />
          );
        })}

        {/* Hour and minute ease between positions; the second hand does not.
            A transitioned second hand either lags visibly or has to be told to
            skip the 59->0 wrap, and neither looks like a clock. */}
        <Hand
          degrees={hour}
          length={26}
          width={5.6}
          colour="var(--fg)"
          back={8}
          tapered
          transition="transform .6s cubic-bezier(.22,1,.36,1)"
        />
        <Hand
          degrees={minute}
          length={37}
          width={3.6}
          colour="var(--fg)"
          back={10}
          tapered
          transition="transform .6s cubic-bezier(.22,1,.36,1)"
        />
        {showSeconds ? (
          <Hand degrees={second} length={40} width={1.2} colour="var(--accent)" back={13} />
        ) : null}

        {/* The pin: a ring rather than a dot, so the hands look pinned through
            it instead of ending on top of it. */}
        <circle cx="50" cy="50" r="3.6" fill="var(--panel2)" stroke="var(--fg)" strokeWidth="1.4" />
        {showSeconds ? <circle cx="50" cy="50" r="1.5" fill="var(--accent)" /> : null}
      </svg>
    </div>
  );
}

export default AnalogFace;
