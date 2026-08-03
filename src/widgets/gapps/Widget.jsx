import { useMemo, useState } from "react";
import IconGrid from "../../components/IconGrid";
import { MONO } from "../../core/styles";
import { moveItem } from "../../core/usePointerReorder";
import { APPS, gridFor, orderedApps } from "./apps";

function GoogleApps({ options, config, setConfig, size, focused, editing, columns }) {
  const { hideLabels, newTab } = options;
  const [showAll, setShowAll] = useState(false);

  const apps = useMemo(() => orderedApps(config.order), [config.order]);
  const { cols, rows } = gridFor(size, focused, columns);

  // Fit a whole grid for this size and hide the remainder rather than
  // overflowing the tile or shrinking icons until they are unreadable.
  const capacity = cols * rows;
  const expanded = focused || showAll;
  const visible = expanded ? apps : apps.slice(0, Math.max(0, capacity - (apps.length > capacity ? 1 : 0)));
  const hidden = apps.length - visible.length;

  // Icon size scales with how much room each cell actually gets.
  const iconSize = focused
    ? 46
    : Math.max(20, Math.min(38, Math.round(120 / cols) + (size[1] >= 3 ? 6 : 0)));

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
        overflow: expanded ? "auto" : "hidden",
      }}
    >
      <IconGrid
        items={visible}
        cols={cols}
        iconSize={iconSize}
        gap={focused ? 10 : 6}
        showLabels={!hideLabels}
        onOpen={open}
        onReorder={(from, to) =>
          setConfig({ order: moveItem(apps.map((a) => a.key), from, to) })
        }
      />

      {hidden > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(true);
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
          }}
        >
          +{hidden} more
        </button>
      ) : null}

      {expanded && !focused && apps.length > capacity ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(false);
          }}
          style={{
            marginTop: 2,
            alignSelf: "center",
            border: 0,
            background: "transparent",
            color: "var(--faint)",
            fontFamily: MONO,
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          show less
        </button>
      ) : null}

      {focused ? (
        <div
          className="db-reveal"
          style={{
            marginTop: 10,
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 10,
            color: "var(--faint)",
          }}
        >
          {APPS.length} apps · drag an icon to reorder
        </div>
      ) : null}
    </div>
  );
}

export default GoogleApps;
