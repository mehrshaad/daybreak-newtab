import { useRef, useState } from "react";
import { LuGripVertical, LuPlus, LuX } from "react-icons/lu";
import { Appear, Button, CitySearch, EditableText, LIST_ROW_HIGHLIGHT, MONO, listRow, moveItem, useFlip, useMinutes, usePointerReorder } from "@daybreak/sdk";
import { MAX_ZONES, zoneParts } from "./zones";

const DEFAULT_ZONES = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
];

// Rows are identified by city+zone rather than by index, because an index would
// change under a reorder and the drag needs a stable id.
const keyFor = (zone) => `${zone.tz}|${zone.city}`;

function WorldClocks({ options, config, setConfig, size, editing }) {
  const { hour24, showZone, textSize } = options;
  const now = useMinutes();
  const [adding, setAdding] = useState(false);
  const listRef = useRef(null);

  const zones =
    Array.isArray(config.zones) && config.zones.length
      ? config.zones.slice(0, MAX_ZONES)
      : DEFAULT_ZONES;

  const ids = zones.map(keyFor);
  // A three-row tile has room for a larger readout; a two-row one does not.
  //
  // This used to gate the UTC offset as well, on the grounds that there was
  // "room for the timezone under each city" only on a tall tile. There is no
  // under: the offset sits beside the name in the same flex row and costs no
  // height at all, and the name truncates before either of them is squeezed.
  // So the offset was hidden on every two-row tile whatever the setting said,
  // which made the setting look broken.
  const tall = (size?.[1] ?? 2) >= 3;

  // Two text sizes, and "regular" is exactly what was here before, so nobody's
  // board changes by updating. Everything in a row scales together — the city,
  // the time, the offset and the day marker — because they are one line of
  // information and a row with only its time enlarged reads as unbalanced.
  const big = textSize === "large";
  const type = {
    city: big ? 16 : 13,
    // +2 and not +4. At +4 four cities at this size wanted 154px of a 146px
    // tile, and the answer to that was a scroller on the list — which turned
    // the list into a scroll container, which is a clipping context, which is
    // the thing a row being dragged has to escape. Two pixels of type is a
    // much cheaper price than owning that interaction.
    time: (tall ? 19 : 15) + (big ? 2 : 0),
    small: big ? 12 : 10,
  };

  // The type grows into the new size rather than snapping, like everything else
  // that changes on this page.
  //
  // On the spans and not on the row: the rows are what useFlip animates when
  // the list is reordered, and FLIP works by setting a transform and letting it
  // run to none. A transform transition on the same element fights that, and a
  // blanket `transition: all` here would add one. Font size on the text inside
  // is a different property on a different element, so the two never meet.
  const TYPE_TRANSITION = "font-size .2s cubic-bezier(.2,.8,.2,1)";

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

  // Renames the label only — the timezone stays what the geocoder resolved,
  // so "New York" can become "NYC" without breaking the clock underneath it.
  const renameZone = (index, city) =>
    setConfig({ zones: zones.map((z, i) => (i === index ? { ...z, city } : z)) });

  if (adding) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <CitySearch autoFocus onPick={addZone} placeholder="Add a city…" />
        <Button
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
          hover={{ background: "var(--panel2)", color: "var(--fg)" }}
        >
          Cancel
        </Button>
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
          // No scroller here, deliberately. One went in to catch four cities at
          // the large text size overflowing by 8px, and it cost the drag: a
          // scroll container clips its children, so the row being carried was
          // clipped, and `overflow: visible` for the length of the drag both
          // fights the base value React has to remove afterwards and moves the
          // slots the drag measures against. The size came down instead, and
          // now nothing this widget can show overflows. See worldClockFit.
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
              // The board's own tile drag now starts from a handle rather than
              // the tile body, so this can no longer reach it either way — kept
              // as a second line of defense against a row press ever also
              // dragging the tile.
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDown(e, id);
              }}
              style={listRow({
                justifyContent: "space-between",
                // Daytime rows sit slightly proud; night rows recede.
                background: p.day ? LIST_ROW_HIGHLIGHT : "transparent",
                touchAction: "none",
                cursor: editing ? (held ? "grabbing" : "grab") : "default",
                zIndex: held ? 5 : undefined,
                filter: held ? "drop-shadow(0 12px 22px rgba(0,0,0,.4))" : "none",
              })}
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
                  {/* The handle sizes and eases with the type around it: it is
                      part of the row, and a fixed 12px pip beside 16px text
                      reads as something left behind. Its colour warms on the
                      way in as well, so it arrives rather than appears. */}
                  <LuGripVertical
                    size={big ? 15 : 12}
                    style={{
                      color: "var(--faint)",
                      transition: `${TYPE_TRANSITION}, color .2s ease, width .2s ease, height .2s ease`,
                    }}
                    aria-hidden="true"
                  />
                </Appear>
                <EditableText
                  value={p.city}
                  onCommit={(city) => renameZone(i, city)}
                  ariaLabel={`Rename ${p.city}`}
                  tooltip="Double-click to rename"
                  style={{
                    display: "block",
                    fontSize: type.city,
                    transition: TYPE_TRANSITION,
                    color: p.day ? "var(--fg)" : "var(--dim)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  inputStyle={{ fontSize: type.city, minWidth: 60 }}
                />
                {showZone && p.zoneLabel ? (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: type.small,
                      color: "var(--faint)",
                      transition: TYPE_TRANSITION,
                    }}
                  >
                    {p.zoneLabel}
                  </span>
                ) : null}
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}
              >
                {p.label ? (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: type.small,
                      color: "var(--faint)",
                      transition: TYPE_TRANSITION,
                    }}
                  >
                    {p.label}
                  </span>
                ) : null}
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: type.time,
                    transition: TYPE_TRANSITION,
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
                      borderRadius: 999,
                      transition: "color .15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--danger)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--faint)";
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

      {/* Only while arranging the board. Adding a city is a change to what the
          tile contains, not something done at a glance, and a resting tile reads
          better without a permanent invitation. Appear rather than a ternary so
          it leaves the way it arrived and hands its space back. */}
      {zones.length < MAX_ZONES ? (
        <Appear open={!!editing} style={{ alignSelf: "flex-start" }}>
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
            transition: "color .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--faint)";
          }}
        >
          <LuPlus size={12} /> Add a city
        </button>
        </Appear>
      ) : null}
    </div>
  );
}

export default WorldClocks;
