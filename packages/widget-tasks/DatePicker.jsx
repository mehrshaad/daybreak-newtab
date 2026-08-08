import { useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { formatDate, MONO, Popover } from "@daybreak/sdk";
import { WEEKDAY_LABELS, addMonths, monthGrid } from "./calendar";

const navBtn = {
  width: 22,
  height: 22,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "var(--panel2)",
  color: "var(--fg)",
  cursor: "pointer",
  padding: 0,
};

const linkBtn = {
  border: 0,
  background: "transparent",
  color: "var(--faint)",
  fontSize: 11,
  cursor: "pointer",
  padding: 0,
};

// Parses the widget's own "" | "YYYY-MM-DD" convention. Local midnight, not
// UTC — a UTC parse of a bare date string would land on the wrong day for
// half the world's timezones.
const parse = (value) => (value ? new Date(`${value}T00:00:00`) : null);

// A themed due-date picker, replacing the native <input type="date"> — the
// browser's own control was the one piece of the widget that did not follow
// the app's own dark/light styling.
function DatePicker({ value, onChange, placeholder = "Due date" }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const anchorRef = useRef(null);

  const today = new Date();
  const todayIso = formatDate(today);

  const openPicker = () => {
    // Opens on the month the current value points at, or today's if there is
    // none — "default to now" is the picker's view, not the value a new task
    // gets, so this never writes anything back on its own.
    const seed = parse(value) || today;
    setView({ year: seed.getFullYear(), month: seed.getMonth() });
    setOpen(true);
  };

  const pick = (iso) => {
    onChange(iso);
    setOpen(false);
  };

  const days = view ? monthGrid(view.year, view.month) : [];
  const monthLabel = view
    ? new Date(view.year, view.month, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openPicker();
        }}
        aria-label={value ? `Due ${value}` : placeholder}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          background: "var(--panel2)",
          border: "1px solid var(--line)",
          outline: "none",
          fontSize: 12,
          fontFamily: MONO,
          color: value ? "var(--fg)" : "var(--faint)",
          cursor: "pointer",
        }}
      >
        {value || placeholder}
      </button>

      <Popover open={open} anchorRef={anchorRef} onClose={() => setOpen(false)} width={230}>
        <div style={{ padding: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
              style={navBtn}
            >
              <LuChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{monthLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
              style={navBtn}
            >
              <LuChevronRight size={13} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 2,
              marginBottom: 2,
            }}
          >
            {WEEKDAY_LABELS.map((w, i) => (
              <div
                key={i}
                style={{ textAlign: "center", fontSize: 10, color: "var(--faint)" }}
              >
                {w}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {days.map((d) => {
              const isToday = d.iso === todayIso;
              const isSelected = d.iso === value;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => pick(d.iso)}
                  aria-label={d.iso}
                  aria-current={isToday ? "date" : undefined}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    border: isToday ? "1.5px solid var(--accentLine)" : "1px solid transparent",
                    background: isSelected ? "var(--accent)" : "transparent",
                    color: isSelected
                      ? "var(--onAccent)"
                      : d.inMonth
                      ? "var(--fg)"
                      : "var(--faint)",
                    fontSize: 11,
                    fontFamily: MONO,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {d.date.getDate()}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--line)",
            }}
          >
            <button type="button" onClick={() => pick(todayIso)} style={linkBtn}>
              Today
            </button>
            {value ? (
              <button type="button" onClick={() => pick("")} style={linkBtn}>
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </Popover>
    </>
  );
}

export default DatePicker;
