import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { LuSettings2, LuX } from "react-icons/lu";
import {
  Appear,
  mark,
  MONO,
  seedFor,
  Tooltip,
  useHover,
  useLongPress,
  useRefresh,
  useTooltip,
} from "@daybreak/sdk";
import { TILE_HEADER } from "../core/tokens";
import { tileStyle } from "../core/tileStyle";
import { getWidget, typeOf } from "../widgets/registry";
import ErrorBoundary from "./ErrorBoundary";

// The board's own drag start used to live on the tile's root — which is why a
// pointerdown on, say, a world clock row bubbled straight up into it and
// dragged the tile at the same time as the row reordered itself. Moving it
// onto this small handle means a press anywhere else in the tile is simply
// never seen by the board's drag machinery: there is no ancestor relationship
// between a row and a sibling handle for the event to bubble through.
//
// Only draggable during edit mode — outside it, a press does nothing — but
// hoverable whenever it is visible at all, so resting the pointer on it reads
// as "this is a handle" before the user commits to Edit layout. Three states,
// escalating: quiet line colour → an accent tint on hover or throughout edit
// mode → full accent only while actually held, which is also the only time it
// widens past the hover width.
function DragHandle({ tileHovered, editing, dragging, onPointerDown, tourFirst }) {
  const [handleHovered, setHandleHovered] = useState(false);
  // No label while the drag is under way: the pointer necessarily sits on the
  // handle for the whole gesture, so the hint would pop up over the board a
  // moment into every drag — and it is telling you to do the thing you are
  // already doing.
  const tip = useTooltip(dragging ? null : "Drag to move");
  const width = dragging ? 56 : handleHovered || editing ? 48 : 36;
  const background = dragging
    ? "var(--accent)"
    : handleHovered || editing
    ? "var(--accentLine)"
    : "var(--line)";
  return (
    <>
      {/* The visual line stays exactly as thin as it looks (4px) — this
          wrapper is what actually catches the pointer, padded well past the
          line's own edges so grabbing it doesn't require pixel-precision.
          Bottom-anchored at the tile's padding edge (not the line's old
          position) so the extra hit area below the line stays inside the
          tile's own padding rather than needing to reach past its
          `overflow: hidden` clip. */}
      <div
        data-tour={tourFirst ? "handle" : undefined}
        ref={tip.anchorRef}
        // Dragging does not require edit mode: the handle only appears on
        // hover, so grabbing it is already deliberate, and rearranging the
        // board is not an edit-mode-only idea. stopPropagation keeps the
        // press away from the tile's own long-press-to-edit — the drag
        // itself escapes that anyway (it cancels past 8px of movement, and a
        // drag starts at 5px), but holding the handle still would otherwise
        // drop into edit mode instead of doing nothing.
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown?.(e);
        }}
        onMouseEnter={() => {
          setHandleHovered(true);
          tip.anchorProps.onMouseEnter?.();
        }}
        onMouseLeave={() => {
          setHandleHovered(false);
          tip.anchorProps.onMouseLeave?.();
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          translate: "-50% 0",
          width: Math.max(width + 32, 80),
          height: 28,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 8,
          cursor: dragging ? "grabbing" : "grab",
          pointerEvents: dragging || editing || tileHovered ? "auto" : "none",
        }}
      >
        <div
          style={{
            width,
            height: 4,
            borderRadius: 999,
            background,
            // `dragging` has to be here in its own right: a held tile has
            // pointer-events switched off so it cannot steal hover from the
            // tiles it passes over, which also means tileHovered goes false
            // the moment the drag starts — and the line you are holding
            // faded out from under you.
            opacity: dragging || editing ? 1 : tileHovered ? 0.5 : 0,
            transition: "opacity .15s ease, background .18s ease, width .18s ease",
          }}
        />
      </div>
      <Tooltip {...tip} />
    </>
  );
}

// One lazy component per widget type, memoized so remounting a tile does not
// re-trigger the dynamic import.
const lazyCache = new Map();
function lazyFor(manifest) {
  if (!lazyCache.has(manifest.id)) {
    lazyCache.set(
      manifest.id,
      lazy(async () => {
        const mod = await manifest.load();
        return { default: mod.default || mod };
      })
    );
  }
  return lazyCache.get(manifest.id);
}

function TileButton({ label, onClick, children, style }) {
  const tip = useTooltip(label);
  return (
    <>
      <button
        ref={tip.anchorRef}
        type="button"
        aria-label={label}
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "12px",
          padding: "5px 9px",
          borderRadius: "999px",
          cursor: "pointer",
          background: "var(--panel2)",
          border: "1px solid var(--line)",
          color: "var(--fg)",
          lineHeight: 1,
          ...style,
        }}
        onMouseEnter={(e) => {
          tip.anchorProps.onMouseEnter?.();
          e.currentTarget.style.background = "var(--accentSoft)";
          e.currentTarget.style.borderColor = "var(--accentLine)";
        }}
        onMouseLeave={(e) => {
          tip.anchorProps.onMouseLeave?.();
          e.currentTarget.style.background = "var(--panel2)";
          e.currentTarget.style.borderColor = "var(--line)";
        }}
        onFocus={tip.anchorProps.onFocus}
        onBlur={tip.anchorProps.onBlur}
      >
        {children}
      </button>
      <Tooltip {...tip} />
    </>
  );
}

function Tile({
  instanceId,
  initialStagger = null,
  appearance,
  columns,
  size,
  options,
  tint,
  tourFirst = false,
  config,
  editing,
  zoomed,
  focused,
  zoomMode,
  panelOpen,
  panelTarget,
  menuTarget,
  dragging = false,
  rate,
  manualRefresh = 0,
  tileRef,
  onOpen,
  onMenu,
  onSettings,
  onClose,
  onResize,
  onRemove,
  onPointerDown,
  onEnterEditing,
  setConfig,
  setOptions,
  toast,
}) {
  // Board's own "was this an initial tile" ref flips false almost
  // immediately after mount, so the prop it computes is only trustworthy on
  // this tile's very first render — frozen here so a later Board re-render
  // (recomputing it as null) can't strip the animation off mid-flight and
  // cancel it outright.
  const [stagger, setStagger] = useState(() => initialStagger);
  // Take the entrance animation back off the node once it has played.
  // Leaving it declared is not inert: reordering the board makes React move
  // this element among its siblings, and Chrome restarts a CSS animation on a
  // moved node. A restart re-enters the delay, where "backwards" fills the
  // from-state — scale(.96), no translation — and a CSS animation outranks an
  // inline style, so the drag's own `node.style.transform` writes stop having
  // any visible effect. The tile sits frozen for the rest of the drag while
  // the pointer walks away from it. With nothing declared there is nothing
  // left to restart.
  //
  // On a timer rather than animationend: that event needs a rendering frame,
  // and a background tab never produces one, so the declaration would outlive
  // the animation exactly where it is hardest to notice.
  useEffect(() => {
    if (stagger === null) return undefined;
    const done = setTimeout(() => setStagger(null), Math.min(stagger * 25, 300) + 280 + 60);
    return () => clearTimeout(done);
  }, [stagger]);
  const manifest = getWidget(instanceId);
  // Each tile polls on its own configured rate; `manualRefresh` lets the
  // context menu's "Refresh now" force one immediately.
  const tick = useRefresh(rate);
  const refreshKey = tick + manualRefresh;
  const [tileHovered, hoverBind] = useHover();
  // Holding the tile body itself (not a control inside it, and not the drag
  // handle) enters edit mode. Disabled once already editing, so it cannot
  // fire again mid-arrangement.
  const onLongPressDown = useLongPress(() => onEnterEditing?.(), {
    enabled: !editing,
  });
  // The handle receives the pointerdown, but the tile itself is what the
  // board's drag machinery needs to move — kept here so it can be handed to
  // usePointerReorder explicitly instead of it defaulting to whichever
  // element the listener happens to be attached to.
  const rootRef = useRef(null);
  const style = useMemo(
    () =>
      tileStyle({
        theme: appearance.theme,
        // Per widget, deliberately. A board-wide setting would just be the
        // theme again; the point of colouring a tile is telling it apart from
        // the one next to it.
        tint: tint ?? null,
        blur: appearance.blur !== false,
        radius: appearance.radius,
        alpha: appearance.alpha,
        size,
        columns,
        editing,
        menuTarget,
        zoomed,
        focused,
        zoomMode,
        panelOpen,
        panelTarget,
      }),
    [
      appearance,
      tint,
      size,
      columns,
      editing,
      menuTarget,
      panelTarget,
      zoomed,
      focused,
      zoomMode,
      panelOpen,
    ]
  );

  if (!manifest) return null;
  const Widget = lazyFor(manifest);

  // What the tile puts above its content. "none" frees the row entirely, but
  // never while the edit chrome is out — the resize and remove buttons live in
  // that row and cannot be collapsed out from under the user.
  const labels = appearance.tileLabels || "both";
  const showIcon = labels === "both" || labels === "icon";
  const showName = labels === "both" || labels === "name";
  // Only what actually occupies the header row may keep it open, and that is
  // just the zoom chrome. Edit-mode controls are absolutely positioned above the
  // tile on purpose (see the comment where they are rendered) and a right-click
  // puts nothing in the row at all — so including either of those meant that
  // with labels hidden, right-clicking a widget pushed its content down by the
  // height of a row that then showed nothing.
  const headerHidden = !showIcon && !showName && !focused;
  // How far a widget may bleed past the tile's own padding, which is nothing
  // while the header row is there and the full padding once it has gone. A
  // widget that is essentially one large drawing — the analog clock — can then
  // use the whole tile rather than sitting in a frame of empty padding. Passed
  // as CSS custom properties rather than a prop because it is a layout detail
  // of the tile, not information a widget needs to reason about: the ones that
  // want it opt in with a negative margin and the rest never see it.
  const bleed = headerHidden ? { x: 18, y: 16 } : { x: 0, y: 0 };

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        tileRef?.(el);
      }}
      // FLIP identifies tiles by this across reorders and resizes.
      data-flip-id={instanceId}
      data-tour={tourFirst ? "tile" : undefined}
      style={{
        "--tile-bleed-x": `${bleed.x}px`,
        "--tile-bleed-y": `${bleed.y}px`,
        ...style,
        // Baked in once at mount and never touched again — a static value
        // never replays a CSS animation on re-render, which is what keeps
        // this from firing again on every prop change.
        //
        // Fill mode must be "backwards", not "both": db-menu ends at
        // `transform: none`, and a "both"/"forwards" fill keeps that
        // permanently pinned over the node's own style even after the
        // animation finishes — which silently defeats usePointerReorder's
        // later `node.style.transform` writes during a drag. "backwards"
        // only fills the pre-start delay and releases everything once done.
        ...(stagger !== null
          ? {
              animation: "db-menu .28s backwards",
              animationDelay: `${Math.min(stagger * 25, 300)}ms`,
            }
          : null),
        // Held tiles lift off the board and stop animating their own box, so
        // the pointer transform is the only thing moving them. `scale` is a
        // separate CSS property from `transform`, which usePointerReorder sets
        // imperatively on this same node for the drag translation — using it
        // here means the lift can't ever clobber that positioning.
        ...(dragging
          ? {
              boxShadow: "0 26px 60px rgba(0,0,0,.42)",
              cursor: "grabbing",
              opacity: 0.97,
              scale: "1.02",
            }
          : null),
      }}
      {...hoverBind}
      // No longer the board's drag start (see DragHandle) — a long hold here
      // enters edit mode instead, and does nothing once already editing.
      onPointerDown={onLongPressDown}
      onClick={onOpen}
      onContextMenu={onMenu}
      // Focusable so keyboard users can reach a tile and open it with Enter,
      // and so the ContextMenu key targets the tile rather than the page.
      // The guard keeps Enter inside a widget's own inputs from zooming.
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      role="group"
      aria-label={manifest.name}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flex: "none",
          // With nothing to show and no chrome open, the row gives its height
          // back to the widget rather than sitting there empty — hiding a label
          // should buy space, not just blank it. Transitioned so the content
          // rises into the gap instead of jumping.
          maxHeight: headerHidden ? 0 : TILE_HEADER.max,
          marginBottom: headerHidden ? 0 : `${TILE_HEADER.gap}px`,
          opacity: headerHidden ? 0 : 1,
          overflow: "hidden",
          transition:
            "max-height .3s cubic-bezier(.22,1,.36,1), margin-bottom .3s cubic-bezier(.22,1,.36,1), opacity .2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {/* Appear rather than a ternary: it unmounts when closed, so the
              space is genuinely returned, and it fades both ways. */}
          <Appear open={showIcon} style={{ display: "flex", flex: "none" }}>
            <div style={mark(seedFor(typeOf(instanceId)), 14)} />
          </Appear>
          <Appear open={showName} style={{ minWidth: 0 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--faint)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {manifest.name}
            </span>
          </Appear>
        </div>

        <div style={{ display: "flex", gap: "6px", flex: "none" }}>
          {/* Appear rather than a ternary so this chrome leaves the way it
              arrived instead of blinking out. */}
          <Appear open={!!focused} style={{ display: "flex", gap: "6px" }}>
            <>
              <TileButton
                label="Widget settings"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings?.();
                }}
              >
                <LuSettings2 size={12} />
                <span>Settings</span>
              </TileButton>
              <TileButton
                label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                style={{ padding: "5px 7px" }}
              >
                <LuX size={13} />
              </TileButton>
            </>
          </Appear>
        </div>
      </div>

      {/* Edit-mode chrome floats above the tile instead of sitting in the
          header row. In the flow it stole width from the widget's own header and
          nudged its content sideways, and entering edit mode must not reflow
          what a widget is showing. */}
      <Appear
        open={!!editing}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 3,
          display: "flex",
          gap: "6px",
        }}
      >
        <>
          {manifest.sizes.length > 1 ? (
            <TileButton
              label="Resize"
              onClick={(e) => {
                e.stopPropagation();
                onResize?.();
              }}
              style={{ fontFamily: MONO, fontSize: "10px", padding: "3px 7px" }}
            >
              {size.join("×")}
            </TileButton>
          ) : null}
          <TileButton
            label="Widget settings"
            onClick={(e) => {
              e.stopPropagation();
              onSettings?.();
            }}
            style={{ padding: "4px 6px" }}
          >
            <LuSettings2 size={12} />
          </TileButton>
          <TileButton
            label={`Remove ${manifest.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            style={{ padding: "4px 6px" }}
          >
            <LuX size={12} />
          </TileButton>
        </>
      </Appear>

      <DragHandle
        tourFirst={tourFirst}
        tileHovered={tileHovered}
        editing={!!editing}
        dragging={dragging}
        onPointerDown={(e) => onPointerDown?.(e, rootRef.current)}
      />

      {/* A crashing widget shows a retry inside its own tile rather than
          taking down the board. */}
      <ErrorBoundary compact label={manifest.name}>
        <Suspense fallback={<div style={{ flex: 1 }} />}>
          <Widget
            id={instanceId}
            size={size}
            columns={columns}
            options={options}
            config={config}
            focused={focused}
            // A widget's own add and edit controls belong on screen whenever
            // its settings are open: the drawer is where you go to change the
            // thing, and having to also put the board into edit mode to reach
            // "Add a location" is a second gesture for one intention.
            editing={editing || panelTarget}
            // Whether the tile is showing any chrome of its own. A widget that
            // is essentially one large drawing uses this to become the tile
            // rather than sitting inside it.
            bare={headerHidden}
            refreshKey={refreshKey}
            setConfig={setConfig}
            setOptions={setOptions}
            toast={toast}
            openSettings={onSettings}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default Tile;
