import { useMemo, useRef } from "react";
import { cameraStyle } from "../core/tileStyle";
import { useFlip } from "../core/useFlip";
import { usePointerReorder } from "../core/usePointerReorder";
import { resolveOptions, resolveSize } from "../widgets/registry";
import Tile from "./Tile";

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

  const { draggingId, onPointerDown } = usePointerReorder({
    ids,
    onReorder,
    enabled: editing,
    containerRef: gridRef,
  });

  // Animate every layout change: reorder, resize, add, remove, preset switch.
  // The held tile is skipped because it is being positioned by the pointer.
  useFlip(gridRef, [ids.join("|"), JSON.stringify(board.sizes), columns, appearance.gap], {
    skipId: draggingId,
  });

  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridAutoRows: "96px",
      gridAutoFlow: "row dense",
      gap: `${appearance.gap}px`,
      maxWidth: "1560px",
      margin: "0 auto",
    }),
    [appearance.gap, columns]
  );

  return (
    <div
      style={{ position: "relative", flex: 1, padding: "0 28px 80px", overflowX: "clip" }}
      onContextMenu={onBoardMenu}
    >
      <div ref={boardRef} style={cameraStyle(cam, !!zoom && zoomMode === "Camera")}>
        <div ref={gridRef} style={gridStyle}>
          {ids.map((instanceId) => (
            <Tile
              key={instanceId}
              instanceId={instanceId}
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
              rate={widgets[instanceId]?.rate}
              manualRefresh={manualRefresh[instanceId] || 0}
              tileRef={(el) => registerTile(instanceId, el)}
              onOpen={() => onOpenTile(instanceId)}
              onMenu={(e) => onTileMenu(e, instanceId)}
              onSettings={() => onOpenSettings(instanceId)}
              onClose={onCloseZoom}
              onResize={() => onResize(instanceId)}
              onRemove={() => onRemove(instanceId)}
              onPointerDown={(e) => onPointerDown(e, instanceId)}
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
