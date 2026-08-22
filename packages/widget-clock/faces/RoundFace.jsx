import { handAngles, handPoint } from "../angles";
import { useContinuousAngle } from "../continuous";

// The round face.
//
// It paints no dial. The tile is the dial, which is the whole idea: the face
// cannot disagree with the tile's own opacity, blur or wallpaper, because it
// adds no surface of its own. The previous attempt at this widget filled a
// gradient disc with a vignette on top of an already-translucent tile, and that
// — plus sixty ticks, tapered hands and a domed pin — is what read as a classic
// watch rather than a modern one.
//
// What is left is angle. Hierarchy comes from the shape of the markers, not
// their weight: four bars at the quarters, eight dots between. A 2px dot still
// looks deliberate at a small size, where a 2px tick just looks like grit.
// The accent appears exactly once, on the second hand.

const QUARTERS = [0, 90, 180, 270];
const DOTS = [30, 60, 120, 150, 210, 240, 300, 330];

// Markers end on the same circle so their outer edges line up. A bar drawn with
// a round cap reaches half its stroke width past its endpoint, which is why the
// bar stops 1.2 short of where the dots' centres sit.
const MARK_OUTER = 40;
const BAR_INNER = 34.5;
const DOT_R = 1.2;

// The minute hand stops clear of the dots' inner edge (38.8) rather than
// clipping through them at eight of the twelve positions.
const MINUTE_LEN = 36;
const HOUR_LEN = 26;

function Hand({ degrees, length, width, colour, transition }) {
  const smooth = useContinuousAngle(degrees);
  return (
    <line
      x1="50"
      y1="50"
      x2="50"
      y2={50 - length}
      stroke={colour}
      strokeWidth={width}
      strokeLinecap="round"
      style={{
        // Rotated rather than having its endpoint recomputed: a transition can
        // ease a rotation, and it lets the minute hand creep between minutes.
        transform: `rotate(${smooth}deg)`,
        transformOrigin: "50px 50px",
        transition,
      }}
    />
  );
}

function RoundFace({ date, showSeconds, showDate, label, accentFace }) {
  const { hour, minute, second } = handAngles(date);
  const day = date.getDate();

  return (
    // The svg is taken out of flow inside a box that flex has already sized.
    // Left in flow with width and height at 100%, it has no definite parent
    // height to resolve against, falls back to its own 1:1 ratio, and a wide
    // tile makes it as tall as it is wide — which the tile then clips.
    // Absolute inside a relative box gives it both dimensions outright, and
    // preserveAspectRatio (xMidYMid meet, the default) centres the square in it.
    <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%" }}>
      <svg
        viewBox="0 0 100 100"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label={label}
      >
      {/* 1.4 rather than a hairline: --line is 10% alpha, and at the two-column
          size a 1px line at 10% simply is not there, so the ring existed at one
          tile size and not another. */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke={accentFace ? "var(--accentLine)" : "var(--line)"}
        strokeWidth="1.4"
      />

      {QUARTERS.map((deg) => {
        const from = handPoint(deg, BAR_INNER);
        const to = handPoint(deg, MARK_OUTER);
        return (
          <line
            key={`q${deg}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--fg)"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity=".85"
          />
        );
      })}

      {DOTS.map((deg) => {
        const at = handPoint(deg, MARK_OUTER);
        return <circle key={`d${deg}`} cx={at.x} cy={at.y} r={DOT_R} fill="var(--dim)" opacity=".7" />;
      })}

      {/* Off-centre rather than at six o'clock, where it sat directly on the
          bottom marker. Here it clears the marker entirely and sits outside the
          hour hand's 26-unit reach; only the minute hand passes over it, and
          briefly. Same placement as the squared face, so the two agree. */}
      {showDate ? (
        <text
          x="70"
          y="74"
          textAnchor="middle"
          fill="var(--faint)"
          style={{ fontSize: 9, fontFamily: "inherit", fontVariantNumeric: "tabular-nums" }}
        >
          {day}
        </text>
      ) : null}

      <Hand
        degrees={hour}
        length={HOUR_LEN}
        width={3.4}
        colour="var(--fg)"
        transition="transform .6s cubic-bezier(.22,1,.36,1)"
      />
      <Hand
        degrees={minute}
        length={MINUTE_LEN}
        width={2.4}
        colour="var(--fg)"
        transition="transform .6s cubic-bezier(.22,1,.36,1)"
      />
      {/* No transition on the second hand, deliberately: it would either lag a
          second behind or need the seam special-cased, and neither reads as a
          clock. No pin either — a domed centre with counterweighted tails is
          the skeuomorphic tell this face exists to avoid. */}
      {showSeconds ? (
        <line
          x1="50"
          y1="50"
          x2="50"
          y2={50 - 40}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeLinecap="round"
          style={{ transform: `rotate(${second}deg)`, transformOrigin: "50px 50px" }}
        />
      ) : null}
      </svg>
    </div>
  );
}

export default RoundFace;
