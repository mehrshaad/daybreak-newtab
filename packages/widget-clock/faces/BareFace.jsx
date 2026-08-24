import { useMeasuredBox } from "@daybreak/sdk";
import { handAngles } from "../angles";
import { useContinuousAngle } from "../continuous";
import { dialDateText } from "./dialDate";
import { edgeMarker, edgePoint } from "./edge";

// The clock when the tile has no chrome of its own: the widget *is* the clock.
//
// The other two faces draw a dial inside the tile — a circle or a squircle,
// always the same shape whatever the tile's proportions. That reads as a clock
// drawn on a card. With the tile's header gone there is no card left to draw
// on, and the honest thing is to let the tile be the dial: no outline, and the
// hour markers projected onto the tile's own rectangle so they sit at its
// edges however wide or tall the board made it.
//
// Which is why this one measures. The other faces can use a fixed square
// viewBox and let preserveAspectRatio centre it; this one needs the real
// proportions, because that is the whole shape it is drawing to.

const QUARTERS = [0, 90, 180, 270];
const DOTS = [30, 60, 120, 150, 210, 240, 300, 330];

// Insets from the tile's true edge, in pixels rather than viewBox units — the
// coordinate system here is the tile, so a fixed inset stays a fixed inset at
// every tile size instead of growing with the widget.
const EDGE_INSET = 10;
const BAR_LEN = 11;
const DOT_R = 1.7;

function Hand({ degrees, length, width, colour, transition, cx, cy }) {
  const smooth = useContinuousAngle(degrees);
  return (
    <line
      x1={cx}
      y1={cy}
      x2={cx}
      y2={cy - length}
      stroke={colour}
      strokeWidth={width}
      strokeLinecap="round"
      style={{
        transform: `rotate(${smooth}deg)`,
        transformOrigin: `${cx}px ${cy}px`,
        transition,
      }}
    />
  );
}

function BareFace({ date, showSeconds, showDate, label, accentFace }) {
  const { hour, minute, second } = handAngles(date);
  const [boxRef, box] = useMeasuredBox();

  const width = box?.width || 0;
  const height = box?.height || 0;
  const cx = width / 2;
  const cy = height / 2;
  const halfW = Math.max(0, cx - EDGE_INSET);
  const halfH = Math.max(0, cy - EDGE_INSET);
  // Hands are sized from the shorter axis so they never reach past the near
  // edge on an oblong tile, which is what would happen if they followed the
  // markers out to the corners.
  const reach = Math.min(halfW, halfH);

  return (
    <div
      ref={boxRef}
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        // Out past the tile's own padding, so the dial is the tile rather than
        // a drawing inside it. Tile.jsx publishes how far it may go.
        margin: "calc(var(--tile-bleed-y, 0px) * -1) calc(var(--tile-bleed-x, 0px) * -1)",
        width: "calc(100% + var(--tile-bleed-x, 0px) * 2)",
        // Nothing in a clock face is interactive, and once it bleeds it covers
        // the whole tile — including the strip at the bottom where the drag
        // handle lives, and every pixel a right-click might land on. Setting
        // this on the svg alone was not enough: this wrapper is a plain div and
        // was swallowing both.
        pointerEvents: "none",
      }}
    >
      {box ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            // Nothing here is interactive, and the dial now covers the whole
            // tile — including the strip at the bottom where the drag handle
            // lives and every pixel a right-click might land on. Without this
            // the clock would swallow both.
            pointerEvents: "none",
          }}
          role="img"
          aria-label={label}
        >
          {QUARTERS.map((deg) => {
            const m = edgeMarker(deg, halfW, halfH, BAR_LEN);
            return (
              <line
                key={`q${deg}`}
                x1={cx + m.x1}
                y1={cy + m.y1}
                x2={cx + m.x2}
                y2={cy + m.y2}
                stroke={accentFace ? "var(--accent)" : "var(--fg)"}
                strokeWidth="3"
                strokeLinecap="round"
                opacity=".85"
              />
            );
          })}

          {DOTS.map((deg) => {
            const p = edgePoint(deg, halfW, halfH);
            return (
              <circle
                key={`d${deg}`}
                cx={cx + p.x}
                cy={cy + p.y}
                r={DOT_R}
                fill="var(--dim)"
                opacity=".7"
              />
            );
          })}

          {/* The numeral goes between the centre and the four-o'clock edge,
              scaled to the dial so it keeps its place on any tile. The full
              date is too wide for that corner, so it is centred and dropped
              below the hub instead — the same arrangement the other two faces
              use, in pixels rather than viewBox units. */}
          {showDate ? (
            <text
              x={showDate === "day" ? cx + reach * 0.46 : cx}
              y={cy + reach * (showDate === "day" ? 0.5 : 0.56)}
              textAnchor="middle"
              fill="var(--faint)"
              style={{
                fontSize:
                  showDate === "day"
                    ? Math.max(10, reach * 0.17)
                    : Math.max(9, reach * 0.115),
                fontFamily: "inherit",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {dialDateText(date, showDate)}
            </text>
          ) : null}

          <Hand
            cx={cx}
            cy={cy}
            degrees={hour}
            length={reach * 0.58}
            width={Math.max(3, reach * 0.045)}
            colour="var(--fg)"
            transition="transform .6s cubic-bezier(.22,1,.36,1)"
          />
          <Hand
            cx={cx}
            cy={cy}
            degrees={minute}
            length={reach * 0.86}
            width={Math.max(2, reach * 0.032)}
            colour="var(--fg)"
            transition="transform .6s cubic-bezier(.22,1,.36,1)"
          />
          {showSeconds ? (
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - reach * 0.92}
              stroke="var(--accent)"
              strokeWidth={Math.max(1, reach * 0.014)}
              strokeLinecap="round"
              style={{ transform: `rotate(${second}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}

export default BareFace;
