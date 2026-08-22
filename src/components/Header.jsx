import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuLayoutGrid, LuMonitor, LuMoon, LuPlus, LuSettings, LuSun, LuX } from "react-icons/lu";
import { useNotices } from "../core/noticeContext";
import { useSettings } from "../core/settingsContext";
import {
  Appear,
  EngineMark,
  HOVER_LIFT,
  MONO,
  roundControl,
  SEARCH_ENGINES,
  softButton,
  Tooltip,
  useTooltip,
} from "@daybreak/sdk";
import { barTier, searchWidth } from "../core/barLayout";
import { gatherSuggestions } from "../core/suggest";
import { nextTheme, THEME_LABELS } from "../core/themeCycle";
import { useViewportWidth } from "../core/useColumns";
import SearchSuggestions from "./SearchSuggestions";
import { Button } from "./primitives";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

function EnginePicker({ engine, onPick }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const tip = useTooltip(open ? null : `Search with ${SEARCH_ENGINES[engine].label}`);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  // Opening moves focus into the menu, onto whichever engine is in use. That is
  // what makes the arrow keys below work at all: this is a roving-focus menu,
  // so the browser's own focus is the highlight, and nothing needs to track a
  // separate index that could disagree with it.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[aria-checked="true"]')?.focus();
  }, [open]);

  const close = (returnFocus) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  // Menus are expected to work from the keyboard, and this one did not: it
  // opened, and then the only way out was a click somewhere else. Escape had no
  // effect and the engines could not be reached at all.
  const onMenuKeyDown = (e) => {
    const items = [...(menuRef.current?.querySelectorAll("[role=menuitemradio]") || [])];
    const at = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.stopPropagation();
      close(true);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      // Wraps, so holding one direction reaches everything without having to
      // know which end you started from.
      items[(at + step + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      (e.key === "Home" ? items[0] : items[items.length - 1])?.focus();
    } else if (e.key === "Tab") {
      // Tabbing out of an open menu closes it rather than leaving it hanging
      // over the board with focus somewhere else entirely.
      close(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", flex: "none" }}>
      <button
        ref={(el) => {
          buttonRef.current = el;
          tip.anchorRef.current = el;
        }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        // Down-arrow opens a collapsed menu, which is what the pattern leads a
        // keyboard user to try first.
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
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
        <EngineMark engine={engine} size={15} />
      </button>
      <Tooltip {...tip} />
      {open ? (
        <div
          role="menu"
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
          aria-label="Search engine"
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
              tabIndex={-1}
              onClick={() => {
                onPick(key);
                close(true);
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
              <EngineMark engine={key} size={14} />
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
  onContextMenu,
  searchRef,
}) {
  const { settings, update } = useSettings();
  const { notify } = useNotices();
  const engine = SEARCH_ENGINES[settings.behavior.searchEngine]
    ? settings.behavior.searchEngine
    : "google";
  // The theme *setting*, not the resolved theme the rest of the app renders
  // with. The button used to take the resolved one, which cannot tell "dark"
  // apart from "system, at night" — and that is exactly how it managed to write
  // an explicit theme over a board that had been following the system.
  const themeSetting = settings.appearance.theme || "system";
  const [now, setNow] = useState(() => new Date());
  const width = useViewportWidth();
  const tier = barTier(width);
  const nextThemeValue = nextTheme(themeSetting);
  const themeTip = useTooltip(`Switch to ${THEME_LABELS[nextThemeValue]}`);
  const settingsTip = useTooltip("Settings");
  const editTip = useTooltip(tier.labels ? null : editing ? "Done editing" : "Edit layout");
  const storeTip = useTooltip(tier.labels ? null : "Add a widget");

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
        // Three columns rather than a row with a spacer at each end. The search
        // field was centred by giving both end groups the same hardcoded
        // 190px, which meant every change to either end moved the field: the
        // Edit button carried a minWidth purely so its label swapping between
        // "Edit layout" and "Editing" would not slide the search sideways. A
        // middle column that is its own width is centred because the two
        // outside columns are equal by definition, whatever is in them.
        //
        // minmax(0, 1fr) and not 1fr: a plain fr floors at min-content, so a
        // long enough label on either end would still shove the field off
        // centre instead of being clipped.
        display: "grid",
        gridTemplateColumns: `minmax(0, 1fr) minmax(0, ${searchWidth(width, {
          active: searchActive,
          scrolled,
        })}px) minmax(0, 1fr)`,
        alignItems: "center",
        gap: "20px",
        padding: scrolled ? "10px 28px" : "20px 28px",
        background: scrolled ? "var(--sheet)" : "transparent",
        borderBottom: `1px solid ${scrolled ? "var(--line)" : "transparent"}`,
        backdropFilter: scrolled ? "var(--blur-panel)" : "none",
        transition:
          "grid-template-columns .28s cubic-bezier(.2,.8,.2,1), padding .25s ease, " +
          "background .25s ease, border-color .25s ease",
      }}
    >
      {/* Both end groups are their own column now, so neither needs a width:
          they take what they take and the field stays put regardless. */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", minWidth: 0 }}>
        <Appear open={tier.wordmark} style={{ display: "flex" }}>
          <span
            style={{
              fontFamily: MONO,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--accentText)",
              fontSize: scrolled ? "10px" : "12px",
              transition: "font-size .25s ease",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Daybreak
          </span>
        </Appear>
        <Appear open={tier.clock} style={{ display: "flex" }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "11px",
              color: "var(--faint)",
              whiteSpace: "nowrap",
            }}
          >
            {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
        </Appear>
      </div>

      <div style={{ display: "flex", justifyContent: "center", minWidth: 0 }}>
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
            // The column is the width now (see the grid above), so the field
            // fills it. Widening on focus happens by the column widening, which
            // means the two sides give up the room rather than the field
            // stealing it and pushing a control off the edge.
            width: "100%",
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
              "background .2s ease, border-color .2s ease, box-shadow .2s ease, padding .25s ease",
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
          minWidth: 0,
          justifyContent: "flex-end",
        }}
      >
        {/* Below the widest tier these two lose their labels and keep their
            place, which is the trade the search field needs: about 150px back,
            for two buttons a person learns once and then finds by position.
            The tooltip carries the name that the label used to. */}
        <span ref={editTip.anchorRef} style={{ display: "inline-flex" }} {...editTip.anchorProps}>
          <Button
            onClick={onToggleEdit}
            aria-pressed={editing}
            aria-label={editing ? "Done editing" : "Edit layout"}
            style={{
              padding: tier.labels ? "9px 14px" : 0,
              width: tier.labels ? undefined : 36,
              height: tier.labels ? undefined : 36,
              display: tier.labels ? undefined : "grid",
              placeItems: tier.labels ? undefined : "center",
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
            {/* Keyed so the label crossfades on toggle instead of swapping
                between frames. */}
            <span
              key={`${editing ? "on" : "off"}-${tier.labels ? "text" : "icon"}`}
              style={{
                animation: "db-fade .2s ease both",
                display: tier.labels ? undefined : "grid",
                placeItems: tier.labels ? undefined : "center",
                whiteSpace: "nowrap",
              }}
            >
              {tier.labels ? (editing ? "Editing" : "Edit layout") : <LuLayoutGrid size={15} />}
            </span>
          </Button>
        </span>
        <Tooltip {...editTip} />

        <span ref={storeTip.anchorRef} style={{ display: "inline-flex" }} {...storeTip.anchorProps}>
          <Button
            onClick={onOpenStore}
            aria-label="Add a widget"
            styleFor={tier.labels ? softButton : roundControl}
            hover={HOVER_LIFT}
          >
            <span
              key={tier.labels ? "text" : "icon"}
              style={{ animation: "db-fade .2s ease both", whiteSpace: "nowrap" }}
            >
              {tier.labels ? "Store" : <LuPlus size={16} />}
            </span>
          </Button>
        </span>
        <Tooltip {...storeTip} />

        {/* Button doesn't forward a ref (and can't take onMouseEnter as a
            prop without clobbering its own internal hover tracking), so the
            tooltip anchors to a plain wrapper instead. */}
        <span ref={themeTip.anchorRef} style={{ display: "inline-flex" }} {...themeTip.anchorProps}>
          <Button
            onClick={() => update("appearance", { theme: nextThemeValue })}
            aria-label={`Theme: ${THEME_LABELS[themeSetting]}. Switch to ${THEME_LABELS[nextThemeValue]}`}
            styleFor={roundControl}
            hover={HOVER_LIFT}
          >
            {/* Shows the setting, not what it resolved to, so a board following
                the system says so instead of showing a moon that looks like a
                choice somebody made. */}
            <span
              key={themeSetting}
              style={{ display: "grid", placeItems: "center", animation: "db-menu .22s ease both" }}
            >
              {themeSetting === "system" ? (
                <LuMonitor size={15} />
              ) : themeSetting === "light" ? (
                <LuSun size={15} />
              ) : (
                <LuMoon size={15} />
              )}
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
