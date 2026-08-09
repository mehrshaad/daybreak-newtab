import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import Backdrop from "./components/Backdrop";
import Board from "./components/Board";
import ContextMenu from "./components/ContextMenu";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PresetsDock from "./components/PresetsDock";
import { Collapse } from "./components/primitives";
import SettingsDrawer from "./components/SettingsDrawer";
import Store from "./components/Store";
import Toast from "./components/Toast";
import WelcomeCard from "./components/WelcomeCard";
import WidgetSettingsDrawer from "./components/WidgetSettingsDrawer";
import { autoArrange } from "./core/autoArrange";
import { boardMenu, isEditableTarget, widgetMenu } from "./core/menus";
import { DEFAULT_ZOOM_MODE, presetBoardPatch, SAVED_LAYOUT } from "./core/schema";
import { useSettings } from "./core/settingsContext";
import { heroSummary } from "./core/summary";
import { cameraFor } from "./core/tileStyle";
import { background, baseColor, tokens } from "./core/tokens";
import { useColumns } from "./core/useColumns";
import { useKeyboard, useScrolled } from "./core/useKeyboard";
import { resolveTheme, useSystemTheme } from "./core/useSystemTheme";
import { animateExit, clearBucket, hasPermissionsApi, moveItem, requestAllPermissions, usePresence } from "@daybreak/sdk";
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
  const { accent, wall } = appearance;
  // The stored preference may be "system"; resolve it once here so every token
  // lookup and every child sees a concrete theme.
  const fromSystem = useSystemTheme();
  const theme = resolveTheme(appearance.theme, fromSystem);

  // Everything below the app gets the *resolved* theme. Passing the raw
  // preference down meant tileStyle saw "system" and, since it treats anything
  // that is not "light" as dark, gave tiles dark backgrounds on a light page.
  const resolvedAppearance = useMemo(
    () => ({ ...appearance, theme }),
    [appearance, theme]
  );

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
  // Not read from settings: click-to-zoom is parked, nothing offers a picker,
  // and an earlier build wrote a mode into stored settings — which would
  // otherwise resurrect Spotlight for anyone who ran it.
  const zoomMode = DEFAULT_ZOOM_MODE;
  const summary = useMemo(() => heroSummary(settings, ids), [settings, ids]);

  // Remembered so the widget drawer can finish its exit animation with its
  // content still rendered, rather than blanking the instant it closes.
  const lastPanel = useRef(null);
  if (panel) lastPanel.current = panel;
  const panelId = panel || lastPanel.current;

  // An open drawer overlaps the board on anything but a very wide window, so
  // the content shifts left by the drawer's width instead of hiding under it.
  const openDrawerWidth = settingsOpen ? 400 : panel ? 340 : 0;
  const shift =
    openDrawerWidth && typeof window !== "undefined" && window.innerWidth < 1600
      ? openDrawerWidth
      : 0;

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

  // Shared catch-all: header, hero, dock and the board's own empty space all
  // open the same board menu on right-click, but never over a text-entry
  // surface — that needs the native menu for paste.
  const openBoardMenu = useCallback((e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
    setMenu({ id: null, x: e.clientX, y: e.clientY });
  }, []);

  const openTileMenu = useCallback((e, id) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  // Camera zoom needs the tile's on-screen box measured against the board's,
  // so the transform origin lands on the tile the user actually clicked.
  const focusTile = useCallback(
    (id) => {
      // Zoom off is the normal state now, so it passes silently — telling the
      // user something they configured is not news.
      if (zoomMode === "None") return;
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
    [zoomMode]
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

  // Long-pressing a tile or empty board space turns editing on — never off,
  // unlike toggleEdit, since it fires from a gesture that only ever means
  // "start arranging."
  const enterEditing = useCallback(() => {
    setEditing(true);
    setZoom(null);
    setCam(null);
    setPanel(null);
    setMenu(null);
  }, []);

  // The store and the settings drawer both end layout editing: they cover the
  // board (or push it aside) and leaving the dock and the tile chrome behind
  // them is just noise. A widget's own settings drawer does not — that one is
  // opened *while* arranging, and is meant to be.
  const openStore = useCallback(() => {
    setStoreOpen(true);
    setSettingsOpen(false);
    setEditing(false);
    setMenu(null);
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
    setEditing(false);
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
      update("board", presetBoardPatch(name, board));
      closeZoom();
      toast(`${name} layout applied`);
    },
    [board, update, closeZoom, toast]
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

  // Repack the board without touching which widgets are on it.
  const autoArrangeBoard = useCallback(() => {
    const next = autoArrange(ids, board.sizes, columns);
    if (next.join("|") === ids.join("|")) {
      toast("Already tidy");
      return;
    }
    update("board", { ids: next, layoutName: "Custom" });
    toast("Widgets rearranged");
  }, [ids, board.sizes, columns, update, toast]);

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
      setEditing(false);
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

  // The theme tokens go on <html>, not the app root div: Popover portals its
  // panel to document.body, which sits *outside* the root, so tokens carried
  // as inline styles there left every portalled panel with an unresolvable
  // --sheet/--line/--blur-* — no background, no border, no blur, in either
  // blur mode. On <html>, everything inherits them, portals included.
  // useLayoutEffect so they are set before the frame paints.
  const themeTokens = useMemo(
    () => tokens(theme, accent, appearance.blur !== false),
    [theme, accent, appearance.blur]
  );
  useLayoutEffect(() => {
    const style = document.documentElement.style;
    for (const [key, value] of Object.entries(themeTokens)) {
      style.setProperty(key, value);
    }
  }, [themeTokens]);

  const rootStyle = useMemo(
    () => ({
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "var(--fg)",
      WebkitFontSmoothing: "antialiased",
      // Makes room for an open drawer rather than letting it cover the board.
      paddingRight: shift ? `${shift}px` : 0,
      transition: "padding-right .3s cubic-bezier(.2,.8,.2,1)",
    }),
    [shift]
  );

  // <html> carries the flat base colour only. The gradient stack lives in
  // <Backdrop>, which can crossfade it; here it just needs to match so the
  // overscroll area and any gap before the first paint are the right colour.
  //
  // Body must stay transparent: a background on body paints over the negative
  // z-index backdrop layers, which is what once made every wallpaper option
  // look like it did nothing.
  useEffect(() => {
    const html = document.documentElement;
    html.style.backgroundColor = baseColor(theme);
    document.body.style.background = "transparent";
    // Tells Chrome to theme form controls and scrollbars to match.
    html.style.colorScheme = theme;
    // Mirrored for boot.js, which reads it synchronously on the *next* tab so
    // the pre-React paint is already the right colour instead of flashing
    // white/dark until chrome.storage resolves.
    try {
      localStorage.setItem("daybreakTheme", theme);
    } catch {
      /* storage disabled - the boot script falls back to the OS scheme */
    }
    return () => {
      html.style.backgroundColor = "";
      html.style.colorScheme = "";
    };
  }, [theme]);

  // Chrome that only exists in a mode has to outlive the mode by the length of
  // its exit animation.
  const [dockPresent, dockLeaving] = usePresence(editing, 220);
  const [zoomChrome, zoomLeaving] = usePresence(!!zoom, 260);
  const [menuPresent, menuLeaving] = usePresence(!!(menu && menuModel), 120);
  // Held so the fading menu still has something to draw.
  const lastMenu = useRef(null);
  const lastModel = useRef(null);
  if (menu && menuModel) {
    lastMenu.current = menu;
    lastModel.current = menuModel;
  }

  // See the root element's className.
  const [themed, setThemed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setThemed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Page zoom uses the CSS `zoom` property rather than a transform so the
  // layout actually reflows — text rewraps and the grid recalculates — which is
  // what Ctrl+ does. A transform would just scale a fixed-width page.
  useEffect(() => {
    const pct = appearance.pageZoom ?? 100;
    document.body.style.zoom = pct === 100 ? "" : `${pct}%`;
    return () => {
      document.body.style.zoom = "";
    };
  }, [appearance.pageZoom]);

  return (
    // db-themed turns on the colour transitions in base.scss. It is added a
    // frame after mount so the first paint is not itself animated — otherwise
    // every new tab would fade its own colours in.
    <div style={rootStyle} className={themed ? "db-themed" : undefined}>
      <Backdrop background={background(theme, accent, wall)} />
      <Header
        scrolled={scrolled}
        theme={theme}
        editing={editing}
        onToggleEdit={toggleEdit}
        onOpenStore={openStore}
        onOpenSettings={openSettings}
        onContextMenu={openBoardMenu}
        searchRef={searchRef}
      />

      {/* Collapsed rather than unmounted, so turning the greeting off (or
          zooming a tile) slides the board up instead of snapping it. */}
      <Collapse open={behavior.showGreeting && !zoom}>
        <Hero
          name={profile.name}
          summary={summary}
          layoutName={board.layoutName}
          tileCount={ids.length}
          onContextMenu={openBoardMenu}
        />
      </Collapse>

      <Board
        ids={ids}
        columns={columns}
        appearance={resolvedAppearance}
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
        onEnterEditing={enterEditing}
        onBoardMenu={openBoardMenu}
        onOpenTile={openTile}
        onTileMenu={openTileMenu}
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
      {zoomChrome ? (
        <div
          onClick={closeZoom}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            background:
              zoomMode === "Camera" || zoomLeaving ? "transparent" : "var(--scrim)",
            transition: "background .45s ease",
          }}
        />
      ) : null}

      {zoomChrome ? (
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
            backdropFilter: "var(--blur-panel)",
            boxShadow: "0 10px 30px rgba(0,0,0,.28)",
            animation: zoomLeaving
              ? "db-out .2s ease both"
              : "db-in .3s ease both",
          }}
        >
          <LuArrowLeft size={14} /> Back
        </button>
      ) : null}

      <Toast message={toastMsg} hidden={editing} />

      {dockPresent ? (
        <PresetsDock
          closing={dockLeaving}
          layoutName={board.layoutName}
          hasSaved={!!board.saved}
          onPreset={applyPreset}
          onApplySaved={applySavedLayout}
          onSaveCurrent={saveCurrentLayout}
          onAutoArrange={autoArrangeBoard}
          onAddWidget={openStore}
          onDone={toggleEdit}
          onContextMenu={openBoardMenu}
        />
      ) : null}

      {/* Both drawers stay mounted while they animate out, which is why they
          take an `open` prop rather than being conditionally rendered. The
          widget drawer keeps the last id so its content does not vanish
          mid-exit. */}
      {panelId ? (
        <WidgetSettingsDrawer
          open={!!panel}
          instanceId={panelId}
          board={board}
          widgets={widgets}
          onClose={() => setPanel(null)}
          onSize={(size) => setSize(panelId, size)}
          onOptions={(patch) => setWidgetOptions(panelId, patch)}
          onConfig={(patch) => setWidgetConfig(panelId, patch)}
          onRate={(rate) => updateWidget(panelId, { rate })}
          onRemove={() => removeTile(panelId)}
          toast={toast}
        />
      ) : null}

      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        theme={theme}
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

      <Store
        open={storeOpen}
        boardIds={board.ids}
        onClose={() => setStoreOpen(false)}
        onToggle={toggleFromStore}
      />

      <WelcomeCard
        open={!behavior.tourDone}
        name={profile.name}
        theme={appearance.theme || "system"}
        onNameChange={(name) => update("profile", { name })}
        onThemeChange={(t) => update("appearance", { theme: t })}
        onEnableSearch={() =>
          update("behavior", {
            suggest: { ...(behavior.suggest || {}), tabs: true, bookmarks: true, history: true },
          })
        }
        onDismiss={() => update("behavior", { tourDone: true })}
      />

      {/* The menu keeps its last position and contents while it fades out. */}
      {menuPresent && lastMenu.current && lastModel.current ? (
        <ContextMenu
          menu={lastMenu.current}
          title={lastModel.current.title}
          items={lastModel.current.items}
          closing={menuLeaving}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  );
}

export default App;
