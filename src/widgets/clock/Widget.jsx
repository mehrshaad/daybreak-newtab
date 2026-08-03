import { MONO } from "../../core/styles";
import { useMinutes, useSeconds } from "../../sdk/useRefresh";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  return n + (s[(n % 100 - 20) % 10] || s[n % 100] || s[0]);
};

function weekOfYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - start) / 86400000 + 1) / 7);
}

function Clock({ options, focused, size }) {
  const { hour24, seconds, hideDate } = options;
  // Zoomed in, seconds are worth showing whether or not the option is on —
  // there is room for them and a still clock looks broken at that scale.
  const wantSeconds = !!seconds || focused;
  const bySecond = useSeconds(wantSeconds);
  const byMinute = useMinutes();
  const now = wantSeconds ? bySecond : byMinute;

  const time = now.toLocaleTimeString(undefined, {
    hour: hour24 ? "2-digit" : "numeric",
    minute: "2-digit",
    ...(wantSeconds ? { second: "2-digit" } : null),
    hour12: !hour24,
  });

  // Split the meridiem off so it can be set smaller, as in the design.
  const match = time.match(/\s?([AP]M)$/i);
  const meridiem = match ? match[1] : "";
  const digits = match ? time.slice(0, match.index) : time;

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(now.getFullYear(), 0, 0)) /
      86400000
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        flex: 1,
        minWidth: 0,
        // Zoomed, the clock owns the whole card, so centre it instead of
        // leaving it pinned to the top-left of a mostly empty box.
        alignItems: focused ? "center" : "flex-start",
        textAlign: focused ? "center" : "left",
        gap: focused ? "clamp(8px, 1.6vh, 20px)" : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: focused ? "clamp(8px, 1vw, 18px)" : "8px",
        }}
      >
        <span
          style={{
            fontSize: focused
              ? "clamp(72px, 15vw, 240px)"
              : size?.[0] >= 4
              ? "clamp(34px, 4.4vw, 56px)"
              : "clamp(28px, 3.6vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-.04em",
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
              fontSize: focused ? "clamp(14px, 1.6vw, 26px)" : "13px",
              color: "var(--faint)",
            }}
          >
            {meridiem}
          </span>
        ) : null}
      </div>

      {hideDate ? null : (
        <div
          style={{
            fontSize: focused ? "clamp(15px, 1.9vw, 30px)" : "13px",
            color: "var(--dim)",
            marginTop: focused ? 0 : "10px",
          }}
        >
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      )}

      {/* Extra context only when there is room for it. */}
      {focused ? (
        <div
          className="db-reveal"
          style={{
            display: "flex",
            gap: "clamp(14px, 3vw, 44px)",
            marginTop: "clamp(10px, 2.4vh, 34px)",
            fontFamily: MONO,
            fontSize: "clamp(10px, 1vw, 13px)",
            color: "var(--faint)",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>week {weekOfYear(now)}</span>
          <span>{ordinal(dayOfYear)} day</span>
          <span>{zone.replace(/_/g, " ")}</span>
        </div>
      ) : null}
    </div>
  );
}

export default Clock;
