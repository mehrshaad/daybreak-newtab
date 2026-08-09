import { useEffect, useRef, useState } from "react";
import { useTooltip } from "../useTooltip";
import Tooltip from "./Tooltip";

// Double-click to edit in place — a task's own words, a habit's name, a
// world clock's city label. Plain text on the page is unselectable by
// default (see base.scss); this is the one deliberate way in, and only while
// actually editing.
function EditableText({
  value,
  onCommit,
  placeholder = "",
  ariaLabel,
  style,
  inputStyle,
  tooltip = "Double-click to edit",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const tip = useTooltip(tooltip);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        style={{
          font: "inherit",
          color: "inherit",
          background: "var(--panel2)",
          border: "1px solid var(--accentLine)",
          borderRadius: 6,
          padding: "0 4px",
          outline: "none",
          minWidth: 0,
          maxWidth: "100%",
          ...inputStyle,
        }}
      />
    );
  }

  return (
    <>
      <span
        ref={tip.anchorRef}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setDraft(value);
          setEditing(true);
        }}
        style={style}
        {...tip.anchorProps}
      >
        {value || <span style={{ color: "var(--faint)" }}>{placeholder}</span>}
      </span>
      <Tooltip {...tip} />
    </>
  );
}

export default EditableText;
