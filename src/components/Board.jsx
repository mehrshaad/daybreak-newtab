import { useEffect, useMemo, useRef } from "react";
import { usedColumns } from "../core/autoArrange";
import { cameraStyle } from "../core/tileStyle";
import { boardMaxWidth } from "../core/useColumns";
import { GRID_GAP, ROW_HEIGHT } from "../core/tokens";
import { useFlip, useLongPress, usePointerReorder } from "@daybreak/sdk";
import { resolveOptions, resolveRate, resolveSize } from "../widgets/registry";
import Tile from "./Tile";
import { Button } from "./primitives";

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
  panelId,
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

  // How many of the grid's columns the arrangement actually reaches. A board
  // whose widest row comes to eleven of twelve leaves a dead strip a full
  // column wide down its right-hand side, on every row.
  const used = usedColumns(ids, board.sizes, columns);

  const gridStyle = useMemo(
    () => ({
      display: "grid",
      // The tracks that are actually occupied, not all twelve. Narrowing the
      // grid rather than keeping empty tracks is what lets `margin: 0 auto`
      // below split the leftover space between both margins instead of piling
      // it all on the right.
      gridTemplateColumns: `repeat(${used}, 1fr)`,
      gridAutoRows: `${ROW_HEIGHT}px`,
      gridAutoFlow: "row dense",
      gap: `${GRID_GAP}px`,
      // The width those tracks would have had inside the full grid, so tiles
      // stay exactly the size they were and only the empty column goes. Worked
      // out from the wrapper's own width in CSS rather than in pixels here, so
      // it keeps following the window and the board-width setting. With
      // `used === columns` it reduces to 100% and nothing moves.
      width: `calc((100% - ${GRID_GAP * (columns - 1)}px) / ${columns} * ${used} + ${
        GRID_GAP * (used - 1)
      }px)`,
      margin: "0 auto",
      // Transitioned so changing the setting slides the board out rather than
      // snapping. The grid tracks are 1fr, so they follow the cap continuously.
      transition: "width .34s cubic-bezier(.22,1,.36,1)",
    }),
    [columns, used]
  );

  // The capped, centred area the grid centres itself within. It used to be the
  // grid itself, but the grid is now narrower than the cap whenever the board
  // does not fill it, and the percentage above has to resolve against the full
  // board width rather than against the shortened one.
  const boardArea = useMemo(
    () => ({
      maxWidth: boardMaxWidth(appearance.boardWidth),
      margin: "0 auto",
      transition: "max-width .34s cubic-bezier(.22,1,.36,1)",
    }),
    [appearance.boardWidth]
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
        {/* Same marker the icon grids and the task list already use. Beyond
            the CSS that reads it, the performance check needs to know when
            something is genuinely happening: a still page renders almost
            nothing, and calling that "slow" would flag every machine there is.
            A tile drag is the heaviest thing the board does, so it is exactly
            the moment worth measuring. */}
        <div style={boardArea}>
        <div ref={gridRef} style={gridStyle} data-dragging={draggingId ? "true" : undefined}>
          {ids.map((instanceId, index) => (
            <Tile
              key={instanceId}
              instanceId={instanceId}
              // The tour points at the first tile, whichever it happens to be.
              tourFirst={index === 0}
              initialStagger={isInitialRef.current ? index : null}
              appearance={appearance}
              columns={columns}
              size={resolveSize(instanceId, board.sizes)}
              options={resolveOptions(instanceId, widgets[instanceId]?.options)}
              config={widgets[instanceId]?.config || {}}
              tint={widgets[instanceId]?.tint}
              editing={editing}
              dragging={draggingId === instanceId}
              zoomed={!!zoom}
              focused={zoom === instanceId}
              zoomMode={zoomMode}
              panelOpen={!!panelId}
              panelTarget={panelId === instanceId}
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
          <Button
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
            hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
          >
            Add a widget
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default Board;
