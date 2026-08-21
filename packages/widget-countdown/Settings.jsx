import { useState } from "react";
import { LuGripVertical, LuPlus, LuX } from "react-icons/lu";
import { EditableText, MONO, Tooltip, uid, useTooltip } from "@daybreak/sdk";
import { formatRemaining, nextOccurrence } from "./countdown";

// A short set to pick from rather than a full emoji picker, which is a project
// of its own and not one this widget needs. Covers what people actually count
// toward.
const EMOJI = ["🎂", "✈️", "🚀", "🎓", "💍", "🏖️", "🎄", "📦", "🏁", "⭐", "❤️", ""];

const FIELD = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 8,
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  outline: "none",
  fontSize: 13,
  color: "var(--fg)",
};

function EntryRow({ entry, onPatch, onRemove }) {
  const removeTip = useTooltip(`Remove ${entry.title || "this date"}`);
  const occurrence = nextOccurrence(entry);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
        padding: "10px 11px",
        borderRadius: 10,
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LuGripVertical size={13} style={{ color: "var(--faint)", flex: "none" }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
          <EditableText
            value={entry.title}
            onChange={(title) => onPatch({ title })}
            ariaLabel="Countdown name"
          />
        </div>
        <button
          ref={removeTip.anchorRef}
          type="button"
          aria-label={`Remove ${entry.title || "this date"}`}
          onClick={onRemove}
          style={{
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            padding: 0,
            border: 0,
            borderRadius: 999,
            background: "transparent",
            color: "var(--faint)",
            cursor: "pointer",
            flex: "none",
            transition: "background .15s ease, color .15s ease",
          }}
          onMouseEnter={(e) => {
            removeTip.anchorProps.onMouseEnter?.();
            e.currentTarget.style.background = "var(--sheetHover)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            removeTip.anchorProps.onMouseLeave?.();
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--faint)";
          }}
          onFocus={removeTip.anchorProps.onFocus}
          onBlur={removeTip.anchorProps.onBlur}
        >
          <LuX size={12} />
        </button>
        <Tooltip {...removeTip} />
      </div>

      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="date"
          value={entry.date || ""}
          onChange={(e) => onPatch({ date: e.target.value })}
          aria-label="Date"
          style={{ ...FIELD, width: "auto", flex: "1 1 130px", fontFamily: MONO, fontSize: 12 }}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--dim)",
            cursor: "pointer",
            flex: "none",
          }}
        >
          <input
            type="checkbox"
            checked={!!entry.yearly}
            onChange={(e) => onPatch({ yearly: e.target.checked })}
          />
          Every year
        </label>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {EMOJI.map((emoji) => (
          <button
            key={emoji || "none"}
            type="button"
            aria-label={emoji ? `Use ${emoji}` : "No emoji"}
            aria-pressed={(entry.emoji || "") === emoji}
            onClick={() => onPatch({ emoji })}
            style={{
              width: 26,
              height: 26,
              display: "grid",
              placeItems: "center",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 13,
              background: (entry.emoji || "") === emoji ? "var(--accentSoft)" : "transparent",
              border: `1px solid ${
                (entry.emoji || "") === emoji ? "var(--accentLine)" : "var(--line)"
              }`,
              color: "var(--faint)",
              transition: "background .15s ease, border-color .15s ease",
            }}
          >
            {emoji || "—"}
          </button>
        ))}
      </div>

      {occurrence ? (
        <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
          {formatRemaining(occurrence)}
          {" · "}
          {occurrence.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: "var(--danger)" }}>Pick a date for this one.</div>
      )}
    </div>
  );
}

function CountdownSettings({ config, setConfig }) {
  const entries = Array.isArray(config.entries) ? config.entries : [];
  const [draft, setDraft] = useState("");

  const add = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setConfig({
      entries: [
        ...entries,
        // Dated today rather than left empty: an entry with no date cannot be
        // counted toward, and today is the only guess that is never wrong by
        // more than a day.
        { id: uid(), title, date: new Date().toISOString().slice(0, 10), yearly: false, emoji: "" },
      ],
    });
    setDraft("");
  };

  const patch = (id, changes) =>
    setConfig({
      entries: entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    });

  const remove = (id) => setConfig({ entries: entries.filter((entry) => entry.id !== id) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {entries.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onPatch={(changes) => patch(entry.id, changes)}
              onRemove={() => remove(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5 }}>
          Nothing yet. A deadline, a trip, a birthday — anything with a date.
        </div>
      )}

      <form onSubmit={add} style={{ display: "flex", gap: 7 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What are you counting toward?"
          aria-label="New countdown name"
          style={FIELD}
        />
        <button
          type="submit"
          aria-label="Add countdown"
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            flex: "none",
            borderRadius: 8,
            cursor: "pointer",
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            color: "var(--fg)",
            transition: "background .15s ease, border-color .15s ease",
          }}
        >
          <LuPlus size={14} />
        </button>
      </form>
    </div>
  );
}

export default CountdownSettings;
