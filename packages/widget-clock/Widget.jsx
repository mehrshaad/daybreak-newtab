import { MONO, useMeasuredWidth, useMinutes, useSeconds } from "@daybreak/sdk";
import RoundFace from "./faces/RoundFace";
import SquaredFace from "./faces/SquaredFace";

// Layout does not change when the tile is zoomed: zooming magnifies the board
// like a page zoom, so a tile that rearranged itself on the way in would look
// out of place. Sizing keys off the tile's own span instead.
function Clock({ options, size }) {
  const { hour24, seconds, hideDate, analog, align, accentFace, face, dialDate } = options;
  const bySecond = useSeconds(!!seconds);
  const byMinute = useMinutes();
  const now = seconds ? bySecond : byMinute;

  const time = now.toLocaleTimeString(undefined, {
    hour: hour24 ? "2-digit" : "numeric",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : null),
    hour12: !hour24,
  });

  // Split the meridiem off so it can be set smaller, as in the design.
  const match = time.match(/\s?([AP]M)$/i);
  const meridiem = match ? match[1] : "";
  const digits = match ? time.slice(0, match.index) : time;

  // The taller size exists to be bigger, so it drives the type and the face.
  const tall = (size?.[1] ?? 2) >= 3;
  // Measured width, not the grid span: a two-column tile is 203px on the
  // default board and 370px on a full-width one, and the digits fit perfectly
  // well at 370. The span rule shrank them either way. 240px is where they stop
  // fitting, and is the same answer as the old rule on the default board.
  const [boxRef, measured] = useMeasuredWidth();
  const narrow = measured == null ? (size?.[0] ?? 3) <= 2 : measured < 240;

  // Transitioned rather than swapped: alignment is a thing the user changes
  // while looking at it, and the digits sliding across reads as the setting
  // taking effect. `align-items` cannot be transitioned, so the row is laid out
  // with auto margins, which can.
  const centred = align === "center";
  const right = align === "right";

  // The date has one home at a time. With it inside the dial, the line below
  // the face has to go, or the day is printed twice on the same tile — and the
  // in-dial numeral then carries it for screen readers too rather than being
  // decorative.
  const Face = face === "squared" ? SquaredFace : RoundFace;
  const inDial = !!(analog && dialDate && !hideDate);

  const date = hideDate ? null : (
    <div
      style={{
        fontSize: tall ? 14 : narrow ? 11 : 13,
        color: "var(--dim)",
        marginTop: narrow ? 6 : 10,
        // Same auto-margin trick as the digits, so the two move together.
        marginInlineStart: centred || right ? "auto" : 0,
        marginInlineEnd: centred ? "auto" : 0,
        transition: "margin .32s cubic-bezier(.22,1,.36,1)",
        whiteSpace: "nowrap",
      }}
    >
      {now.toLocaleDateString(undefined, {
        // A long weekday and month will not fit two columns; the short forms
        // still say everything the line is for.
        weekday: narrow ? "short" : "long",
        month: narrow ? "short" : "long",
        day: "numeric",
      })}
    </div>
  );

  const body = analog ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          flex: 1,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {/* No pixel cap: the face fills whatever the tile has left after the
            label row and the date line, and the viewBox letterboxes itself
            inside that box. The old caps left a 2x2 tile mostly empty, because
            92px was a guess about how much room there would be rather than a
            measurement of it. */}
        <Face
          date={now}
          showSeconds={!!seconds}
          showDate={inDial}
          accentFace={!!accentFace}
          label={time}
        />
        {inDial ? null : date}
      </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          width: "fit-content",
          marginInlineStart: centred || right ? "auto" : 0,
          marginInlineEnd: centred ? "auto" : 0,
          transition: "margin .32s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <span
          style={{
            fontSize: tall
              ? "clamp(44px, 6.4vw, 84px)"
              : narrow
              ? "clamp(22px, 2.4vw, 32px)"
              : "clamp(28px, 3.6vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-.035em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {digits}
        </span>
        {meridiem ? (
          <span
            style={{
              fontFamily: MONO,
              fontSize: tall ? 16 : narrow ? 11 : 13,
              color: "var(--faint)",
            }}
          >
            {meridiem}
          </span>
        ) : null}
      </div>

      {date}
    </div>
  );

  // Keyed on the *options*, never on the time: a change of mode remounts and
  // fades, while a tick does not. Keying on the displayed value instead would
  // re-fade the whole clock every second with the second hand switched on.
  //
  // Alignment is deliberately absent from the key — it animates by sliding its
  // own margins, and a remount would throw that away and snap instead.
  return (
    <div
      ref={boxRef}
      key={[
        analog ? `analog-${face || "round"}` : "digital",
        seconds ? "s" : "",
        hideDate ? "" : "d",
        inDial ? "in" : "",
        accentFace ? "a" : "",
      ].join("-")}
      style={{ display: "flex", flex: 1, minWidth: 0, animation: "db-fade .28s ease both" }}
    >
      {body}
    </div>
  );
}

export default Clock;
