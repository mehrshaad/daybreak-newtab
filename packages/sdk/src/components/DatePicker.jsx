import { useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { formatDate } from "../utils";
import { MONO } from "../styles";
import { addMonths, monthGrid, WEEKDAY_LABELS } from "../monthGrid";
import Button from "./Button";
import Popover from "./Popover";

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

const NAV_HOVER = { background: "var(--sheetHover)", borderColor: "var(--accentLine)" };

const linkBtn = {
  border: 0,
  background: "transparent",
  color: "var(--faint)",
  fontSize: 11,
  cursor: "pointer",
  padding: 0,
};

const LINK_HOVER = { color: "var(--fg)" };

// Parses the widget's own "" | "YYYY-MM-DD" convention. Local midnight, not
// UTC — a UTC parse of a bare date string would land on the wrong day for
// half the world's timezones.
const parse = (value) => (value ? new Date(`${value}T00:00:00`) : null);

// A themed date picker, replacing the native <input type="date">.
//
// Shared rather than living inside the tasks widget, because the native control
// is the one thing that cannot be made to follow the app's own theme: Chrome
// draws its calendar button and popup inside its own shadow tree, out of reach
// of any style here. Any widget that needs a date should import this one.
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
      <Button
        ref={anchorRef}
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
        hover={{ background: "var(--sheetHover)", borderColor: "var(--accentLine)" }}
      >
        {value || placeholder}
      </Button>

      <Popover
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        placement="bottom-center"
        width={230}
      >
        <div style={{ padding: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Button
              aria-label="Previous month"
              onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
              style={navBtn}
              hover={NAV_HOVER}
            >
              <LuChevronLeft size={13} />
            </Button>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{monthLabel}</span>
            <Button
              aria-label="Next month"
              onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
              style={navBtn}
              hover={NAV_HOVER}
            >
              <LuChevronRight size={13} />
            </Button>
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
                <Button
                  key={d.iso}
                  onClick={() => pick(d.iso)}
                  aria-label={d.iso}
                  aria-current={isToday ? "date" : undefined}
                  hover={isSelected ? { opacity: 0.9 } : { background: "var(--sheetHover)" }}
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
                </Button>
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
            <Button onClick={() => pick(todayIso)} style={linkBtn} hover={LINK_HOVER}>
              Today
            </Button>
            {value ? (
              <Button onClick={() => pick("")} style={linkBtn} hover={LINK_HOVER}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </Popover>
    </>
  );
}

export default DatePicker;
