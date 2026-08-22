import { useState } from "react";
import { LuCalendarDays, LuMinus, LuX } from "react-icons/lu";
import { DatePicker, EditableText, MONO, Tooltip, toggleStyles, uid, useTooltip } from "@daybreak/sdk";
import { formatRemaining, nextOccurrence } from "./countdown";

// Six and a blank, down from twelve. A swatch row is something you take in at a
// glance; past half a dozen it stops being a row and turns back into a sticker
// sheet, which is what this panel looked like. These are the things people
// actually count toward, and the name beside them already says the rest.
const EMOJI = ["", "🎂", "✈️", "🚀", "🎓", "🎄", "🏁"];

// The app's own text field, verbatim, so a widget panel's inputs are the same
// object as the ones in Settings.
const FIELD = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 10,
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  outline: "none",
  fontSize: 13,
  color: "var(--fg)",
};

// The app's Toggle, rebuilt here because primitives live in the host app and a
// widget package cannot import them. The switch itself is the shared
// toggleStyles factory, so the only thing copied is the row around it.
function ToggleRow({ label, on, onChange }) {
  const t = toggleStyles(on);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        width: "100%",
        background: "transparent",
        border: 0,
        textAlign: "left",
        transition: "background .18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--panel)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 13, color: "var(--fg)" }}>{label}</span>
      <span style={t.track}>
        <span style={t.knob} />
      </span>
    </button>
  );
}

// Marked the way an accent is marked in Settings: a ring held off the swatch by
// the sheet colour, rather than a border that would make every option look
// like a button. Unpicked ones sit back at reduced opacity so the row reads as
// one chosen mark and six alternatives, not seven equal controls.
function EmojiSwatch({ emoji, selected, onPick }) {
  return (
    <button
      type="button"
      aria-label={emoji ? `Mark with ${emoji}` : "No mark"}
      aria-pressed={selected}
      onClick={onPick}
      style={{
        width: 26,
        height: 26,
        display: "grid",
        placeItems: "center",
        padding: 0,
        border: 0,
        borderRadius: 999,
        flex: "none",
        cursor: "pointer",
        background: "var(--panel2)",
        color: "var(--faint)",
        fontSize: 13,
        lineHeight: 1,
        opacity: selected ? 1 : 0.6,
        boxShadow: selected ? "0 0 0 2px var(--sheet), 0 0 0 4px var(--accent)" : "none",
        transition: "opacity .15s ease, background .15s ease, box-shadow .18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = 1;
        e.currentTarget.style.background = "var(--panel)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = selected ? 1 : 0.6;
        e.currentTarget.style.background = "var(--panel2)";
      }}
    >
      {emoji || <LuMinus size={11} aria-hidden="true" />}
    </button>
  );
}

// Its own component so each entry's remove-button tooltip gets its own hover
// state, independent of the others.
function EntryRow({ entry, onPatch, onRemove }) {
  const label = entry.title || "this date";
  const removeTip = useTooltip(`Remove ${label}`);
  const occurrence = nextOccurrence(entry);
  const emoji = entry.emoji || "";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 8px",
          borderRadius: 8,
          transition: "background .15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--sheetHover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* The row's own identity tile, in the shape IconTile uses elsewhere:
            the chosen mark if there is one, the widget's own glyph if not. */}
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            flex: "none",
            display: "grid",
            placeItems: "center",
            background: "var(--panel2)",
            color: "var(--faint)",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          {emoji || <LuCalendarDays size={12} />}
        </span>

        <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--fg)" }}>
          <EditableText
            value={entry.title}
            onCommit={(title) => onPatch({ title })}
            placeholder="Untitled"
            ariaLabel="Countdown name"
            inputStyle={{ display: "block", width: "100%", fontSize: 13 }}
          />
        </div>

        <button
          ref={removeTip.anchorRef}
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          style={{
            display: "grid",
            placeItems: "center",
            width: 24,
            height: 24,
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
          <LuX size={13} />
        </button>
        <Tooltip {...removeTip} />
      </div>

      {/* Hung off the row rather than boxed with it — the same rule the drawer
          uses for anything that belongs to the setting above it. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginLeft: 18,
          marginTop: 2,
          paddingLeft: 12,
          borderLeft: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <DatePicker
          value={entry.date || ""}
          onChange={(date) => onPatch({ date })}
          placeholder="Pick a date"
        />
{occurrence ? (
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: "var(--faint)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
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
            <div style={{ fontSize: 11, color: "var(--danger)" }}>Pick a date for this one.</div>
          )}
        </div>

        <ToggleRow
          label="Every year"
          on={!!entry.yearly}
          onChange={() => onPatch({ yearly: !entry.yearly })}
        />

        <div
          role="group"
          aria-label={`Mark for ${label}`}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 2px 2px" }}
        >
          {EMOJI.map((choice) => (
            <EmojiSwatch
              key={choice || "none"}
              emoji={choice}
              selected={emoji === choice}
              onPick={() => onPatch({ emoji: choice })}
            />
          ))}
        </div>
      </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {entries.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

      <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What are you counting toward?"
          aria-label="New countdown name"
          style={FIELD}
        />
        <button
          type="submit"
          style={{
            alignSelf: "flex-start",
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 12,
            cursor: "pointer",
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            color: "var(--fg)",
            transition: "background .15s ease, border-color .15s ease",
          }}
        >
          Add date
        </button>
      </form>
    </div>
  );
}

export default CountdownSettings;
