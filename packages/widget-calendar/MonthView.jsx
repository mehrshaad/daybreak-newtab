import { useMemo } from "react";
import {
  formatDate,
  JALALI_MONTHS,
  monthGrid,
  MONO,
  toHijri,
  toJalali,
  weekdayLabels,
} from "@daybreak/sdk";
import { holidaysOn } from "./holidays";

// The month grid.
//
// The widget was an agenda list, which is a useful thing and not a calendar:
// there was no way to see that the 14th is a Saturday, or how far off the end of
// the month a deadline is. A grid answers those at a glance, and the agenda is
// still underneath it for the detail.

const CELL_MIN = 26;

function alternateFor(date, alternate) {
  if (alternate === "jalali") {
    const j = toJalali(date);
    return { day: j.jd, monthLabel: `${JALALI_MONTHS[j.jm - 1]} ${j.jy}` };
  }
  if (alternate === "hijri") {
    const h = toHijri(date);
    // Nothing rather than a guess where Intl has no Hijri calendar.
    return h ? { day: h.day, monthLabel: `${h.monthName} ${h.year}` } : null;
  }
  return null;
}

// The alternate month spanning a Gregorian one: a Gregorian month always
// straddles two, so naming just the one the 1st falls in would leave the header
// wrong for most of the month. Taken from the middle, which is the month the
// grid mostly shows.
function alternateHeader(year, month, alternate) {
  if (alternate === "none") return null;
  const middle = new Date(year, month, 15);
  const at = alternateFor(middle, alternate);
  return at?.monthLabel || null;
}

function Cell({
  cell,
  today,
  selected,
  alternate,
  eventCount,
  holidays,
  weekendDays,
  onPick,
}) {
  const { date, inMonth, iso } = cell;
  const isToday = iso === today;
  const isSelected = iso === selected;
  const alt = alternate === "none" ? null : alternateFor(date, alternate);
  const isWeekend = weekendDays.includes(date.getDay());
  const isHoliday = holidays.length > 0;

  // Outside the month, everything reads back: it is context for the edges of
  // the grid, not something to be picked out of it.
  const strength = inMonth ? 1 : 0.32;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onPick(iso);
      }}
      aria-label={`${date.toDateString()}${
        holidays.length ? `, ${holidays.map((h) => h.name).join(", ")}` : ""
      }${eventCount ? `, ${eventCount} event${eventCount === 1 ? "" : "s"}` : ""}`}
      aria-current={isToday ? "date" : undefined}
      aria-pressed={isSelected}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        minWidth: 0,
        minHeight: CELL_MIN,
        padding: "2px 0 4px",
        border: 0,
        borderRadius: 8,
        cursor: "pointer",
        // Today is a filled chip and the selection a ring, so the two read as
        // different things and can both be true at once.
        background: isToday ? "var(--accent)" : isSelected ? "var(--panel2)" : "transparent",
        boxShadow: isSelected && !isToday ? "inset 0 0 0 1px var(--accentLine)" : "none",
        transition: "background .15s ease, box-shadow .15s ease",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
          color: isToday
            ? "var(--onAccent)"
            : isHoliday
            ? "var(--danger)"
            : isWeekend
            ? "var(--faint)"
            : "var(--fg)",
          opacity: strength,
        }}
      >
        {date.getDate()}
      </span>
      {alt ? (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 8,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
            color: isToday ? "var(--onAccent)" : "var(--faint)",
            opacity: strength * (isToday ? 0.8 : 1),
          }}
        >
          {alt.day}
        </span>
      ) : null}
      {/* One dot for any events that day, not one per event: a cell this size
          cannot show a count, and a row of dots at three pixels apart reads as
          noise rather than as three things. */}
      {eventCount ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 2,
            width: 3,
            height: 3,
            borderRadius: 999,
            background: isToday ? "var(--onAccent)" : "var(--accent)",
            opacity: strength,
          }}
        />
      ) : null}
    </button>
  );
}

function MonthView({
  year,
  month,
  selected,
  onSelect,
  onMove,
  alternate = "none",
  weekStart = 0,
  showHolidays = false,
  eventsByDay,
  weekendDays,
}) {
  const grid = useMemo(() => monthGrid(year, month, weekStart), [year, month, weekStart]);
  const today = formatDate(new Date());
  const labels = weekdayLabels(weekStart);
  const altHeader = alternateHeader(year, month, alternate);
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    // Takes the height the day panel below it does not need, rather than
    // sitting at a fixed size with the leftover left blank. On a four-row tile
    // that was most of the lower half of the widget doing nothing.
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
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
            {monthLabel}
          </div>
          {/* The alternate month, named from the middle of the Gregorian one:
              every Gregorian month straddles two Jalali or Hijri months, so
              naming the one the 1st falls in is wrong for most of the month. */}
          {altHeader ? (
            <div
              style={{
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "var(--faint)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {altHeader}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 2, flex: "none" }}>
          {[
            ["‹", -1, "Previous month"],
            ["·", 0, "Back to today"],
            ["›", 1, "Next month"],
          ].map(([glyph, delta, label]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation();
                onMove(delta);
              }}
              style={{
                width: 20,
                height: 20,
                display: "grid",
                placeItems: "center",
                padding: 0,
                border: 0,
                borderRadius: 6,
                background: "transparent",
                color: "var(--faint)",
                cursor: "pointer",
                fontSize: delta === 0 ? 16 : 13,
                lineHeight: 1,
              }}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>

      <div
        role="grid"
        aria-label={monthLabel}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          // The header row takes what it needs and the six week rows share the
          // rest, so a taller tile draws bigger cells instead of the same small
          // grid with space underneath.
          gridTemplateRows: "auto repeat(6, minmax(0, 1fr))",
          gap: 1,
          flex: 1,
          minHeight: 0,
        }}
      >
        {labels.map((letter, i) => (
          <div
            key={`h${i}`}
            role="columnheader"
            aria-hidden="true"
            style={{
              fontFamily: MONO,
              fontSize: 9,
              textAlign: "center",
              color: "var(--faint)",
              paddingBottom: 2,
            }}
          >
            {letter}
          </div>
        ))}
        {grid.map((cell) => (
          <Cell
            key={cell.iso}
            cell={cell}
            today={today}
            selected={selected}
            alternate={alternate}
            weekendDays={weekendDays}
            eventCount={eventsByDay.get(cell.iso) || 0}
            holidays={showHolidays ? holidaysOn(cell.date) : []}
            onPick={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default MonthView;
