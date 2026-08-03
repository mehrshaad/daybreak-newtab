import { MONO } from "../../core/styles";
import { useMinutes, useSeconds } from "../../sdk/useRefresh";

function Clock({ options, focused }) {
  const { hour24, seconds, hideDate } = options;
  // Only run a per-second timer when seconds are actually displayed.
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
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span
          style={{
            fontSize: focused ? "clamp(56px, 9vw, 104px)" : "clamp(34px, 4.4vw, 56px)",
            fontWeight: 500,
            letterSpacing: "-.035em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {digits}
        </span>
        {meridiem ? (
          <span style={{ fontFamily: MONO, fontSize: "13px", color: "var(--faint)" }}>
            {meridiem}
          </span>
        ) : null}
      </div>
      {hideDate ? null : (
        <div
          style={{
            fontSize: focused ? "16px" : "13px",
            color: "var(--dim)",
            marginTop: "10px",
          }}
        >
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
