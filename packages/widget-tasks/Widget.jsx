import { useRef, useState } from "react";
import { LuGripVertical, LuPlus } from "react-icons/lu";
import {
  Appear,
  animateExit,
  EditableText,
  formatDate,
  MONO,
  uid,
  useFlip,
  usePointerReorder,
} from "@daybreak/sdk";
import DatePicker from "./DatePicker";
import { reorderVisible } from "./reorder";

const isOverdue = (due) => !!due && due < formatDate(new Date());

function Task({ task, showDates, editing, held, onToggle, onRemove, onEdit, onPointerDown, rowRef }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={rowRef}
      data-flip-id={task.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // A second line of defense, matching every other reorderable list: the
      // board's own tile drag starts from a handle now, so a row press can no
      // longer reach it either way.
      onPointerDown={(e) => {
        if (!editing) return;
        e.stopPropagation();
        onPointerDown(e, task.id);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "5px 8px",
        margin: "0 -8px",
        borderRadius: 8,
        background: hovered ? "var(--panel2)" : "transparent",
        touchAction: "none",
        cursor: editing ? (held ? "grabbing" : "grab") : "default",
        zIndex: held ? 5 : undefined,
        filter: held ? "drop-shadow(0 12px 22px rgba(0,0,0,.4))" : "none",
        transition: "background .15s ease",
      }}
    >
      <Appear open={editing} style={{ display: "flex", flex: "none" }}>
        <LuGripVertical size={12} style={{ color: "var(--faint)" }} aria-hidden="true" />
      </Appear>
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditableText
          value={task.text}
          onCommit={onEdit}
          ariaLabel={`Edit "${task.text}"`}
          style={{
            display: "block",
            fontSize: 13,
            color: task.done ? "var(--faint)" : "var(--fg)",
            textDecoration: task.done ? "line-through" : "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color .15s ease",
          }}
          inputStyle={{ display: "block", width: "100%", fontSize: 13 }}
        />
      </div>
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
      <Appear open={hovered} style={{ display: "flex", flex: "none" }}>
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
      </Appear>
    </div>
  );
}

function Tasks({ options, config, setConfig, editing }) {
  const { hideCompleted, showDates } = options;
  const items = Array.isArray(config.items) ? config.items : [];
  const [draft, setDraft] = useState("");
  const [due, setDue] = useState("");
  const listRef = useRef(null);
  const rowEls = useRef({});

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
  const visibleIds = visible.map((t) => t.id);
  const doneCount = items.filter((t) => t.done).length;

  const { draggingId, onPointerDown } = usePointerReorder({
    ids: visibleIds,
    onReorder: (from, to) => save(reorderVisible(items, visibleIds, from, to)),
    enabled: editing,
    containerRef: listRef,
  });

  useFlip(listRef, [visibleIds.join("|")], { skipId: draggingId });

  const removeTask = async (id) => {
    await animateExit(rowEls.current[id]);
    save(items.filter((t) => t.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div
        ref={listRef}
        // Lifts the list's stacking while a row is held, so it paints above
        // its neighbours instead of being clipped by the tile.
        data-dragging={draggingId ? "true" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflow: "auto",
          minHeight: 0,
          ...(draggingId ? { position: "relative", zIndex: 6, overflow: "visible" } : null),
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
              editing={editing}
              held={draggingId === task.id}
              rowRef={(el) => {
                rowEls.current[task.id] = el;
              }}
              onPointerDown={onPointerDown}
              onToggle={() =>
                save(items.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))
              }
              onRemove={() => removeTask(task.id)}
              onEdit={(text) =>
                save(items.map((t) => (t.id === task.id ? { ...t, text } : t)))
              }
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
        {showDates ? <DatePicker value={due} onChange={setDue} /> : null}
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: MONO,
          fontSize: 11,
          color: "var(--faint)",
          paddingTop: 8,
        }}
      >
        <span>
          {doneCount} of {items.length} done
        </span>
        {doneCount > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              save(items.filter((t) => !t.done));
            }}
            style={{
              border: 0,
              background: "transparent",
              color: "var(--faint)",
              cursor: "pointer",
              fontFamily: MONO,
              fontSize: 11,
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Clear done
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default Tasks;
