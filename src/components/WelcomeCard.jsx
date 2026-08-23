import { useEffect, useRef, useState } from "react";
import { LuLayoutGrid, LuMousePointerClick, LuStore } from "react-icons/lu";
import { hasPermissionsApi, requestAllPermissions, usePresence } from "@daybreak/sdk";
import { Pill } from "./primitives";

// Requested together so the results (open tabs, bookmarks, history) come with
// real site icons rather than a generic placeholder.
const SEARCH_PERMISSIONS = ["tabs", "bookmarks", "history", "favicon"];

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

// Blur is the single most expensive thing the page draws: every tile, panel,
// sheet and menu is its own blurred surface, and on a modest machine that is
// the difference between a new tab that appears and one that fades in. It is
// the better-looking setting and not the better default, so it is asked rather
// than assumed — and asked in the language of the trade being made rather than
// as "backdrop-filter", which means nothing to anyone.
const FEELS = [
  ["performance", "Performance", "Solid panels. Opens instantly."],
  ["quality", "Quality", "Frosted glass. A little heavier."],
];

// One card, shown once on the first tab. No chrome.identity — that only
// returns an email, not a display name, so the name is just asked for here
// instead of guessed at the cost of a permission.
function WelcomeCard({
  open,
  name,
  theme,
  blur,
  onNameChange,
  onThemeChange,
  onBlurChange,
  onEnableSearch,
  onDismiss,
}) {
  const [present, closing] = usePresence(open, EXIT_MS);
  const inputRef = useRef(null);
  // idle: not yet asked (or dev has nothing to ask for) | granted | denied.
  const [searchState, setSearchState] = useState(hasPermissionsApi() ? "idle" : "denied");

  const enableSearch = async () => {
    const granted = await requestAllPermissions(SEARCH_PERMISSIONS);
    if (granted) {
      onEnableSearch();
      setSearchState("granted");
    } else {
      setSearchState("denied");
    }
  };

  useEffect(() => {
    if (present) inputRef.current?.focus();
  }, [present]);

  useEffect(() => {
    if (!present) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        // A keystroke is not a request for a guided tour.
        onDismiss({ tour: false });
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
          <span style={{ fontSize: 12, color: "var(--dim)" }}>Look</span>
          <div style={{ display: "flex", gap: 6 }}>
            {FEELS.map(([value, label, hint]) => (
              <Pill
                key={value}
                active={(blur ? "quality" : "performance") === value}
                onClick={() => onBlurChange(value === "quality")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  lineHeight: 1.3,
                }}
              >
                {label}
                <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 400 }}>{hint}</span>
              </Pill>
            ))}
          </div>
        </div>

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

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>Smarter search</span>
          {searchState === "idle" ? (
            <>
              <Pill
                onClick={enableSearch}
                style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 13 }}
              >
                Enable smarter search
              </Pill>
              <span style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>
                Adds your open tabs, bookmarks and history to search suggestions.
              </span>
            </>
          ) : searchState === "granted" ? (
            <span style={{ fontSize: 12, color: "var(--ok)" }}>Smarter search enabled.</span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>
              You can turn this on any time from Settings.
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map(({ Icon, text }) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon size={16} style={{ flex: "none", marginTop: 2, color: "var(--accent)" }} />
              <span style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Two ways out, and the tour is the recommended one — the three lines
            above are a summary of a page nobody has seen yet, and reading about
            a right-click menu is not the same as being shown where it is. */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onDismiss({ tour: true })}
            style={{
              flex: 1,
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
            Show me around
          </button>
          <button
            type="button"
            onClick={() => onDismiss({ tour: false })}
            style={{
              padding: "11px 16px",
              borderRadius: 12,
              background: "transparent",
              border: "1px solid var(--line)",
              color: "var(--dim)",
              fontSize: 14,
              cursor: "pointer",
              flex: "none",
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeCard;
