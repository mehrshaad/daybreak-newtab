import { useRef, useState } from "react";
import { LuCheck, LuChevronDown, LuPlus } from "react-icons/lu";
import { useHover } from "../useHover";
import MenuRow from "./MenuRow";
import Popover from "./Popover";

// A dropdown in the app's own clothes.
//
// Not a <select>. A native one takes its list from the operating system: the
// popup is drawn by Windows or macOS in the system's own colours, at the
// system's own font size, ignoring the theme entirely — a white list with black
// text over a dark board, and no way to style the options. Every other floating
// surface here is a Popover with MenuRows in it, and this is the one place that
// looked borrowed.
//
// In the SDK rather than in a widget because three widgets need it — Quick
// Links for folders, Bookmarks for folders and for where to add — and a fourth
// copy is how the app ended up with three menus that hovered differently.
//
// `onCreate`, where given, adds a "New…" row at the bottom that turns into a
// text field. Choosing something and inventing something are the same decision
// from the person's side, and making them two controls is what left a folder
// field as a bare text box that could not tell you what already existed.
function Select({
  value,
  options,
  onChange,
  onCreate,
  createLabel = "New…",
  createPlaceholder = "Name",
  placeholder = "None",
  disabled = false,
  width,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const buttonRef = useRef(null);
  const [hovered, bind] = useHover();

  const current = options.find((o) => o.value === value);
  const close = () => {
    setOpen(false);
    setCreating(false);
    setDraft("");
  };

  const commit = () => {
    const name = draft.trim();
    if (!name) {
      close();
      return;
    }
    onCreate?.(name);
    close();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: width ?? "100%",
          boxSizing: "border-box",
          padding: "6px 10px",
          borderRadius: 8,
          // One declaration for the whole border. A `border` here and a
          // `borderColor` in the hover would leave the control with no border
          // at all once React removed the longhand — see
          // src/core/shorthandStyles.test.js.
          border: `1px solid ${open || hovered ? "var(--accentLine)" : "var(--line)"}`,
          background: "var(--panel2)",
          color: current ? "var(--fg)" : "var(--faint)",
          fontSize: 12,
          fontFamily: "inherit",
          textTransform: "none",
          letterSpacing: "normal",
          textAlign: "left",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.55 : 1,
          transition: "border-color .15s ease, background .15s ease",
        }}
        {...bind}
      >
        <span
          style={{
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {current?.label ?? placeholder}
        </span>
        <LuChevronDown
          size={13}
          aria-hidden
          style={{
            flex: "none",
            opacity: 0.7,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .18s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </button>

      <Popover
        open={open}
        anchorRef={buttonRef}
        onClose={close}
        placement="bottom-start"
        width={width}
      >
        <div
          role="listbox"
          style={{ padding: 4, display: "flex", flexDirection: "column", gap: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <MenuRow
              key={String(option.value)}
              role="option"
              aria-selected={option.value === value}
              selected={option.value === value}
              onClick={() => {
                onChange?.(option.value);
                close();
              }}
              style={{ gap: 8 }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {option.label}
              </span>
              {option.value === value ? (
                <LuCheck size={12} aria-hidden style={{ flex: "none", opacity: 0.8 }} />
              ) : null}
            </MenuRow>
          ))}

          {onCreate ? (
            creating ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === "Escape") close();
                }}
                onBlur={commit}
                placeholder={createPlaceholder}
                aria-label={createLabel}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  margin: "2px 0",
                  padding: "6px 9px",
                  borderRadius: 7,
                  border: "1px solid var(--accentLine)",
                  background: "var(--panel2)",
                  color: "var(--fg)",
                  outline: "none",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <MenuRow onClick={() => setCreating(true)} style={{ gap: 8 }}>
                <LuPlus size={12} aria-hidden style={{ flex: "none", opacity: 0.8 }} />
                <span style={{ flex: 1, minWidth: 0 }}>{createLabel}</span>
              </MenuRow>
            )
          ) : null}
        </div>
      </Popover>
    </>
  );
}

export default Select;
