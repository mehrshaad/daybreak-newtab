import { useMemo } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { Appear, Button, JALALI_MONTHS, MONO, formatDate, monthGrid, toHijri, toJalali, weekdayLabels } from "@daybreak/sdk";
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
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onPick(iso);
      }}
      hover={isToday ? { opacity: 0.9 } : { background: "var(--sheetHover)" }}
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
    </Button>
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
  // Whether the grid is showing the month we are actually in, which is what
  // decides if "back to today" has anywhere to go.
  const now = new Date();
  const onCurrentMonth = year === now.getFullYear() && month === now.getMonth();

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
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: "none" }}>
          {/* "Back to today", which used to be a middot between the arrows.
              A middot says nothing — and on the current month the button did
              nothing either, so it was an unlabelled control that sometimes
              worked. It is a word now, and it only appears when there is
              somewhere to go back from. */}
          <Appear open={!onCurrentMonth} style={{ display: "flex" }}>
            <Button
              aria-label="Back to today"
              onClick={(e) => {
                e.stopPropagation();
                onMove(0);
              }}
              hover={{ background: "var(--sheetHover)", color: "var(--fg)" }}
              style={{
                height: 20,
                display: "grid",
                placeItems: "center",
                padding: "0 7px",
                marginRight: 2,
                border: 0,
                borderRadius: 6,
                background: "var(--panel)",
                color: "var(--dim)",
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Today
            </Button>
          </Appear>

          {/* Real icons rather than the ‹ › glyphs, which rendered at whatever
              weight the font felt like and did not match any other control in
              the app. */}
          {[
            [LuChevronLeft, -1, "Previous month"],
            [LuChevronRight, 1, "Next month"],
          ].map(([Icon, delta, label]) => (
            <Button
              key={label}
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation();
                onMove(delta);
              }}
              hover={{ background: "var(--sheetHover)", color: "var(--fg)" }}
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
              }}
            >
              <Icon size={13} />
            </Button>
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
