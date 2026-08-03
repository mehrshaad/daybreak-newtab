import { useEffect, useRef, useState } from "react";
import { LuMoon, LuSettings, LuSun } from "react-icons/lu";
import { useSettings } from "../core/settingsContext";
import { MONO, roundControl, softButton } from "../core/styles";
import { SEARCH_ENGINES } from "../utils";
import IconTile from "./IconTile";
import { Button } from "./primitives";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

function EnginePicker({ engine, onPick }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", flex: "none" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Search with ${SEARCH_ENGINES[engine].label}`}
        aria-label={`Search engine: ${SEARCH_ENGINES[engine].label}`}
        aria-expanded={open}
        style={{
          display: "grid",
          placeItems: "center",
          width: 20,
          height: 20,
          padding: 0,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          flex: "none",
        }}
      >
        <IconTile name={engine} size={15} bare />
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: "-8px",
            zIndex: 60,
            width: 168,
            padding: "5px 0",
            borderRadius: 12,
            background: "var(--sheet)",
            border: "1px solid var(--line)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 50px rgba(0,0,0,.4)",
            animation: "db-menu .12s ease both",
          }}
        >
          {Object.entries(SEARCH_ENGINES).map(([key, e]) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === engine}
              onClick={() => {
                onPick(key);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 12px",
                border: 0,
                background: key === engine ? "var(--accentSoft)" : "transparent",
                color: key === engine ? "var(--accent)" : "var(--fg)",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <IconTile name={key} size={14} bare />
              {e.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Header({
  scrolled,
  editing,
  onToggleEdit,
  onOpenStore,
  onOpenSettings,
  searchRef,
}) {
  const { settings, update } = useSettings();
  const engine = SEARCH_ENGINES[settings.behavior.searchEngine]
    ? settings.behavior.searchEngine
    : "google";
  const dark = settings.appearance.theme !== "light";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (!q) return;
    window.location.href = SEARCH_ENGINES[engine].url + encodeURIComponent(q);
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: scrolled ? "10px 28px" : "20px 28px",
        background: scrolled ? "var(--sheet)" : "transparent",
        borderBottom: `1px solid ${scrolled ? "var(--line)" : "transparent"}`,
        backdropFilter: scrolled ? "blur(22px)" : "none",
        transition: "padding .25s ease, background .25s ease, border-color .25s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
          minWidth: "190px",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "var(--accent)",
            fontSize: scrolled ? "10px" : "12px",
            transition: "font-size .25s ease",
            fontWeight: 500,
          }}
        >
          Daybreak
        </span>
        <span style={{ fontFamily: MONO, fontSize: "11px", color: "var(--faint)" }}>
          {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <form
          onSubmit={submit}
          role="search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            maxWidth: scrolled ? "440px" : "560px",
            padding: scrolled ? "7px 15px" : "10px 16px",
            borderRadius: "999px",
            background: scrolled ? "var(--panel2)" : "var(--panel)",
            border: "1px solid var(--line)",
            transition: "all .25s ease",
          }}
        >
          <EnginePicker
            engine={engine}
            onPick={(searchEngine) => update("behavior", { searchEngine })}
          />
          <input
            ref={searchRef}
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search the web…"
            aria-label="Search the web"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: 0,
              outline: "none",
              fontSize: "14px",
              color: "var(--fg)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "var(--faint)",
              border: "1px solid var(--line)",
              borderRadius: "5px",
              padding: "2px 6px",
              flex: "none",
            }}
          >
            {isMac() ? "⌘K" : "Ctrl K"}
          </span>
        </form>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "190px",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onToggleEdit}
          aria-pressed={editing}
          style={{
            padding: "9px 14px",
            borderRadius: "999px",
            fontSize: "13px",
            cursor: "pointer",
            border: editing ? "0" : "1px solid var(--line)",
            background: editing ? "var(--accent)" : "var(--panel)",
            color: editing ? "var(--onAccent)" : "var(--fg)",
            fontWeight: editing ? 500 : 400,
          }}
          hover={editing ? { opacity: 0.88 } : { background: "var(--panel2)" }}
        >
          {editing ? "Editing" : "Edit layout"}
        </Button>
        <Button
          onClick={onOpenStore}
          styleFor={softButton}
          hover={{ background: "var(--panel2)" }}
        >
          Store
        </Button>
        <Button
          onClick={() =>
            update("appearance", { theme: dark ? "light" : "dark" })
          }
          title={dark ? "Switch to light" : "Switch to dark"}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          styleFor={roundControl}
          hover={{ background: "var(--panel2)" }}
        >
          {dark ? <LuMoon size={15} /> : <LuSun size={15} />}
        </Button>
        <Button
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          styleFor={roundControl}
          hover={{ background: "var(--panel2)" }}
        >
          <LuSettings size={15} />
        </Button>
      </div>
    </header>
  );
}

export default Header;
