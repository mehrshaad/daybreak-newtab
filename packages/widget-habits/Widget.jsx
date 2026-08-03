import { useState } from "react";
import { LuCheck, LuPlus } from "react-icons/lu";
import { MONO, uid, useWidgetLocal } from "@daybreak/sdk";
import { toggleDay } from "./streak";
import { habitProgress, weekStartIndex } from "./weeks";

const DEFAULTS = [
  { id: "h1", name: "Read 20 pages" },
  { id: "h2", name: "Walk outside" },
];

function Habits({ id, options, config, setConfig, size }) {
  // Names are settings (small, worth syncing); tick history is content that
  // grows, so it lives in the local bucket.
  const [history, setHistory] = useWidgetLocal(id, "history", {});
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const habits =
    Array.isArray(config.habits) && config.habits.length ? config.habits : DEFAULTS;
  const startIndex = weekStartIndex(options.weekStart);
  const target = Number(options.target) || 5;
  const targetWeeks = Number(options.targetWeeks) || 0;
  const wide = (size?.[0] ?? 3) >= 4;

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
        gap: 9,
        flex: 1,
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      {habits.map((habit) => {
        const done = history?.[habit.id] || {};
        const p = habitProgress(done, { startIndex, target, targetWeeks });
        return (
          <div key={habit.id} style={{ minWidth: 0 }}>
            <div
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
                  color: p.metThisWeek ? "var(--fg)" : "var(--dim)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {habit.name}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "none" }}>
                {/* This week's dots, aligned to the chosen week start rather
                    than a rolling window, since the target is weekly. */}
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
                        width: wide ? 13 : 11,
                        height: wide ? 13 : 11,
                        borderRadius: 4,
                        padding: 0,
                        cursor: "pointer",
                        background: ticked ? "var(--accent)" : "var(--line)",
                        border: isToday
                          ? "1px solid var(--accentLine)"
                          : "1px solid transparent",
                        transition: "background .15s",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontFamily: MONO,
                fontSize: 9,
                color: "var(--faint)",
                marginTop: 3,
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
                  {p.goalReached ? <LuCheck size={9} /> : null}
                  {targetWeeks > 0
                    ? `${p.weeksDone}/${targetWeeks} weeks`
                    : `${p.weeksDone} week${p.weeksDone === 1 ? "" : "s"}`}
                </span>
              ) : null}
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
