import { useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { useFlip } from "../useFlip";
import { usePointerReorder } from "../usePointerReorder";
import { useTooltip } from "../useTooltip";
import Appear from "./Appear";
import IconTile from "./IconTile";
import Popover from "./Popover";
import Tooltip from "./Tooltip";

// One icon, its own hover state and its own Popover anchor — a grid can't
// share one ref or one "which icon is hovered" flag across every item the
// way a single boolean would, once each icon can carry its own hover card.
function IconGridItem({
  item,
  iconSize,
  showLabels,
  held,
  danger,
  anyDragging,
  onOpen,
  onPointerDown,
  editing,
  onRemove,
  hoverCard,
}) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  // The hover card already covers this, so the tooltip only applies where
  // there is no card to duplicate.
  const tip = useTooltip(hoverCard ? null : item.title || item.name);

  return (
    // The grid's own child, so it is what carries `data-flip-id`. Both the
    // reorder hook and FLIP look for `:scope > [data-flip-id]` — direct
    // children only, so the board can't mistake an app icon for a tile — and
    // the marker used to sit on the button *inside* here, where neither query
    // could see it. Slot geometry came back empty, so an icon lifted and
    // followed the pointer but never actually reordered, and the icons it
    // passed never animated. It is also the node the drag translates, so the
    // remove badge travels with the icon instead of staying behind.
    <div
      ref={wrapRef}
      data-flip-id={item.key}
      style={{
        position: "relative",
        width: "100%",
        minWidth: 0,
        zIndex: held ? 5 : undefined,
        filter: held ? "drop-shadow(0 12px 22px rgba(0,0,0,.4))" : "none",
      }}
    >
      <button
        ref={(el) => {
          ref.current = el;
          tip.anchorRef.current = el;
        }}
        type="button"
        aria-label={item.name}
        // Second line of defense, matching World Clocks' rows: the
        // board's own tile drag now starts from a handle rather than the
        // tile body, so a press here can no longer reach it either way.
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, item.key, wrapRef.current);
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
          // Dragged past the grid's edge, the icon reads as "release to
          // remove" instead of "still reordering".
          opacity: danger ? 0.4 : 1,
          boxShadow: danger ? "0 0 0 2px var(--danger)" : "none",
          transition: "background .16s ease, opacity .16s ease, box-shadow .16s ease",
        }}
        onMouseEnter={(e) => {
          tip.anchorProps.onMouseEnter?.();
          if (held) return;
          e.currentTarget.style.background = "var(--panel2)";
          if (!anyDragging) setHovered(true);
        }}
        onMouseLeave={(e) => {
          tip.anchorProps.onMouseLeave?.();
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
      <Tooltip {...tip} />

      {onRemove ? (
        <Appear open={!!editing} style={{ position: "absolute", top: -2, right: -2 }}>
          <RemoveBadge label={`Remove ${item.name}`} onRemove={() => onRemove(item)} />
        </Appear>
      ) : null}

      {hoverCard && !editing ? (
        <Popover
          open={hovered}
          anchorRef={ref}
          onClose={() => setHovered(false)}
          placement="bottom-center"
          width={230}
        >
          {hoverCard(item)}
        </Popover>
      ) : null}
    </div>
  );
}

// Broken out so its own tooltip gets its own hover state, independent of the
// icon button's.
function RemoveBadge({ label, onRemove }) {
  const tip = useTooltip(label);
  return (
    <>
      <button
        ref={tip.anchorRef}
        type="button"
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
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
          transition: "background .15s ease",
        }}
        onMouseEnter={(e) => {
          tip.anchorProps.onMouseEnter?.();
          e.currentTarget.style.background = "var(--panel2)";
        }}
        onMouseLeave={(e) => {
          tip.anchorProps.onMouseLeave?.();
          e.currentTarget.style.background = "var(--sheet)";
        }}
        onFocus={tip.anchorProps.onFocus}
        onBlur={tip.anchorProps.onBlur}
      >
        <LuX size={10} />
      </button>
      <Tooltip {...tip} />
    </>
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
  onRemoveByDrag,
  hoverCard,
  trailing = null,
}) {
  const gridRef = useRef(null);
  const ids = items.map((i) => i.key);

  // Reordering is always available — an icon can be rearranged without first
  // entering edit mode. Dropping one *outside* the grid deletes it, though,
  // and that stays edit-mode only: outside edit mode there is no remove badge
  // and no undo, so a drag that strayed off the tile would silently destroy a
  // link the user only meant to move.
  const canRemoveByDrag = editing && !!onRemoveByDrag;
  const { draggingId, isOutside, onPointerDown } = usePointerReorder({
    ids,
    onReorder,
    onDropOutside: canRemoveByDrag
      ? (id) => onRemoveByDrag(items.find((i) => i.key === id))
      : undefined,
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
          // Only advertise "release to remove" where releasing actually would.
          danger={canRemoveByDrag && draggingId === item.key && isOutside}
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
