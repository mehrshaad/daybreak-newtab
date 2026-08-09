import { useEffect, useMemo, useRef, useState } from "react";
import { IconGrid, iconCellSize, MONO, moveItem } from "@daybreak/sdk";
import { gridFor, orderedApps } from "./apps";

function GoogleApps({ options, config, setConfig, size, editing, columns }) {
  const { hideLabels, newTab } = options;
  const [showAll, setShowAll] = useState(false);
  const wrapRef = useRef(null);
  // Real pixel box of the tile, not the board-grid-unit estimate gridFor
  // makes — IconGrid lays icons out with `auto-fit`, sizing however many
  // fixed-width cells actually fit the current width, so a capacity computed
  // from gridFor's guess can under- or overshoot what auto-fit renders. That
  // mismatch is exactly what silently clipped icons with no scrollbar to
  // reach them: capacity said N would fit, auto-fit fit fewer per row, and
  // the leftover wrapped into a row past the tile's own height.
  const [box, setBox] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hiddenKeys = Array.isArray(config.hidden) ? config.hidden : [];
  const apps = useMemo(() => {
    const hiddenSet = new Set(Array.isArray(config.hidden) ? config.hidden : []);
    return orderedApps(config.order).filter((a) => !hiddenSet.has(a.key));
  }, [config.order, config.hidden]);
  const { cols, rows } = gridFor(size, columns);

  // Icon size follows how much room each cell actually gets.
  const baseIconSize = Math.max(22, Math.min(44, Math.round(150 / cols) + (rows > 3 ? 4 : 0)));
  // Without a label underneath, that row of vertical space is otherwise just
  // left empty rather than going back into the icon itself.
  const iconSize = hideLabels ? Math.round(baseIconSize * 1.3) : baseIconSize;
  const gap = Math.max(4, Math.round(iconSize * 0.16));
  const cell = iconCellSize(iconSize, !hideLabels);

  // The "+N more" row shares this same flex column with the grid, so once it
  // appears the grid actually has less height than the tile's full box.
  // Reserving that up front would crop nothing, but would also waste real
  // rows whenever nothing ends up hidden — most of the time. Try the full
  // height first, and only fall back to the reserved figure if that count
  // would actually need the button. The figure itself is the button's own
  // rendered box (17px, fontSize 10 / padding "2px 8px") plus its 4px
  // marginTop — measured directly rather than estimated, since `floor()`
  // a few lines down turns a couple of guessed pixels into a whole missing
  // row.
  const MORE_ROW_SPACE = 21;

  // Before the first measurement lands, fall back to gridFor's estimate
  // rather than showing nothing. Once real dimensions are in, they are what
  // auto-fit will actually do with this width, so capacity always matches
  // what gets rendered.
  const fitCols = box ? Math.max(1, Math.floor((box.width + gap) / (cell.width + gap))) : cols;
  const rowsFor = (height) => Math.max(1, Math.floor((height + gap) / (cell.height + gap)));
  const fitRowsFull = box ? rowsFor(box.height) : rows;
  const fitRows =
    box && apps.length > fitCols * fitRowsFull
      ? rowsFor(Math.max(0, box.height - MORE_ROW_SPACE))
      : fitRowsFull;

  // Fill a whole grid for this size and hide the remainder rather than
  // overflowing the tile or shrinking icons until they are unreadable. Bigger
  // tiles simply show more, which is why this widget offers large sizes.
  const capacity = fitCols * fitRows;
  const needsMore = apps.length > capacity;
  const visible = showAll ? apps : apps.slice(0, needsMore ? capacity - 1 : capacity);
  const hidden = apps.length - visible.length;

  const open = (app) => {
    if (editing) return;
    if (newTab) window.open(app.url, "_blank", "noopener,noreferrer");
    else window.location.href = app.url;
  };

  return (
    <div
      ref={wrapRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: showAll ? "auto" : "hidden",
      }}
    >
      <IconGrid
        items={visible}
        cols={cols}
        iconSize={iconSize}
        // Matches the icon-to-label gap inside each item, so horizontal and
        // vertical rhythm read as the same spacing scaled by icon size.
        gap={gap}
        showLabels={!hideLabels}
        onOpen={open}
        onReorder={(from, to) =>
          setConfig({ order: moveItem(apps.map((a) => a.key), from, to) })
        }
        onRemoveByDrag={(app) => setConfig({ hidden: [...hiddenKeys, app.key] })}
      />

      {hidden > 0 || showAll ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll((v) => !v);
          }}
          style={{
            marginTop: 4,
            alignSelf: "center",
            border: 0,
            background: "transparent",
            color: "var(--faint)",
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".08em",
            cursor: "pointer",
            padding: "2px 8px",
            flex: "none",
          }}
        >
          {showAll ? "show less" : `+${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}

export default GoogleApps;
