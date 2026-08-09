import { useEffect, useMemo, useRef } from "react";
import { cameraStyle } from "../core/tileStyle";
import { GRID_GAP } from "../core/tokens";
import { useFlip, useLongPress, usePointerReorder } from "@daybreak/sdk";
import { resolveOptions, resolveRate, resolveSize } from "../widgets/registry";
import Tile from "./Tile";

// Presses that should never turn into "enter edit mode": any interactive
// control, and any tile — a tile's own long-press (attached to its root)
// already handles a press that lands on the tile itself, so without this the
// board's own timer would race it for no reason.
const IGNORE_FOR_BOARD_LONG_PRESS = "button, a, input, textarea, select, [data-flip-id]";

function Board({
  ids,
  columns,
  appearance,
  board,
  widgets,
  editing,
  zoom,
  cam,
  zoomMode,
  panelOpen,
  menu,
  manualRefresh,
  boardRef,
  registerTile,
  onEnterEditing,
  onBoardMenu,
  onOpenTile,
  onTileMenu,
  onOpenSettings,
  onCloseZoom,
  onResize,
  onRemove,
  onOpenStore,
  onReorder,
  setWidgetConfig,
  setWidgetOptions,
  toast,
}) {
  const gridRef = useRef(null);

  // Settings resolve before this component ever mounts (SettingsProvider
  // renders nothing until then), so whichever tiles are here on Board's own
  // first commit are exactly "the board popping in all at once" — the case
  // that wants a staggered entrance. Anything added afterward already gets a
  // smooth arrival from useFlip's own new-item handling, so it's excluded
  // here rather than double-animated.
  const isInitialRef = useRef(true);
  useEffect(() => {
    isInitialRef.current = false;
  }, []);

  const { draggingId, slotRect, onPointerDown } = usePointerReorder({
    ids,
    onReorder,
    // Not gated on edit mode: a tile can be rearranged straight from the
    // board, without the resize pills and remove buttons appearing first.
    // Safe to leave open because the board offers no drop-to-delete — the
    // worst a stray drag can do is move a tile, which is visible and
    // trivially undone by moving it back.
    enabled: true,
    containerRef: gridRef,
  });

  // Holding empty board space — the gaps between tiles, or the padding around
  // the grid — is the other place TODO 27 asks for a long-press entry into
  // edit mode, alongside a tile's own body.
  const onEmptyLongPress = useLongPress(() => onEnterEditing?.(), {
    enabled: !editing,
    ignoreSelector: IGNORE_FOR_BOARD_LONG_PRESS,
  });

  // Animate every layout change: reorder, resize, add, remove, preset switch.
  // The held tile is skipped because it is being positioned by the pointer.
  useFlip(gridRef, [ids.join("|"), JSON.stringify(board.sizes), columns], {
    skipId: draggingId,
  });

  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridAutoRows: "96px",
      gridAutoFlow: "row dense",
      gap: `${GRID_GAP}px`,
      maxWidth: "1560px",
      margin: "0 auto",
    }),
    [columns]
  );

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        padding: "0 28px 80px",
        // Clipping keeps a zoomed board from widening the page, but it would
        // also cut off a tile dragged past the edge.
        overflowX: draggingId ? "visible" : "clip",
      }}
      onContextMenu={onBoardMenu}
      onPointerDown={onEmptyLongPress}
    >
      {/* Where the held tile would land. The reorder is already committed as
          the tile moves, so the gap it leaves behind *is* the destination —
          this just outlines it, the same dashed box as "+ Add widget" with
          nothing written in it. Transitioned rather than jumped, so it slides
          between slots with the neighbours it is moving through. */}
      {slotRect ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: slotRect.left,
            top: slotRect.top,
            width: slotRect.width,
            height: slotRect.height,
            borderRadius: `${appearance.radius}px`,
            border: "1.5px dashed var(--line)",
            pointerEvents: "none",
            zIndex: 1,
            transition:
              "left .22s cubic-bezier(.2,.8,.2,1), top .22s cubic-bezier(.2,.8,.2,1)," +
              " width .22s cubic-bezier(.2,.8,.2,1), height .22s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      ) : null}

      <div ref={boardRef} style={cameraStyle(cam, !!zoom && zoomMode === "Camera")}>
        <div ref={gridRef} style={gridStyle}>
          {ids.map((instanceId, index) => (
            <Tile
              key={instanceId}
              instanceId={instanceId}
              initialStagger={isInitialRef.current ? index : null}
              appearance={appearance}
              columns={columns}
              size={resolveSize(instanceId, board.sizes)}
              options={resolveOptions(instanceId, widgets[instanceId]?.options)}
              config={widgets[instanceId]?.config || {}}
              editing={editing}
              dragging={draggingId === instanceId}
              zoomed={!!zoom}
              focused={zoom === instanceId}
              zoomMode={zoomMode}
              panelOpen={panelOpen}
              menuTarget={menu?.id === instanceId}
              rate={resolveRate(instanceId, widgets[instanceId]?.rate)}
              manualRefresh={manualRefresh[instanceId] || 0}
              tileRef={(el) => registerTile(instanceId, el)}
              onEnterEditing={onEnterEditing}
              onOpen={() => onOpenTile(instanceId)}
              onMenu={(e) => onTileMenu(e, instanceId)}
              onSettings={() => onOpenSettings(instanceId)}
              onClose={onCloseZoom}
              onResize={() => onResize(instanceId)}
              onRemove={() => onRemove(instanceId)}
              // The handle is what receives the pointerdown; the tile itself
              // is what has to move, so Tile passes its own node through.
              onPointerDown={(e, node) => onPointerDown(e, instanceId, node)}
              setConfig={(patch) => setWidgetConfig(instanceId, patch)}
              setOptions={(patch) => setWidgetOptions(instanceId, patch)}
              toast={toast}
            />
          ))}

          {editing ? (
            <button
              type="button"
              onClick={onOpenStore}
              style={{
                gridColumn: `span ${Math.min(3, columns)}`,
                gridRow: "span 2",
                borderRadius: `${appearance.radius}px`,
                border: "1.5px dashed var(--line)",
                background: "transparent",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--faint)",
                fontSize: "13px",
                transition: "border-color .2s, color .2s",
                // Fades in with the rest of the edit-mode chrome. It cannot
                // fade out — it is a grid item, and holding it past the mode
                // would leave a gap in the board.
                animation: "db-menu .22s ease both",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.color = "var(--faint)";
              }}
            >
              + Add widget
            </button>
          ) : null}
        </div>
      </div>

      {ids.length === 0 && !editing ? (
        <div
          style={{
            maxWidth: 1560,
            margin: "0 auto",
            padding: "80px 0",
            textAlign: "center",
            color: "var(--faint)",
            fontSize: 14,
          }}
        >
          <p style={{ margin: "0 0 16px" }}>Your board is empty.</p>
          <button
            type="button"
            onClick={onOpenStore}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: "var(--accent)",
              color: "var(--onAccent)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Add a widget
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Board;
