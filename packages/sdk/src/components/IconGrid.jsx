import { useRef } from "react";
import { LuX } from "react-icons/lu";
import { ICON_GRID_PAD, iconCellSize } from "../iconCellSize";
import { useFlip } from "../useFlip";
import { usePointerReorder } from "../usePointerReorder";
import { useHover } from "../useHover";
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
  // Every measurement of the cell from one place, so this button and the
  // callers that predict its size cannot drift apart.
  const { pad, labelGap, fontSize } = iconCellSize(iconSize, showLabels);
  // Hover as state rather than a background written straight onto the node.
  // The imperative form could not be undone once its mouseleave went missing,
  // and in a grid that reorders under the pointer it went missing often: an
  // icon that had been passed over kept its highlight until it was hovered
  // again. useHover closes itself (see usePointerExit), and a render driven by
  // state is a render that cannot disagree with what the node currently says.
  const [hovered, bind] = useHover();
  // The hover card already covers this, so the tooltip only applies where
  // there is no card to duplicate.
  const tip = useTooltip(hoverCard ? null : item.title || item.name);
  // A card is a deliberate reveal, so it stays out of the way of the two
  // things that are not one: a grid mid-drag, and the icon being carried.
  const cardOpen = hovered && !anyDragging && !held;

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
          gap: labelGap,
          padding: `${pad}px 2px`,
          borderRadius: 12,
          border: 0,
          cursor: held ? "grabbing" : "pointer",
          width: "100%",
          minWidth: 0,
          touchAction: "none",
          // Dragged past the grid's edge, the icon reads as "release to
          // remove" instead of "still reordering".
          opacity: danger ? 0.4 : 1,
          background: hovered && !held ? "var(--panel2)" : "transparent",
          boxShadow: danger ? "0 0 0 2px var(--danger)" : "none",
          transition: "background .16s ease, opacity .16s ease, box-shadow .16s ease",
        }}
        onMouseEnter={(e) => {
          tip.anchorProps.onMouseEnter?.();
          bind.onMouseEnter(e);
        }}
        onMouseLeave={() => {
          tip.anchorProps.onMouseLeave?.();
          bind.onMouseLeave();
        }}
      >
        <IconTile
          name={item.iconName || item.key || item.name}
          url={item.iconUrl}
          size={iconSize}
        />
        {showLabels ? (
          <span
            style={{
              fontSize,
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
          open={cardOpen}
          anchorRef={ref}
          onClose={bind.onMouseLeave}
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
          e.currentTarget.style.background = "var(--sheetHover)";
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
  gap,
  onOpen,
  onReorder,
  reorderable = true,
  editing = false,
  onRemove,
  onRemoveByDrag,
  hoverCard,
  scroll = false,
  trailing = null,
}) {
  const gridRef = useRef(null);
  const ids = items.map((i) => i.key);
  // Every column the same fixed width, so an icon's footprint never depends
  // on how long its own label happens to be — a short "Gmail" and a long
  // truncated name read as the same size tile, the way an icon grid should.
  // Wide enough for a typical short label; a `max-content` column would
  // instead size itself per row from whatever occupied it, drifting wider or
  // narrower depending on which label landed in which column.
  const { width: cellWidth, gap: cellGap } = iconCellSize(iconSize, showLabels);
  // A caller may still pin it, but none needs to: the default now scales with
  // the icon the same way the cell does.
  const gridGap = gap ?? cellGap;

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

  useFlip(gridRef, [ids.join("|"), cols, iconSize, showLabels], { skipId: draggingId });

  return (
    <div
      ref={gridRef}
      // A drag lifts the whole grid's stacking so the held icon paints above
      // the tile chrome rather than being clipped or hidden behind it.
      data-dragging={draggingId ? "true" : undefined}
      style={{
        display: "grid",
        // `auto-fit`, not a fixed count of `cols`: even columns evenly divided
        // the tile's full width regardless of how wide the icons actually
        // were, so the leftover space inside each column read as a much
        // bigger gap than the `gap` below actually was. Fixed-width columns
        // fix that, but a fixed COUNT of them would just move the wasted
        // space to the tile's edges instead — `auto-fit` asks the browser how
        // many actually fit the current width and uses all of them, so a wide
        // tile with more icons than `cols` shows more per row rather than
        // wrapping early with dead space on both sides. Collapses unused
        // trailing tracks to zero width (unlike `auto-fill`), which is what
        // lets `justifyContent` center a short row instead of centering
        // within a row's worth of empty columns.
        gridTemplateColumns: `repeat(auto-fit, ${cellWidth}px)`,
        justifyContent: "center",
        gap: gridGap,
        flex: 1,
        // `safe center` rather than plain `center` once this can scroll: a
        // centred grid that overflows spills equally in both directions, and
        // the part above the top edge cannot be scrolled back to. `safe` falls
        // back to start exactly when centring would do that.
        alignContent: scroll ? "safe center" : "center",
        minWidth: 0,
        ...(scroll
          ? {
              // A widget whose items the user chose — Quick Links — cannot hide
              // the overflow behind a "+N more" the way Google Apps does, so at
              // a large icon size a second row that did not fit was simply cut
              // off. minHeight is what lets a flex item shrink under its own
              // content, which is what makes this scroll rather than push the
              // tile open.
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
              padding: ICON_GRID_PAD,
            }
          : null),
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
