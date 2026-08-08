import { useMemo, useState } from "react";
import { IconGrid, MONO, moveItem } from "@daybreak/sdk";
import { gridFor, orderedApps } from "./apps";

function GoogleApps({ options, config, setConfig, size, editing, columns }) {
  const { hideLabels, newTab } = options;
  const [showAll, setShowAll] = useState(false);

  const hiddenKeys = Array.isArray(config.hidden) ? config.hidden : [];
  const apps = useMemo(() => {
    const hiddenSet = new Set(Array.isArray(config.hidden) ? config.hidden : []);
    return orderedApps(config.order).filter((a) => !hiddenSet.has(a.key));
  }, [config.order, config.hidden]);
  const { cols, rows } = gridFor(size, columns);

  // Fill a whole grid for this size and hide the remainder rather than
  // overflowing the tile or shrinking icons until they are unreadable. Bigger
  // tiles simply show more, which is why this widget offers large sizes.
  const capacity = cols * rows;
  const needsMore = apps.length > capacity;
  const visible = showAll ? apps : apps.slice(0, needsMore ? capacity - 1 : capacity);
  const hidden = apps.length - visible.length;

  // Icon size follows how much room each cell actually gets.
  const iconSize = Math.max(22, Math.min(44, Math.round(150 / cols) + (rows > 3 ? 4 : 0)));

  const open = (app) => {
    if (editing) return;
    if (newTab) window.open(app.url, "_blank", "noopener,noreferrer");
    else window.location.href = app.url;
  };

  return (
    <div
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
        gap={6}
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
