import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { MONO } from "../../core/styles";
import { useWidgetLocal } from "../../sdk/bucket";
import { uid } from "../../utils";
import { lastNDays, streakFor, toggleDay } from "./streak";

const DEFAULTS = [
  { id: "h1", name: "Read 20 pages" },
  { id: "h2", name: "Walk outside" },
];

function Habits({ id, options, config, setConfig, focused }) {
  // Names are settings (small, worth syncing); the tick history is content and
  // grows over time, so it lives in the local bucket.
  const [history, setHistory] = useWidgetLocal(id, "history", {});
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const habits = Array.isArray(config.habits) && config.habits.length
    ? config.habits
    : DEFAULTS;
  const days = lastNDays(7);
  const today = days[days.length - 1];

  const toggle = (habitId, date) =>
    setHistory((prev) => ({
      ...prev,
      [habitId]: toggleDay(prev?.[habitId], date),
    }));

  const add = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = draft.trim();
    if (!name) return;
    setConfig({ habits: [...habits, { id: uid(), name }] });
    setDraft("");
    setAdding(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      {habits.map((habit) => {
        const done = history?.[habit.id] || {};
        const streak = streakFor(done);
        return (
          <div
            key={habit.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {habit.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "none" }}>
              {options.showStreaks && streak > 0 ? (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: "var(--faint)",
                    marginRight: 3,
                  }}
                >
                  {streak}d
                </span>
              ) : null}
              {days.map((date) => (
                <button
                  key={date}
                  type="button"
                  aria-label={`${habit.name} on ${date}`}
                  aria-pressed={!!done[date]}
                  title={date === today ? "Today" : date}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(habit.id, date);
                  }}
                  style={{
                    width: focused ? 16 : 11,
                    height: focused ? 16 : 11,
                    borderRadius: 4,
                    padding: 0,
                    cursor: "pointer",
                    background: done[date] ? "var(--accent)" : "var(--line)",
                    // Today gets a ring so the grid reads without a legend.
                    border:
                      date === today
                        ? "1px solid var(--accentLine)"
                        : "1px solid transparent",
                    transition: "background .15s",
                  }}
                />
              ))}
            </div>
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
              padding: "6px 10px",
              borderRadius: 8,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 12,
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
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          <LuPlus size={12} /> Add habit
        </button>
      )}
    </div>
  );
}

export default Habits;
