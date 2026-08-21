import { handAngles } from "../angles";
import { useContinuousAngle } from "../continuous";
import { edgeRadius, squirclePath } from "./squircle";

// The squared face, in the same language as the round one: no dial fill, no
// gradient, no tick track. The tile is the dial here too.
//
// The shape is a superellipse (a squircle) rather than a rounded rectangle,
// because a rounded rect's corners meet its sides at a curvature discontinuity
// and the eye catches it at this size. Markers follow the edge outward, so the
// four corner ones sit further from the centre than the ones on the flats —
// which is the point of a squared dial, and it gives the minute hand a gap that
// visibly opens and closes as it sweeps. That changing gap is the whole reason
// to have this face at all.

const OUTLINE = squirclePath(1);
// A second hairline inboard of the first. With no fill, two lines carry the
// shape where one 10%-alpha line would not read at all.
const INNER = squirclePath(0.965);

const QUARTERS = [0, 90, 180, 270];
const DOTS = [30, 60, 120, 150, 210, 240, 300, 330];

// Markers are a fixed length, inset by a fraction of the edge. Making the
// length proportional too would leave the corner markers 20% longer than the
// ones on the flats, which reads as a mistake rather than as a shape.
const MARK_INSET = 0.985;
const MARK_LEN = 6.5;

const MINUTE_LEN = 38.5;
const HOUR_LEN = 25.5;

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
        transform: `rotate(${smooth}deg)`,
        transformOrigin: "50px 50px",
        transition,
      }}
    />
  );
}

function markEnds(degrees) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const outer = edgeRadius(degrees) * MARK_INSET;
  const inner = outer - MARK_LEN;
  return {
    x1: 50 + Math.cos(radians) * inner,
    y1: 50 + Math.sin(radians) * inner,
    x2: 50 + Math.cos(radians) * outer,
    y2: 50 + Math.sin(radians) * outer,
    inner,
  };
}

function SquaredFace({ date, size, showSeconds, showDate, label, accentFace }) {
  const { hour, minute, second } = handAngles(date);
  const day = date.getDate();

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: size, aspectRatio: "1 / 1", display: "block", flex: "none" }}
      role="img"
      aria-label={label}
    >
      <path
        d={OUTLINE}
        fill="none"
        stroke={accentFace ? "var(--accentLine)" : "var(--line)"}
        strokeWidth="1.4"
      />
      <path d={INNER} fill="none" stroke="var(--line)" strokeWidth=".7" opacity=".7" />

      {QUARTERS.map((deg) => {
        const m = markEnds(deg);
        return (
          <line
            key={`q${deg}`}
            x1={m.x1}
            y1={m.y1}
            x2={m.x2}
            y2={m.y2}
            stroke="var(--fg)"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity=".85"
          />
        );
      })}

      {DOTS.map((deg) => {
        const m = markEnds(deg);
        // The dot sits where the bar's outer end would be, so both families of
        // marker share one line around the edge.
        return <circle key={`d${deg}`} cx={m.x2} cy={m.y2} r="1.2" fill="var(--dim)" opacity=".7" />;
      })}

      {/* Straight onto the dial in the corner, with no plate behind it. A plate
          drawn in --panel over a --panel2 dial composites *lighter* than the
          dial in both themes, so it reads raised rather than recessed. The
          corner is also the space a squared face buys, and the hour hand cannot
          reach it: the corner is 35 away and the hand is 25.5 long. */}
      {showDate ? (
        <text
          x="74"
          y="78"
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
      {showSeconds ? (
        <line
          x1="50"
          y1="50"
          x2="50"
          y2={50 - 41}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeLinecap="round"
          style={{ transform: `rotate(${second}deg)`, transformOrigin: "50px 50px" }}
        />
      ) : null}
    </svg>
  );
}

export default SquaredFace;
