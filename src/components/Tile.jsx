import { Suspense, lazy, useMemo, useRef } from "react";
import { LuSettings2, LuX } from "react-icons/lu";
import { Appear, mark, MONO, seedFor, useHover, useLongPress, useRefresh } from "@daybreak/sdk";
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
// Only interactive during edit mode — outside it, hovering the tile shows
// where the handle is without inviting a press that would not do anything.
function DragHandle({ tileHovered, editing, dragging, onPointerDown }) {
  return (
    <div
      onPointerDown={editing ? onPointerDown : undefined}
      title="Drag to move"
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        translate: "-50% 0",
        width: 36,
        height: 4,
        borderRadius: 999,
        background: "var(--line)",
        cursor: dragging ? "grabbing" : "grab",
        pointerEvents: editing ? "auto" : "none",
        opacity: editing ? 1 : tileHovered ? 0.5 : 0,
        transition: "opacity .15s ease",
      }}
    />
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
  return (
    <button
      type="button"
      title={label}
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
        e.currentTarget.style.background = "var(--accentSoft)";
        e.currentTarget.style.borderColor = "var(--accentLine)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--panel2)";
        e.currentTarget.style.borderColor = "var(--line)";
      }}
    >
      {children}
    </button>
  );
}

function Tile({
  instanceId,
  appearance,
  columns,
  size,
  options,
  config,
  editing,
  zoomed,
  focused,
  zoomMode,
  panelOpen,
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
      }),
    [appearance, size, columns, editing, menuTarget, zoomed, focused, zoomMode, panelOpen]
  );

  if (!manifest) return null;
  const Widget = lazyFor(manifest);

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        tileRef?.(el);
      }}
      // FLIP identifies tiles by this across reorders and resizes.
      data-flip-id={instanceId}
      style={{
        ...style,
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
          marginBottom: "12px",
          gap: "8px",
          flex: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={mark(seedFor(typeOf(instanceId)), 14)} />
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
            }}
          >
            {manifest.name}
          </span>
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
            editing={editing}
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
