import { MONO, useMinutes, useSeconds } from "@daybreak/sdk";
import AnalogFace from "./AnalogFace";

// Layout does not change when the tile is zoomed: zooming magnifies the board
// like a page zoom, so a tile that rearranged itself on the way in would look
// out of place. Sizing keys off the tile's own span instead.
function Clock({ options, size }) {
  const { hour24, seconds, hideDate, analog, align } = options;
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
  // A two-column tile is a third the width of a three-column one, so the
  // digits have to come down or they simply do not fit.
  const narrow = (size?.[0] ?? 3) <= 2;

  // Transitioned rather than swapped: alignment is a thing the user changes
  // while looking at it, and the digits sliding across reads as the setting
  // taking effect. `align-items` cannot be transitioned, so the row is laid out
  // with auto margins, which can.
  const centred = align === "center";
  const right = align === "right";

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

  if (analog) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          flex: 1,
          minWidth: 0,
        }}
      >
        <AnalogFace
          date={now}
          size={tall ? "min(74%, 208px)" : narrow ? "min(92%, 92px)" : "min(88%, 122px)"}
          showSeconds={!!seconds}
          label={time}
        />
        {date}
      </div>
    );
  }

  return (
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
}

export default Clock;
