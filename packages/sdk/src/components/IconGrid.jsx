import { useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { useFlip } from "../useFlip";
import { usePointerReorder } from "../usePointerReorder";
import Appear from "./Appear";
import IconTile from "./IconTile";
import Popover from "./Popover";

// One icon, its own hover state and its own Popover anchor — a grid can't
// share one ref or one "which icon is hovered" flag across every item the
// way a single boolean would, once each icon can carry its own hover card.
function IconGridItem({
  item,
  iconSize,
  showLabels,
  held,
  anyDragging,
  onOpen,
  onPointerDown,
  editing,
  onRemove,
  hoverCard,
}) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <button
        ref={ref}
        type="button"
        data-flip-id={item.key}
        title={item.title || item.name}
        // Second line of defense, matching World Clocks' rows: the
        // board's own tile drag now starts from a handle rather than the
        // tile body, so a press here can no longer reach it either way.
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, item.key);
        }}
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
          // Positioned so z-index actually applies: the button used to be a
          // grid item (where z-index works bare), but the wrapper div that
          // carries the remove badge made it a plain block child — leaving
          // both this and usePointerReorder's imperative lift inert, and the
          // held icon painting under its later siblings.
          position: "relative",
          zIndex: held ? 5 : undefined,
          filter: held ? "drop-shadow(0 12px 22px rgba(0,0,0,.4))" : "none",
          transition: "background .16s ease",
        }}
        onMouseEnter={(e) => {
          if (held) return;
          e.currentTarget.style.background = "var(--panel2)";
          if (!anyDragging) setHovered(true);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          setHovered(false);
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

      {onRemove ? (
        <Appear open={!!editing} style={{ position: "absolute", top: -2, right: -2 }}>
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            title={`Remove ${item.name}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
            style={{
              display: "grid",
              placeItems: "center",
              width: 18,
              height: 18,
              padding: 0,
              borderRadius: 999,
              cursor: "pointer",
              background: "var(--sheet)",
              border: "1px solid var(--line)",
              color: "var(--danger)",
              boxShadow: "0 4px 10px rgba(0,0,0,.3)",
            }}
          >
            <LuX size={10} />
          </button>
        </Appear>
      ) : null}

      {hoverCard && !editing ? (
        <Popover open={hovered} anchorRef={ref} onClose={() => setHovered(false)} width={230}>
          {hoverCard(item)}
        </Popover>
      ) : null}
    </div>
  );
}

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
  editing = false,
  onRemove,
  hoverCard,
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
      // A drag lifts the whole grid's stacking so the held icon paints above
      // the tile chrome rather than being clipped or hidden behind it.
      data-dragging={draggingId ? "true" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap,
        flex: 1,
        alignContent: "center",
        justifyItems: "center",
        minWidth: 0,
        ...(draggingId ? { position: "relative", zIndex: 6, overflow: "visible" } : null),
      }}
    >
      {items.map((item) => (
        <IconGridItem
          key={item.key}
          item={item}
          iconSize={iconSize}
          showLabels={showLabels}
          held={draggingId === item.key}
          anyDragging={!!draggingId}
          onOpen={onOpen}
          onPointerDown={onPointerDown}
          editing={editing}
          onRemove={onRemove}
          hoverCard={hoverCard}
        />
      ))}
      {trailing}
    </div>
  );
}

export default IconGrid;
