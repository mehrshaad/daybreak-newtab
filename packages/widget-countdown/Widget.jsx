import { useEffect, useState } from "react";
import { formatJalali, LIST_BLEED, listRow, MONO, useMeasuredWidth } from "@daybreak/sdk";
import { formatRemaining, visibleEntries, yearsAt } from "./countdown";

// Once a minute. A countdown inside the last hour shows minutes, and a tab left
// open overnight has to notice that "tomorrow" became "today".
const TICK = 60000;

const DEFAULTS = [];

function dateLabel(date, calendar) {
  if (!date) return "";
  const gregorian = date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (calendar === "gregorian") return gregorian;
  const jalali = formatJalali(date, { withYear: false });
  if (calendar === "jalali") return jalali;
  return `${gregorian} · ${jalali}`;
}

function Countdown({ config, options, size }) {
  const { sort, calendar, keepPast, showEmoji } = options;
  const entries = Array.isArray(config.entries) ? config.entries : DEFAULTS;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), TICK);
    return () => clearInterval(t);
  }, []);

  const rows = visibleEntries(entries, now, { keepPast, sort });
  // Measured, not the span. See useMeasuredWidth: the same two-column tile is
  // 203px on the default board and 370px on a wide one, and only one of those
  // is actually narrow.
  const [boxRef, measured] = useMeasuredWidth();
  const narrow = measured == null ? (size?.[0] ?? 3) <= 2 : measured < 240;

  if (!rows.length) {
    return (
      <div
        ref={boxRef}
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          fontSize: 12,
          color: "var(--faint)",
          padding: "0 10px",
          lineHeight: 1.5,
        }}
      >
        {entries.length
          ? "Everything here has been and gone."
          : "Add a date in this widget's settings — a deadline, a trip, a birthday."}
      </div>
    );
  }

  return (
    <div
      ref={boxRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        // The bleed pattern the other list widgets use, with the padding put
        // back so the negative margins cannot create a scrollbar.
        margin: `0 -${LIST_BLEED}px`,
        padding: `0 ${LIST_BLEED}px`,
        overflowY: "auto",
        overflowX: "hidden",
        justifyContent: "safe center",
      }}
    >
      {rows.map(({ entry, occurrence, days }) => {
        const past = days != null && days < 0;
        const years = yearsAt(entry, occurrence);
        return (
          <div key={entry.id} style={listRow({ opacity: past ? 0.55 : 1, gap: 8 })}>
            {showEmoji && entry.emoji ? (
              <span style={{ fontSize: 15, flex: "none", lineHeight: 1 }} aria-hidden="true">
                {entry.emoji}
              </span>
            ) : null}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--fg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.title}
                {years ? (
                  <span style={{ color: "var(--faint)", fontSize: 11 }}> · {years}</span>
                ) : null}
              </div>
              {narrow ? null : (
                <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
                  {dateLabel(occurrence, calendar)}
                </div>
              )}
            </div>

            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                flex: "none",
                fontVariantNumeric: "tabular-nums",
                color: past ? "var(--faint)" : days === 0 ? "var(--accentText)" : "var(--dim)",
                // The number changes under its own steam every minute, so a
                // fade keeps it from snapping between values.
                transition: "color .3s ease",
              }}
            >
              {formatRemaining(occurrence, now)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Countdown;
