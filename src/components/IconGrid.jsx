import { useRef } from "react";
import { useFlip } from "../core/useFlip";
import { usePointerReorder } from "../core/usePointerReorder";
import IconTile from "./IconTile";

// A grid of app-style icons that fills its tile and can be reordered by
// dragging an icon. Shares the board's drag and FLIP machinery, so an icon
// behaves like a tile: it follows the pointer and its neighbours shuffle
// underneath in realtime.
function IconGrid({
  items,
  cols,
  iconSize,
  showLabels = true,
  gap = 6,
  onOpen,
  onReorder,
  reorderable = true,
  trailing = null,
}) {
  const gridRef = useRef(null);
  const ids = items.map((i) => i.key);

  const { draggingId, onPointerDown } = usePointerReorder({
    ids,
    onReorder,
    enabled: reorderable && !!onReorder,
    containerRef: gridRef,
  });

  useFlip(gridRef, [ids.join("|"), cols, iconSize], { skipId: draggingId });

  return (
    <div
      ref={gridRef}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap,
        flex: 1,
        alignContent: "center",
        justifyItems: "center",
        minWidth: 0,
      }}
    >
      {items.map((item) => {
        const held = draggingId === item.key;
        return (
          <button
            key={item.key}
            type="button"
            data-flip-id={item.key}
            title={item.title || item.name}
            onPointerDown={(e) => onPointerDown(e, item.key)}
            onClick={() => !held && onOpen?.(item)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: Math.max(4, Math.round(iconSize * 0.16)),
              padding: `${Math.max(4, Math.round(iconSize * 0.16))}px 2px`,
              borderRadius: 12,
              border: 0,
              background: "transparent",
              cursor: held ? "grabbing" : "pointer",
              width: "100%",
              minWidth: 0,
              touchAction: "none",
              zIndex: held ? 5 : undefined,
              filter: held ? "drop-shadow(0 12px 22px rgba(0,0,0,.4))" : "none",
              transition: "background .16s ease",
            }}
            onMouseEnter={(e) => {
              if (!held) e.currentTarget.style.background = "var(--panel2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <IconTile name={item.iconName || item.key || item.name} size={iconSize} />
            {showLabels ? (
              <span
                style={{
                  fontSize: Math.max(9, Math.round(iconSize * 0.3)),
                  color: "var(--dim)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {item.name}
              </span>
            ) : null}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}

export default IconGrid;
