import { useState } from "react";
import { LuCheck, LuMinus, LuPlus, LuSettings2, LuTrash2 } from "react-icons/lu";
import { MONO, uid, useWidgetLocal } from "@daybreak/sdk";
import { toggleDay } from "./streak";
import { habitProgress, weekStartIndex } from "./weeks";

const DEFAULTS = [
  { id: "h1", name: "Read 20 pages", target: 5, targetWeeks: 0 },
  { id: "h2", name: "Walk outside", target: 3, targetWeeks: 0 },
];

// Compact -/+ stepper, so a per-habit number can be changed on the tile without
// opening the settings drawer.
function Stepper({ label, value, min, max, onChange, suffix = "" }) {
  const step = (delta) => (e) => {
    e.stopPropagation();
    onChange(Math.min(max, Math.max(min, value + delta)));
  };
  const btn = {
    width: 20,
    height: 20,
    borderRadius: 6,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    background: "var(--panel2)",
    border: "1px solid var(--line)",
    color: "var(--fg)",
    padding: 0,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--dim)" }}>{label}</span>
      <button type="button" aria-label={`Decrease ${label}`} onClick={step(-1)} style={btn}>
        <LuMinus size={11} />
      </button>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12,
          minWidth: 28,
          textAlign: "center",
          color: "var(--fg)",
        }}
      >
        {value === 0 && suffix ? "none" : `${value}${suffix}`}
      </span>
      <button type="button" aria-label={`Increase ${label}`} onClick={step(1)} style={btn}>
        <LuPlus size={11} />
      </button>
    </div>
  );
}

function Habits({ id, options, config, setConfig, size }) {
  // Names and per-habit targets are settings (small, worth syncing); tick
  // history is content that grows, so it lives in the local bucket.
  const [history, setHistory] = useWidgetLocal(id, "history", {});
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(null);

  const habits =
    Array.isArray(config.habits) && config.habits.length ? config.habits : DEFAULTS;
  // Only the week boundary is shared; target and goal belong to each habit.
  const startIndex = weekStartIndex(options.weekStart);
  const wide = (size?.[0] ?? 4) >= 4;
  const dot = wide ? 15 : 13;

  const toggle = (habitId, date) =>
    setHistory((prev) => ({
      ...prev,
      [habitId]: toggleDay(prev?.[habitId], date),
    }));

  const patch = (habitId, changes) =>
    setConfig({
      habits: habits.map((h) => (h.id === habitId ? { ...h, ...changes } : h)),
    });

  const add = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = draft.trim();
    if (!name) return;
    setConfig({ habits: [...habits, { id: uid(), name, target: 5, targetWeeks: 0 }] });
    setDraft("");
    setAdding(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
        overflow: "auto",
      }}
    >
      {habits.map((habit) => {
        const target = Number(habit.target) || 5;
        const targetWeeks = Number(habit.targetWeeks) || 0;
        const done = history?.[habit.id] || {};
        const p = habitProgress(done, { startIndex, target, targetWeeks });
        const open = editing === habit.id;

        return (
          <div key={habit.id} style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                // Centred, so the squares sit level with a title however many
                // lines it wraps onto.
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(open ? null : habit.id);
                  }}
                  title="Target and goal"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    border: 0,
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    color: p.metThisWeek ? "var(--fg)" : "var(--dim)",
                    fontSize: 14,
                    lineHeight: 1.3,
                    width: "100%",
                  }}
                >
                  {/* Wraps instead of being truncated, however long the name. */}
                  <span
                    className="db-selectable"
                    style={{ overflowWrap: "anywhere", minWidth: 0 }}
                  >
                    {habit.name}
                  </span>
                  <LuSettings2
                    size={11}
                    style={{ flex: "none", marginTop: 4, opacity: open ? 1 : 0.4 }}
                  />
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "var(--faint)",
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: p.metThisWeek ? "var(--ok)" : "var(--faint)" }}>
                    {p.count}/{p.target} this week
                  </span>
                  {options.showStreaks && p.weeksDone > 0 ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        color: p.goalReached ? "var(--ok)" : "var(--faint)",
                      }}
                    >
                      {p.goalReached ? <LuCheck size={10} /> : null}
                      {targetWeeks > 0
                        ? `${p.weeksDone}/${targetWeeks} weeks`
                        : `${p.weeksDone} week${p.weeksDone === 1 ? "" : "s"}`}
                    </span>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flex: "none",
                  alignSelf: "center",
                }}
              >
                {p.days.map((date) => {
                  const isToday = date === p.today;
                  const ticked = !!done[date];
                  return (
                    <button
                      key={date}
                      type="button"
                      aria-label={`${habit.name} on ${date}`}
                      aria-pressed={ticked}
                      title={isToday ? "Today" : date}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(habit.id, date);
                      }}
                      style={{
                        width: dot,
                        height: dot,
                        borderRadius: 5,
                        padding: 0,
                        cursor: "pointer",
                        background: ticked ? "var(--accent)" : "var(--line)",
                        border: isToday
                          ? "1.5px solid var(--accentLine)"
                          : "1.5px solid transparent",
                        transition: "background .18s ease, border-color .18s ease",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {open ? (
              <div
                className="db-reveal"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 9,
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <Stepper
                  label="per week"
                  value={target}
                  min={1}
                  max={7}
                  onChange={(v) => patch(habit.id, { target: v })}
                />
                <Stepper
                  label="goal"
                  value={targetWeeks}
                  min={0}
                  max={52}
                  suffix="w"
                  onChange={(v) => patch(habit.id, { targetWeeks: v })}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setConfig({ habits: habits.filter((h) => h.id !== habit.id) });
                  }}
                  aria-label={`Remove ${habit.name}`}
                  title={`Remove ${habit.name}`}
                  style={{
                    marginLeft: "auto",
                    display: "grid",
                    placeItems: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    cursor: "pointer",
                    background: "transparent",
                    border: "1px solid var(--line)",
                    color: "var(--danger)",
                  }}
                >
                  <LuTrash2 size={12} />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      {adding ? (
        <form onSubmit={add} onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => !draft && setAdding(false)}
            placeholder="Habit name"
            aria-label="Habit name"
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: 8,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 13,
              color: "var(--fg)",
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAdding(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: 0,
            background: "transparent",
            color: "var(--faint)",
            fontSize: 13,
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          <LuPlus size={13} /> Add habit
        </button>
      )}
    </div>
  );
}

export default Habits;
