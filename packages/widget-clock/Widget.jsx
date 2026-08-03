import { MONO, useMinutes, useSeconds } from "@daybreak/sdk";

// Layout does not change when the tile is zoomed: zooming magnifies the board
// like a page zoom, so a tile that rearranged itself on the way in would look
// out of place. Sizing keys off the tile's own span instead.
function Clock({ options, size }) {
  const { hour24, seconds, hideDate } = options;
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

  const wide = (size?.[0] ?? 4) >= 4;

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
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: wide ? "clamp(34px, 4.4vw, 56px)" : "clamp(28px, 3.6vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-.035em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {digits}
        </span>
        {meridiem ? (
          <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--faint)" }}>
            {meridiem}
          </span>
        ) : null}
      </div>

      {hideDate ? null : (
        <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 10 }}>
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      )}
    </div>
  );
}

export default Clock;
