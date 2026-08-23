import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import Backdrop from "./components/Backdrop";
import Board from "./components/Board";
import ContextMenu from "./components/ContextMenu";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PresetsDock from "./components/PresetsDock";
import { Button, Collapse } from "./components/primitives";
import SettingsDrawer from "./components/SettingsDrawer";
import Store from "./components/Store";
import Notifications from "./components/Notifications";
import Tour from "./components/Tour";
import WelcomeCard from "./components/WelcomeCard";
import WidgetSettingsDrawer from "./components/WidgetSettingsDrawer";
import { autoArrange } from "./core/autoArrange";
import { boardMenu, isEditableTarget, widgetMenu } from "./core/menus";
import { DEFAULT_ZOOM_MODE, presetBoardPatch, SAVED_LAYOUT } from "./core/schema";
import { savedViewState } from "./core/savedView";
import { useNotices } from "./core/noticeContext";
import { useConditions } from "./core/useConditions";
import { useSettings } from "./core/settingsContext";
import { heroSummary } from "./core/summary";
import { cameraFor } from "./core/tileStyle";
import { background, baseColor, tokens } from "./core/tokens";
import { boardShift, useColumns, useViewportWidth } from "./core/useColumns";
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
  const [manualRefresh, setManualRefresh] = useState({});

  const searchRef = useRef(null);
  const boardRef = useRef(null);
  const tileEls = useRef({});
  const scrolled = useScrolled();
  const columns = useColumns();
  const viewportWidth = useViewportWidth();

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

  // An open drawer overlaps the board on all but a very wide window, so the
  // content moves left by however much it actually overlaps rather than hiding
  // under it. Measured against the live width, so a resize while a drawer is
  // open is accounted for too.
  const openDrawerWidth = settingsOpen ? 400 : panel ? 340 : 0;
  const shift = boardShift(viewportWidth, openDrawerWidth, appearance.boardWidth);

  // One shared queue for the whole app — see core/notify.jsx. `notify` takes a
  // bare string as well as an object, so every existing toast("…") call reads
  // the same and lands in the "confirmations" category.
  const { notify } = useNotices();
  const toast = notify;

  // Sync failing, the extension having updated itself, and the page dropping
  // frames — see core/useConditions.js. All three were previously either silent
  // or impossible for a user to find out about.
  useConditions({
    notify,
    blurOn: appearance.blur !== false,
    onTurnOffBlur: () => update("appearance", { blur: false }),
  });

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

  // Settings, already scrolled to the part that was asked for.
  //
  // "Add or manage profiles" in the switcher opened the drawer at the top and
  // left you to find Profiles, which is most of the way down it. The section
  // handles the tour points at are the same handles this needs, so it uses
  // those rather than inventing a second set of anchors.
  //
  // A frame late, because the drawer is not in the DOM until the commit this
  // triggers. Instant rather than smooth: the panel is sliding in at the same
  // time, and it should arrive already in the right place instead of arriving
  // and then setting off on a scroll of its own.
  const revealInSettings = useCallback(
    (tourName) => {
      openSettings();
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-tour="${tourName}"]`)
          ?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    },
    [openSettings]
  );

  // --- the tour ------------------------------------------------------------
  //
  // One function that puts the whole app into a named state, rather than the
  // tour opening and closing things itself. Every scene says what *all* of the
  // chrome should be, so moving between them cannot leave a drawer open behind
  // the next step, and skipping out halfway cannot strand somebody in a mode
  // they did not choose.
  const [tourOpen, setTourOpen] = useState(false);

  // Which row the tour wants shown as if hovered. Only the menu step uses it:
  // an open menu of six rows says "there is a menu" and not "and this is the
  // row you want", so the tour lights the one it is talking about.
  const [menuHint, setMenuHint] = useState(null);

  const showScene = useCallback(
    (scene, stepId) => {
      setMenuHint(stepId === "tile" ? "Widget settings" : null);
      setStoreOpen(scene === "store");
      setSettingsOpen(scene === "settings");
      setEditing(scene === "edit");
      // The widget scene needs a widget. Whichever is first on the board is the
      // one the tour has been pointing at all along.
      setPanel(scene === "widget" ? ids[0] || null : null);
      // Telling somebody a right-click menu exists is not the same as showing
      // them one, so the tour opens it for real. Positioned over the tile it
      // belongs to rather than at a pointer that was never there — the menu
      // clamps itself to the viewport from wherever it is put.
      if (scene === "menu" && ids[0]) {
        const tile = document.querySelector('[data-tour="tile"]');
        const at = tile?.getBoundingClientRect();
        setMenu({
          id: ids[0],
          x: at ? at.left + at.width * 0.55 : 200,
          y: at ? at.top + at.height * 0.55 : 200,
        });
      } else {
        setMenu(null);
      }
    },
    [ids]
  );

  const startTour = useCallback(() => {
    // Taking the tour is being shown around, so the welcome card has done its
    // job whether or not it was ever dismissed.
    update("behavior", { tourDone: true });
    setTourOpen(true);
  }, [update]);

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
      // The first preset switch quietly snapshots whatever was on the board, so
      // the switch cannot destroy an arrangement with no way back. That was
      // happening invisibly: the safety net existed and nobody was told it had
      // been used, so "Yours" would later turn out to hold a board they did not
      // remember saving. Now the one time it happens, it says so.
      const snapshotTaken = !board.saved;
      update("board", presetBoardPatch(name, board));
      closeZoom();
      toast(
        snapshotTaken
          ? `${name} layout applied — your previous board is kept as "${SAVED_LAYOUT}"`
          : `${name} layout applied`
      );
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

  // Whether the board still matches the "Yours" snapshot. Computed once here
  // rather than at each of the three places that ask, so the dock, the context
  // menu and the memo below can never disagree about it.
  const savedState = savedViewState(board);

  const menuModel = useMemo(() => {
    if (!menu) return null;
    if (!menu.id) {
      return boardMenu({
        editing,
        theme,
        hasSaved: !!board.saved,
        savedState,
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
    savedState,
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
        editing={editing}
        onToggleEdit={toggleEdit}
        onOpenStore={openStore}
        onOpenSettings={openSettings}
        onManageProfiles={() => revealInSettings("settings-profiles")}
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
        <Button
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
          hover={{ background: "var(--sheetHover)" }}
        >
          <LuArrowLeft size={14} /> Back
        </Button>
      ) : null}

      <Notifications hidden={editing} />

      {dockPresent ? (
        <PresetsDock
          closing={dockLeaving}
          layoutName={board.layoutName}
          hasSaved={!!board.saved}
          savedState={savedState}
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
          onTint={(tint) => updateWidget(panelId, { tint })}
          theme={theme}
          appearance={appearance}
          onRemove={() => removeTile(panelId)}
          toast={toast}
        />
      ) : null}

      <SettingsDrawer
        onTour={() => {
          setSettingsOpen(false);
          startTour();
        }}
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
        // Never behind the tour. Starting the tour from Settings on an install
        // that had not dismissed the welcome card left both up at once: the
        // card still modal underneath, its scrim dimming the board a second
        // time, and the spotlight landing on a tile nobody could see past it.
        open={!behavior.tourDone && !tourOpen}
        name={profile.name}
        theme={appearance.theme || "system"}
        blur={appearance.blur !== false}
        onNameChange={(name) => update("profile", { name })}
        onThemeChange={(t) => update("appearance", { theme: t })}
        onBlurChange={(blur) => update("appearance", { blur })}
        onEnableSearch={() =>
          update("behavior", {
            suggest: { ...(behavior.suggest || {}), tabs: true, bookmarks: true, history: true },
          })
        }
        onDismiss={({ tour } = {}) => {
          update("behavior", { tourDone: true });
          // Straight into the tour when they asked for it, rather than leaving
          // a button somewhere they have not been told about yet.
          if (tour) startTour();
        }}
      />

      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onScene={showScene}
        hasWidgets={ids.length > 0}
      />

      {/* The menu keeps its last position and contents while it fades out. */}
      {menuPresent && lastMenu.current && lastModel.current ? (
        <ContextMenu
          menu={lastMenu.current}
          title={lastModel.current.title}
          items={lastModel.current.items}
          closing={menuLeaving}
          hintLabel={menuHint}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  );
}

export default App;
