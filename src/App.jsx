import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import { useSettings } from "./core/settingsContext";
import { background, baseColor, tokens } from "./core/tokens";
import { useKeyboard, useScrolled } from "./core/useKeyboard";

function App() {
  const { settings } = useSettings();
  const { theme, accent, wall } = settings.appearance;
  const { showGreeting, shortcuts } = settings.behavior;

  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const searchRef = useRef(null);
  const scrolled = useScrolled();

  const closeOverlays = useCallback(() => {
    setSettingsOpen(false);
    setStoreOpen(false);
  }, []);

  const toggleEdit = useCallback(() => setEditing((v) => !v), []);
  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);
  const openStore = useCallback(() => {
    setStoreOpen(true);
    setSettingsOpen(false);
  }, []);

  useKeyboard({
    enabled: shortcuts,
    onEscape: closeOverlays,
    onSearch: focusSearch,
    onToggleEdit: toggleEdit,
    onStore: openStore,
  });

  const rootStyle = useMemo(
    () => ({
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "var(--fg)",
      WebkitFontSmoothing: "antialiased",
      ...tokens(theme, accent),
    }),
    [theme, accent]
  );

  // The background lives on its own fixed layer rather than on the root: it
  // must not scroll away, and setting `backgroundAttachment` alongside the
  // `background` shorthand makes React warn about mixed shorthand properties.
  const backgroundStyle = useMemo(
    () => ({
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      background: background(theme, accent, wall),
    }),
    [theme, accent, wall]
  );

  // Keep the page behind the app (overscroll, pre-mount paint) on-theme.
  useEffect(() => {
    document.body.style.background = baseColor(theme);
  }, [theme]);

  return (
    <div style={rootStyle}>
      <div aria-hidden="true" style={backgroundStyle} />
      {/* Content sits in its own layer so the fixed background never paints
          over it (positioned elements beat static ones). */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: "100vh",
        }}
      >
        <Header
          scrolled={scrolled}
          editing={editing}
          onToggleEdit={toggleEdit}
          onOpenStore={openStore}
          onOpenSettings={() => setSettingsOpen(true)}
          searchRef={searchRef}
        />

        {showGreeting ? (
          <Hero
            name={settings.profile.name}
            summary=""
            layoutName={settings.board.layoutName}
            tileCount={settings.board.ids.length}
          />
        ) : null}

        <div style={{ position: "relative", flex: 1, padding: "0 28px 80px" }}>
          <div
            style={{
              maxWidth: 1560,
              margin: "0 auto",
              padding: "40px 0",
              color: "var(--faint)",
              fontSize: 13,
            }}
          >
            Board renders here (M2).
          </div>
        </div>
      </div>

      {settingsOpen ? (
        <div style={{ position: "fixed", bottom: 20, left: 20, color: "var(--faint)" }}>
          settings drawer (M7) — press Esc
        </div>
      ) : null}
      {storeOpen ? (
        <div style={{ position: "fixed", bottom: 44, left: 20, color: "var(--faint)" }}>
          store (M8) — press Esc
        </div>
      ) : null}
    </div>
  );
}

export default App;
