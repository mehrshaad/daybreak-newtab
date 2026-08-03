import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuMoon, LuSettings, LuSun } from "react-icons/lu";
import { useSettings } from "../core/settingsContext";
import { HOVER_LIFT, MONO, roundControl, softButton } from "../core/styles";
import { gatherSuggestions } from "../core/suggest";
import { SEARCH_ENGINES } from "../utils";
import IconTile from "./IconTile";
import SearchSuggestions from "./SearchSuggestions";
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
  theme,
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
  // `theme` arrives already resolved, so "system" cannot be mistaken for dark.
  const dark = theme !== "light";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);

  const [searchActive, setSearchActive] = useState(false);
  const [searchHover, setSearchHover] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(-1);
  const seq = useRef(0);

  const suggestEnabled = settings.behavior.suggest || { links: true };
  const linkItems = useMemo(() => {
    // Suggestions search whatever Quick Links tiles are configured.
    const out = [];
    for (const [id, rec] of Object.entries(settings.widgets || {})) {
      if (!id.startsWith("links")) continue;
      for (const l of rec?.config?.items || []) out.push(l);
    }
    return out;
  }, [settings.widgets]);

  // Debounced so typing does not hammer chrome.history on every keystroke.
  useEffect(() => {
    if (!searchActive || query.trim().length < 2) {
      setItems([]);
      setActive(-1);
      return undefined;
    }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      const found = await gatherSuggestions({
        query,
        links: linkItems,
        enabled: suggestEnabled,
      });
      // Ignore a slow source that lost the race to a newer query.
      if (mine !== seq.current) return;
      setItems(found);
      setActive(-1);
    }, 140);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchActive, linkItems]);

  const go = useCallback((url) => {
    window.location.href = url;
  }, []);

  const pick = useCallback(
    (item) => {
      if (item.kind === "tabs" && typeof chrome !== "undefined" && chrome.tabs) {
        // Switching to an existing tab, not navigating this one.
        chrome.tabs.update(item.tabId, { active: true });
        if (item.windowId != null && chrome.windows) {
          chrome.windows.update(item.windowId, { focused: true });
        }
        return;
      }
      if (item.url) go(item.url);
    },
    [go]
  );

  const submit = (e) => {
    e.preventDefault();
    // Enter on a highlighted suggestion takes it instead of searching.
    if (active >= 0 && items[active]) {
      pick(items[active]);
      return;
    }
    const q = query.trim();
    if (!q) return;
    go(SEARCH_ENGINES[engine].url + encodeURIComponent(q));
  };

  const onKeyDown = (e) => {
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape" && items.length) {
      // Clear the list first; a second Escape falls through to the app.
      e.stopPropagation();
      setItems([]);
      setActive(-1);
    }
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
          onFocusCapture={() => setSearchActive(true)}
          onBlurCapture={() => setSearchActive(false)}
          onMouseEnter={() => setSearchHover(true)}
          onMouseLeave={() => setSearchHover(false)}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            // Widen a little on focus so typing feels like the field opened up.
            maxWidth: searchActive ? "640px" : scrolled ? "440px" : "560px",
            padding: scrolled ? "7px 15px" : "10px 16px",
            borderRadius: "999px",
            background: searchActive || searchHover ? "var(--panel2)" : scrolled ? "var(--panel2)" : "var(--panel)",
            // Focus is the strongest state, hover a hint of it.
            border: `1px solid ${searchActive ? "var(--accentLine)" : "var(--line)"}`,
            boxShadow: searchActive
              ? "0 6px 22px rgba(0,0,0,.16), 0 0 0 3px var(--accentSoft)"
              : searchHover
              ? "0 3px 12px rgba(0,0,0,.10)"
              : "none",
            transition:
              "max-width .28s cubic-bezier(.2,.8,.2,1), background .2s ease, border-color .2s ease, box-shadow .2s ease, padding .25s ease",
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="db-suggestions"
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

          {searchActive ? (
            <SearchSuggestions
              items={items}
              activeIndex={active}
              onPick={pick}
              onHover={setActive}
            />
          ) : null}
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
          hover={editing ? { opacity: 0.9, transform: "translateY(-1px)" } : HOVER_LIFT}
        >
          {editing ? "Editing" : "Edit layout"}
        </Button>
        <Button
          onClick={onOpenStore}
          styleFor={softButton}
          hover={HOVER_LIFT}
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
          hover={HOVER_LIFT}
        >
          {dark ? <LuMoon size={15} /> : <LuSun size={15} />}
        </Button>
        <Button
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          styleFor={roundControl}
          hover={HOVER_LIFT}
        >
          <LuSettings size={15} />
        </Button>
      </div>
    </header>
  );
}

export default Header;
