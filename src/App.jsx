import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import Board from "./components/Board";
import ContextMenu from "./components/ContextMenu";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PresetsDock from "./components/PresetsDock";
import SettingsDrawer from "./components/SettingsDrawer";
import Store from "./components/Store";
import Toast from "./components/Toast";
import WidgetSettingsDrawer from "./components/WidgetSettingsDrawer";
import { boardMenu, widgetMenu } from "./core/menus";
import { PRESETS, SAVED_LAYOUT } from "./core/schema";
import { useSettings } from "./core/settingsContext";
import { heroSummary } from "./core/summary";
import { cameraFor } from "./core/tileStyle";
import { background, baseColor, tokens } from "./core/tokens";
import { useColumns } from "./core/useColumns";
import { useKeyboard, useScrolled } from "./core/useKeyboard";
import { animateExit } from "./core/useFlip";
import { moveItem } from "./core/usePointerReorder";
import { clearBucket } from "./sdk/bucket";
import { hasPermissionsApi, requestAllPermissions } from "./sdk/permissions";
import {
  getWidget,
  knownIds,
  nextInstanceId,
  resolveSize,
  typeOf,
} from "./widgets/registry";

const HEADER_HEIGHT = 78;

function App() {
  const { settings, update, updateWidget, replaceSettings, resetSettings } =
    useSettings();
  const { appearance, behavior, board, widgets, profile } = settings;
  const { theme, accent, wall } = appearance;

  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [cam, setCam] = useState(null);
  const [panel, setPanel] = useState(null);
  const [menu, setMenu] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [manualRefresh, setManualRefresh] = useState({});

  const searchRef = useRef(null);
  const boardRef = useRef(null);
  const tileEls = useRef({});
  const toastTimer = useRef(null);
  const scrolled = useScrolled();
  const columns = useColumns();

  // Only render ids the catalog actually knows, so a widget removed from a
  // build can never leave an empty tile behind.
  const ids = useMemo(() => knownIds(board.ids), [board.ids]);
  const zoomMode = behavior.zoomMode;
  const summary = useMemo(() => heroSummary(settings, ids), [settings, ids]);

  const toast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = setTimeout(() => setToastMsg(""), 1900);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const registerTile = useCallback((id, el) => {
    if (el) tileEls.current[id] = el;
    else delete tileEls.current[id];
  }, []);

  const closeZoom = useCallback(() => {
    setZoom(null);
    setCam(null);
    setPanel(null);
  }, []);

  const closeEverything = useCallback(() => {
    setZoom(null);
    setCam(null);
    setPanel(null);
    setMenu(null);
    setSettingsOpen(false);
    setStoreOpen(false);
  }, []);

  // Camera zoom needs the tile's on-screen box measured against the board's,
  // so the transform origin lands on the tile the user actually clicked.
  const focusTile = useCallback(
    (id) => {
      const manifest = getWidget(id);
      if (zoomMode === "None") {
        toast(`${manifest?.name || "Widget"} — click-to-zoom is off`);
        return;
      }
      let nextCam = null;
      const el = tileEls.current[id];
      if (el && boardRef.current && zoomMode === "Camera") {
        nextCam = cameraFor(
          el.getBoundingClientRect(),
          boardRef.current.getBoundingClientRect(),
          window,
          HEADER_HEIGHT
        );
      }
      setCam(nextCam);
      setZoom(id);
      setMenu(null);
    },
    [zoomMode, toast]
  );

  const openTile = useCallback(
    (id) => {
      if (editing || zoom === id) return;
      focusTile(id);
    },
    [editing, zoom, focusTile]
  );

  const toggleEdit = useCallback(() => {
    setEditing((v) => !v);
    setZoom(null);
    setCam(null);
    setPanel(null);
    setMenu(null);
  }, []);

  const openStore = useCallback(() => {
    setStoreOpen(true);
    setSettingsOpen(false);
    setMenu(null);
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  useKeyboard({
    enabled: behavior.shortcuts,
    onEscape: closeEverything,
    onSearch: focusSearch,
    onToggleEdit: toggleEdit,
    onStore: openStore,
  });

  // --- board mutations -----------------------------------------------------

  const removeTile = useCallback(
    async (id) => {
      setMenu(null);
      if (zoom === id) closeZoom();
      if (panel === id) setPanel(null);
      // Play the tile out before unmounting it; the gap it leaves is then
      // closed by the board's FLIP animation.
      await animateExit(tileEls.current[id]);
      update("board", {
        ids: board.ids.filter((x) => x !== id),
        layoutName: "Custom",
      });
      clearBucket(id);
    },
    [board.ids, update, zoom, panel, closeZoom]
  );

  const cycleSize = useCallback(
    (id) => {
      const manifest = getWidget(id);
      if (!manifest) return;
      const current = resolveSize(id, board.sizes);
      const index = manifest.sizes.findIndex(
        (s) => s[0] === current[0] && s[1] === current[1]
      );
      const next = manifest.sizes[(index + 1) % manifest.sizes.length];
      update("board", {
        sizes: { ...board.sizes, [id]: next },
        layoutName: "Custom",
      });
    },
    [board.sizes, update]
  );

  // Called continuously while a tile is held, so the board reorders under the
  // cursor rather than only on drop.
  const reorderTiles = useCallback(
    (from, to) => {
      update("board", { ids: moveItem(board.ids, from, to), layoutName: "Custom" });
    },
    [board.ids, update]
  );

  const setWidgetConfig = useCallback(
    (id, patch) => updateWidget(id, { config: patch }),
    [updateWidget]
  );
  const setWidgetOptions = useCallback(
    (id, patch) => updateWidget(id, { options: patch }),
    [updateWidget]
  );

  const setSize = useCallback(
    (id, size) => {
      update("board", { sizes: { ...board.sizes, [id]: size }, layoutName: "Custom" });
    },
    [board.sizes, update]
  );

  const applyPreset = useCallback(
    (name) => {
      // A preset only places widgets that exist in this build, and adding one
      // from a preset also marks it installed.
      const next = knownIds(PRESETS[name] || []);
      update("board", {
        ids: next,
        sizes: {},
        layoutName: name,
        installed: [...new Set([...board.installed, ...next])],
      });
      closeZoom();
      toast(`${name} layout applied`);
    },
    [board.installed, update, closeZoom, toast]
  );

  // The user's own layout: a snapshot of ids and per-tile sizes, so restoring
  // it brings back the arrangement and not merely the set of widgets.
  const saveCurrentLayout = useCallback(() => {
    update("board", {
      saved: { ids: [...board.ids], sizes: { ...board.sizes } },
      layoutName: SAVED_LAYOUT,
    });
    toast(`Saved as "${SAVED_LAYOUT}"`);
  }, [board.ids, board.sizes, update, toast]);

  const applySavedLayout = useCallback(() => {
    const saved = board.saved;
    if (!saved) return;
    const next = knownIds(saved.ids || []);
    update("board", {
      ids: next,
      sizes: saved.sizes || {},
      layoutName: SAVED_LAYOUT,
      installed: [...new Set([...board.installed, ...next])],
    });
    closeZoom();
    toast(`${SAVED_LAYOUT} layout applied`);
  }, [board.saved, board.installed, update, closeZoom, toast]);

  const duplicateTile = useCallback(
    (id) => {
      const copy = nextInstanceId(board.ids, typeOf(id));
      const at = board.ids.indexOf(id);
      const next = [...board.ids];
      next.splice(at + 1, 0, copy);
      update("board", {
        ids: next,
        // The copy starts at the original's size, not the manifest default.
        sizes: { ...board.sizes, [copy]: resolveSize(id, board.sizes) },
        layoutName: "Custom",
      });
      toast(`${getWidget(id)?.name} duplicated`);
    },
    [board.ids, board.sizes, update, toast]
  );

  const moveToTop = useCallback(
    (id) => {
      update("board", {
        ids: [id, ...board.ids.filter((x) => x !== id)],
        layoutName: "Custom",
      });
    },
    [board.ids, update]
  );

  const refreshNow = useCallback(
    (id) => {
      setManualRefresh((m) => ({ ...m, [id]: (m[id] || 0) + 1 }));
      toast(`${getWidget(id)?.name || "Widget"} refreshed`);
    },
    [toast]
  );

  // Add or remove a widget type from the board, from the store.
  // The permission request must run inside this click: Chrome rejects one
  // that is not tied to a user gesture.
  const toggleFromStore = useCallback(
    async (manifest) => {
      const present = board.ids.filter((x) => typeOf(x) === manifest.id);
      if (present.length) {
        update("board", {
          ids: board.ids.filter((x) => typeOf(x) !== manifest.id),
          layoutName: "Custom",
        });
        present.forEach(clearBucket);
        toast(`${manifest.name} removed`);
        return;
      }

      // Gate only where the API exists. In the packaged extension it always
      // does, so behaviour there is unchanged; run as a plain page there is
      // nothing to grant, and the widget renders its own explanation rather
      // than being unaddable.
      const needed = manifest.permissions?.chrome || [];
      if (needed.length && hasPermissionsApi()) {
        const granted = await requestAllPermissions(needed);
        if (!granted) {
          toast(`${manifest.name} needs the ${needed.join(", ")} permission`);
          return;
        }
      }

      update("board", {
        ids: [...board.ids, manifest.id],
        installed: [...new Set([...board.installed, manifest.id])],
        layoutName: "Custom",
      });
      toast(`${manifest.name} added`);
    },
    [board.ids, board.installed, update, toast]
  );

  const openSettingsAt = useCallback(
    (section) => {
      if (section === "theme") {
        update("appearance", { theme: theme === "dark" ? "light" : "dark" });
        return;
      }
      setSettingsOpen(true);
      setMenu(null);
    },
    [theme, update]
  );

  // --- context menu --------------------------------------------------------

  const menuModel = useMemo(() => {
    if (!menu) return null;
    if (!menu.id) {
      return boardMenu({
        editing,
        theme,
        hasSaved: !!board.saved,
        onStore: openStore,
        onToggleEdit: toggleEdit,
        onPreset: applyPreset,
        onApplySaved: applySavedLayout,
        onSaveCurrent: saveCurrentLayout,
        onSettings: openSettingsAt,
      });
    }
    const manifest = getWidget(menu.id);
    if (!manifest) return null;
    return widgetMenu({
      manifest,
      currentSize: resolveSize(menu.id, board.sizes),
      zoomMode,
      onFocus: () => focusTile(menu.id),
      onSettings: () => setPanel(menu.id),
      onSize: (size) => setSize(menu.id, size),
      onRefresh: () => refreshNow(menu.id),
      onDuplicate: () => duplicateTile(menu.id),
      onMoveTop: () => moveToTop(menu.id),
      onRemove: () => removeTile(menu.id),
      onAction: (action) =>
        action.run?.({
          toast,
          openSettings: () => setPanel(menu.id),
          setOptions: (patch) => setWidgetOptions(menu.id, patch),
          options: widgets[menu.id]?.options || {},
        }),
    });
  }, [
    menu,
    editing,
    theme,
    board.sizes,
    zoomMode,
    widgets,
    board.saved,
    openStore,
    toggleEdit,
    applyPreset,
    applySavedLayout,
    saveCurrentLayout,
    openSettingsAt,
    focusTile,
    setSize,
    refreshNow,
    duplicateTile,
    moveToTop,
    removeTile,
    setWidgetOptions,
    toast,
  ]);

  // --- styling -------------------------------------------------------------

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

  // The background lives on its own fixed layer: it must not scroll away, and
  // setting backgroundAttachment beside the `background` shorthand makes React
  // warn about mixed shorthand properties. It sits at z-index -1 rather than
  // wrapping the content in a positive layer, because such a wrapper would be
  // a stacking context and trap the focused tile's z-index below the scrim.
  const backgroundStyle = useMemo(
    () => ({
      position: "fixed",
      inset: 0,
      zIndex: -1,
      pointerEvents: "none",
      background: background(theme, accent, wall),
    }),
    [theme, accent, wall]
  );

  useEffect(() => {
    document.body.style.background = baseColor(theme);
  }, [theme]);

  return (
    <div style={rootStyle}>
      <div aria-hidden="true" style={backgroundStyle} />
      <Header
        scrolled={scrolled}
        editing={editing}
        onToggleEdit={toggleEdit}
        onOpenStore={openStore}
        onOpenSettings={() => setSettingsOpen(true)}
        searchRef={searchRef}
      />

      {behavior.showGreeting && !zoom ? (
        <Hero
          name={profile.name}
          summary={summary}
          layoutName={board.layoutName}
          tileCount={ids.length}
        />
      ) : null}

      <Board
        ids={ids}
        columns={columns}
        appearance={appearance}
        board={board}
        widgets={widgets}
        editing={editing}
        zoom={zoom}
        cam={cam}
        zoomMode={zoomMode}
        panelOpen={!!panel}
        menu={menu}
        manualRefresh={manualRefresh}
        boardRef={boardRef}
        registerTile={registerTile}
        onBoardMenu={(e) => {
          e.preventDefault();
          setMenu({ id: null, x: e.clientX, y: e.clientY });
        }}
        onOpenTile={openTile}
        onTileMenu={(e, id) => {
          e.preventDefault();
          e.stopPropagation();
          setMenu({ id, x: e.clientX, y: e.clientY });
        }}
        onOpenSettings={(id) => setPanel(id)}
        onCloseZoom={closeZoom}
        onResize={cycleSize}
        onRemove={removeTile}
        onOpenStore={openStore}
        onReorder={reorderTiles}
        setWidgetConfig={setWidgetConfig}
        setWidgetOptions={setWidgetOptions}
        toast={toast}
      />

      {/* Camera zoom moves in on the board, so there is nothing to dim behind —
          a scrim would sit over the very thing being magnified. Expand and
          Spotlight are overlays and still get one. Either way the backdrop
          stays clickable to zoom back out. */}
      {zoom ? (
        <div
          onClick={closeZoom}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            background: zoomMode === "Camera" ? "transparent" : "var(--scrim)",
            transition: "background .45s ease",
          }}
        />
      ) : null}

      {zoom ? (
        <button
          type="button"
          onClick={closeZoom}
          style={{
            position: "fixed",
            left: 20,
            top: 20,
            zIndex: 46,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 14px",
            borderRadius: 999,
            cursor: "pointer",
            fontSize: 13,
            background: "var(--sheet)",
            border: "1px solid var(--line)",
            color: "var(--fg)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 10px 30px rgba(0,0,0,.28)",
            animation: "db-in .3s ease both",
          }}
        >
          <LuArrowLeft size={14} /> Back
        </button>
      ) : null}

      <Toast message={toastMsg} hidden={editing} />

      {editing ? (
        <PresetsDock
          layoutName={board.layoutName}
          hasSaved={!!board.saved}
          onPreset={applyPreset}
          onApplySaved={applySavedLayout}
          onSaveCurrent={saveCurrentLayout}
          onAddWidget={openStore}
          onDone={toggleEdit}
        />
      ) : null}

      {panel ? (
        <WidgetSettingsDrawer
          instanceId={panel}
          board={board}
          widgets={widgets}
          onClose={() => setPanel(null)}
          onSize={(size) => setSize(panel, size)}
          onOptions={(patch) => setWidgetOptions(panel, patch)}
          onConfig={(patch) => setWidgetConfig(panel, patch)}
          onRate={(rate) => updateWidget(panel, { rate })}
          onRemove={() => removeTile(panel)}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsDrawer
          settings={settings}
          update={update}
          onClose={() => setSettingsOpen(false)}
          onReset={() => {
            resetSettings();
            setSettingsOpen(false);
          }}
          onRestore={(incoming) => {
            replaceSettings(incoming);
            setSettingsOpen(false);
          }}
          toast={toast}
        />
      ) : null}

      {storeOpen ? (
        <Store
          boardIds={board.ids}
          onClose={() => setStoreOpen(false)}
          onToggle={toggleFromStore}
        />
      ) : null}

      {menu && menuModel ? (
        <ContextMenu
          menu={menu}
          title={menuModel.title}
          items={menuModel.items}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  );
}

export default App;
