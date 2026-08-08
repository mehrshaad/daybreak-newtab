import { useEffect, useRef } from "react";
import { LuLayoutGrid, LuMousePointerClick, LuStore } from "react-icons/lu";
import { usePresence } from "@daybreak/sdk";
import { Pill } from "./primitives";

const EXIT_MS = 220;

const STEPS = [
  { Icon: LuMousePointerClick, text: "Right-click a tile for its menu — resize, refresh, or remove it." },
  { Icon: LuLayoutGrid, text: '"Edit layout" lets you drag tiles anywhere or start from a preset.' },
  { Icon: LuStore, text: '"Store" is where you browse and add widgets.' },
];

const THEMES = [
  ["system", "System"],
  ["dark", "Dark"],
  ["light", "Light"],
];

// One card, shown once on the first tab. No chrome.identity — that only
// returns an email, not a display name, so the name is just asked for here
// instead of guessed at the cost of a permission.
function WelcomeCard({ open, name, theme, onNameChange, onThemeChange, onDismiss }) {
  const [present, closing] = usePresence(open, EXIT_MS);
  const inputRef = useRef(null);

  useEffect(() => {
    if (present) inputRef.current?.focus();
  }, [present]);

  useEffect(() => {
    if (!present) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [present, onDismiss]);

  if (!present) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "var(--storeScrim)",
        backdropFilter: "var(--blur-overlay)",
        WebkitBackdropFilter: "var(--blur-overlay)",
        animation: closing
          ? `db-store-out ${EXIT_MS}ms ease both`
          : "db-store-in .3s cubic-bezier(.2,.8,.2,1) both",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Daybreak"
    >
      <div
        style={{
          width: "min(420px, 100%)",
          padding: 28,
          borderRadius: 20,
          background: "var(--sheet)",
          border: "1px solid var(--line)",
          boxShadow: "0 30px 80px rgba(0,0,0,.4)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.02em" }}>
            Welcome to Daybreak
          </div>
          <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 4 }}>
            A few things before you start.
          </div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>What should we call you?</span>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 14,
              color: "var(--fg)",
            }}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>Theme</span>
          <div style={{ display: "flex", gap: 6 }}>
            {THEMES.map(([value, label]) => (
              <Pill
                key={value}
                active={theme === value}
                onClick={() => onThemeChange(value)}
                style={{ flex: 1, textAlign: "center", padding: 10 }}
              >
                {label}
              </Pill>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map(({ Icon, text }) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon size={16} style={{ flex: "none", marginTop: 2, color: "var(--accent)" }} />
              <span style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          style={{
            padding: "11px 16px",
            borderRadius: 12,
            border: 0,
            background: "var(--accent)",
            color: "var(--onAccent)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Get started
        </button>
      </div>
    </div>
  );
}

export default WelcomeCard;
