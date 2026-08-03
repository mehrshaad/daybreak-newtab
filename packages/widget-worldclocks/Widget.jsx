import { useRef, useState } from "react";
import { LuGripVertical, LuPlus, LuX } from "react-icons/lu";
import {
  Appear,
  CitySearch,
  MONO,
  moveItem,
  useFlip,
  useMinutes,
  usePointerReorder,
} from "@daybreak/sdk";
import { MAX_ZONES, zoneParts } from "./zones";

const DEFAULT_ZONES = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
];

// Rows are identified by city+zone rather than by index, because an index would
// change under a reorder and the drag needs a stable id.
const keyFor = (zone) => `${zone.tz}|${zone.city}`;

function WorldClocks({ options, config, setConfig, size, editing }) {
  const { hour24, hideZone } = options;
  const now = useMinutes();
  const [adding, setAdding] = useState(false);
  const listRef = useRef(null);

  const zones =
    Array.isArray(config.zones) && config.zones.length
      ? config.zones.slice(0, MAX_ZONES)
      : DEFAULT_ZONES;

  const ids = zones.map(keyFor);
  // A three-row tile has room for the timezone under each city and a larger
  // readout; a two-row one does not.
  const tall = (size?.[1] ?? 2) >= 3;

  const reorder = (from, to) => setConfig({ zones: moveItem(zones, from, to) });

  const { draggingId, onPointerDown } = usePointerReorder({
    ids,
    onReorder: reorder,
    enabled: editing,
    containerRef: listRef,
  });

  useFlip(listRef, [ids.join("|")], { skipId: draggingId });

  const addZone = (city) => {
    if (zones.length >= MAX_ZONES) return;
    setConfig({ zones: [...zones, { city: city.name, tz: city.timezone }] });
    setAdding(false);
  };

  const removeZone = (index) =>
    setConfig({ zones: zones.filter((_, i) => i !== index) });

  if (adding) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <CitySearch autoFocus onPick={addZone} placeholder="Add a city…" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAdding(false);
          }}
          style={{
            alignSelf: "flex-start",
            padding: "5px 11px",
            borderRadius: 999,
            fontSize: 11,
            cursor: "pointer",
            background: "transparent",
            border: "1px solid var(--line)",
            color: "var(--dim)",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      <div
        ref={listRef}
        // Lifts the list's stacking while a row is held, so the row paints above
        // its neighbours instead of being clipped by the tile.
        data-dragging={draggingId ? "true" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
          ...(draggingId
            ? { position: "relative", zIndex: 6, overflow: "visible" }
            : null),
        }}
      >
        {zones.map((zone, i) => {
          const p = zoneParts(now, zone, { hour24 });
          const id = keyFor(zone);
          const held = draggingId === id;
          return (
            <div
              key={id}
              data-flip-id={id}
              onPointerDown={(e) => onPointerDown(e, id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "5px 8px",
                margin: "0 -8px",
                borderRadius: 8,
                // Daytime rows sit slightly proud; night rows recede.
                background: p.day ? "var(--panel)" : "transparent",
                minWidth: 0,
                touchAction: "none",
                cursor: editing ? (held ? "grabbing" : "grab") : "default",
                zIndex: held ? 5 : undefined,
                filter: held ? "drop-shadow(0 12px 22px rgba(0,0,0,.4))" : "none",
                transition: "background .2s ease",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Appear open={editing} style={{ display: "flex", flex: "none" }}>
                  <LuGripVertical
                    size={12}
                    style={{ color: "var(--faint)" }}
                    aria-hidden="true"
                  />
                </Appear>
                <span
                  style={{
                    fontSize: 13,
                    color: p.day ? "var(--fg)" : "var(--dim)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.city}
                </span>
                {!hideZone && tall && p.zoneLabel ? (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
                    {p.zoneLabel}
                  </span>
                ) : null}
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}
              >
                {p.label ? (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
                    {p.label}
                  </span>
                ) : null}
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: tall ? 19 : 15,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--fg)",
                  }}
                >
                  {p.time}
                </span>
                <Appear open={editing} style={{ display: "flex", flex: "none" }}>
                  <button
                    type="button"
                    aria-label={`Remove ${p.city}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeZone(i);
                    }}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "var(--faint)",
                      cursor: "pointer",
                      padding: 0,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <LuX size={12} />
                  </button>
                </Appear>
              </div>
            </div>
          );
        })}
      </div>

      {zones.length < MAX_ZONES ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAdding(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginTop: 6,
            padding: "4px 8px",
            marginLeft: -8,
            borderRadius: 8,
            border: 0,
            background: "transparent",
            color: "var(--faint)",
            fontSize: 12,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          <LuPlus size={12} /> Add a city
        </button>
      ) : null}
    </div>
  );
}

export default WorldClocks;
