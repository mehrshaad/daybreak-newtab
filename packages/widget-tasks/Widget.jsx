import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { formatDate, MONO, uid } from "@daybreak/sdk";

const isOverdue = (due) => !!due && due < formatDate(new Date());

function Task({ task, showDates, onToggle, onRemove }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "5px 8px",
        margin: "0 -8px",
        borderRadius: 8,
        background: hovered ? "var(--panel2)" : "transparent",
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.text}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: 15,
          height: 15,
          borderRadius: 5,
          flex: "none",
          padding: 0,
          cursor: "pointer",
          border: `1px solid ${task.done ? "var(--accent)" : "var(--line)"}`,
          background: task.done ? "var(--accent)" : "transparent",
          transition: "all .15s",
        }}
      />
      <span
        style={{
          fontSize: 13,
          flex: 1,
          minWidth: 0,
          color: task.done ? "var(--faint)" : "var(--fg)",
          textDecoration: task.done ? "line-through" : "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.text}
      </span>
      {showDates && task.due ? (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            flex: "none",
            color: isOverdue(task.due) && !task.done ? "var(--danger)" : "var(--faint)",
          }}
        >
          {task.due.slice(5)}
        </span>
      ) : null}
      {hovered ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Delete ${task.text}`}
          style={{
            border: 0,
            background: "transparent",
            color: "var(--faint)",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            padding: "0 2px",
            flex: "none",
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function Tasks({ options, config, setConfig, focused }) {
  const { hideCompleted, showDates } = options;
  const items = Array.isArray(config.items) ? config.items : [];
  const [draft, setDraft] = useState("");
  const [due, setDue] = useState("");

  const save = (next) => setConfig({ items: next });

  const add = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = draft.trim();
    if (!text) return;
    save([...items, { id: uid(), text, done: false, due: due || null }]);
    setDraft("");
    setDue("");
  };

  const visible = hideCompleted ? items.filter((t) => !t.done) : items;
  const doneCount = items.filter((t) => t.done).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {visible.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--faint)", padding: "4px 0" }}>
            {items.length ? "All done." : "Nothing yet — add a task below."}
          </div>
        ) : (
          visible.map((task) => (
            <Task
              key={task.id}
              task={task}
              showDates={showDates}
              onToggle={() =>
                save(
                  items.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                )
              }
              onRemove={() => save(items.filter((t) => t.id !== task.id))}
            />
          ))
        )}
      </div>

      <form
        onSubmit={add}
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", gap: 6, alignItems: "center", paddingTop: 8 }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task"
          aria-label="Add a task"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 10px",
            borderRadius: 8,
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            outline: "none",
            fontSize: 12,
            color: "var(--fg)",
          }}
        />
        {focused && showDates ? (
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date"
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 12,
              color: "var(--fg)",
              colorScheme: "dark light",
            }}
          />
        ) : null}
        <button
          type="submit"
          aria-label="Add task"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            flex: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            border: "1px solid var(--line)",
            background: "var(--panel2)",
            color: "var(--fg)",
          }}
        >
          <LuPlus size={13} />
        </button>
      </form>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: "var(--faint)",
          paddingTop: 8,
        }}
      >
        {doneCount} of {items.length} done
      </div>
    </div>
  );
}

export default Tasks;
