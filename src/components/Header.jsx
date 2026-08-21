import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuMoon, LuSettings, LuSun, LuX } from "react-icons/lu";
import { useNotices } from "../core/noticeContext";
import { useSettings } from "../core/settingsContext";
import {
  HOVER_LIFT,
  IconTile,
  MONO,
  roundControl,
  SEARCH_ENGINES,
  softButton,
  Tooltip,
  useTooltip,
} from "@daybreak/sdk";
import { gatherSuggestions } from "../core/suggest";
import SearchSuggestions from "./SearchSuggestions";
import { Button } from "./primitives";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

function EnginePicker({ engine, onPick }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const tip = useTooltip(`Search with ${SEARCH_ENGINES[engine].label}`);

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
        ref={tip.anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        {...tip.anchorProps}
      >
        <IconTile name={engine} size={15} bare />
      </button>
      <Tooltip {...tip} />
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
            backdropFilter: "var(--blur-panel)",
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
  onContextMenu,
  searchRef,
}) {
  const { settings, update } = useSettings();
  const { notify } = useNotices();
  const engine = SEARCH_ENGINES[settings.behavior.searchEngine]
    ? settings.behavior.searchEngine
    : "google";
  // `theme` arrives already resolved, so "system" cannot be mistaken for dark.
  const dark = theme !== "light";
  const [now, setNow] = useState(() => new Date());
  const themeTip = useTooltip(dark ? "Switch to light" : "Switch to dark");
  const settingsTip = useTooltip("Settings");

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
  const formRef = useRef(null);

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
      // An answer has nowhere to navigate to, so taking it copies it. That is
      // the only thing anyone wants from a calculator result, and the click is
      // the user gesture the clipboard API requires.
      if (item.kind === "answer") {
        navigator.clipboard?.writeText(item.title).then(
          () => notify({ message: `Copied ${item.title}` }),
          () => notify({ message: "Could not copy that", category: "error" })
        );
        return;
      }
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
    [go, notify]
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
      onContextMenu={onContextMenu}
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
        backdropFilter: scrolled ? "var(--blur-panel)" : "none",
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
            color: "var(--accentText)",
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
          ref={formRef}
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
            background:
              searchActive || searchHover || scrolled ? "var(--panel2)" : "var(--panel)",
            // Frosted when blur is on, so the field reads as glass over the
            // board rather than a flat strip.
            backdropFilter: "var(--blur-tile)",
            WebkitBackdropFilter: "var(--blur-tile)",
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
          {query ? (
            // Replaces the browser's own search-cancel glyph (a fixed grey
            // circle that ignores the theme) with one that matches it.
            <button
              type="button"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              style={{
                display: "grid",
                placeItems: "center",
                width: 20,
                height: 20,
                padding: 0,
                border: 0,
                borderRadius: "999px",
                background: "transparent",
                color: "var(--faint)",
                cursor: "pointer",
                flex: "none",
              }}
            >
              <LuX size={13} />
            </button>
          ) : (
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
          )}

          {searchActive ? (
            <SearchSuggestions
              items={items}
              activeIndex={active}
              anchorRef={formRef}
              onPick={pick}
              onHover={setActive}
              onClose={() => {
                setItems([]);
                setActive(-1);
              }}
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
            // Wide enough for the longer of the two labels. Without this the
            // button shrinks on toggle, the header's right-hand group narrows
            // and the whole search bar slides sideways.
            minWidth: "104px",
            border: editing ? "0" : "1px solid var(--line)",
            background: editing ? "var(--accent)" : "var(--panel)",
            color: editing ? "var(--onAccent)" : "var(--fg)",
            fontWeight: editing ? 500 : 400,
          }}
          hover={editing ? { opacity: 0.9, transform: "translateY(-1px)" } : HOVER_LIFT}
        >
          {/* Keyed so the label crossfades on toggle instead of swapping
              between frames. */}
          <span
            key={editing ? "on" : "off"}
            style={{ animation: "db-fade .2s ease both" }}
          >
            {editing ? "Editing" : "Edit layout"}
          </span>
        </Button>
        <Button
          onClick={onOpenStore}
          styleFor={softButton}
          hover={HOVER_LIFT}
        >
          Store
        </Button>
        {/* Button doesn't forward a ref (and can't take onMouseEnter as a
            prop without clobbering its own internal hover tracking), so the
            tooltip anchors to a plain wrapper instead. */}
        <span ref={themeTip.anchorRef} style={{ display: "inline-flex" }} {...themeTip.anchorProps}>
          <Button
            onClick={() =>
              update("appearance", { theme: dark ? "light" : "dark" })
            }
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            styleFor={roundControl}
            hover={HOVER_LIFT}
          >
            <span
              key={dark ? "dark" : "light"}
              style={{ display: "grid", placeItems: "center", animation: "db-menu .22s ease both" }}
            >
              {dark ? <LuMoon size={15} /> : <LuSun size={15} />}
            </span>
          </Button>
        </span>
        <Tooltip {...themeTip} />
        <span ref={settingsTip.anchorRef} style={{ display: "inline-flex" }} {...settingsTip.anchorProps}>
          <Button
            onClick={onOpenSettings}
            aria-label="Settings"
            styleFor={roundControl}
            hover={HOVER_LIFT}
          >
            <LuSettings size={15} />
          </Button>
        </span>
        <Tooltip {...settingsTip} />
      </div>
    </header>
  );
}

export default Header;
