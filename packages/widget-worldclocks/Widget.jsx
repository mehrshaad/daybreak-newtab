import { useState } from "react";
import { LuPlus, LuX } from "react-icons/lu";
import { CitySearch, MONO, useMinutes } from "@daybreak/sdk";
import { MAX_ZONES, shortZone, zoneParts } from "./zones";

const DEFAULT_ZONES = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
];

function WorldClocks({ options, config, setConfig, focused, editing }) {
  const { hour24, hideZone } = options;
  const now = useMinutes();
  const [adding, setAdding] = useState(false);

  const zones = Array.isArray(config.zones) && config.zones.length
    ? config.zones.slice(0, MAX_ZONES)
    : DEFAULT_ZONES;

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
        gap: 2,
        flex: 1,
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      {zones.map((zone, i) => {
        const p = zoneParts(now, zone, { hour24 });
        return (
          <div
            key={`${zone.tz}-${zone.city}-${i}`}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              padding: "5px 8px",
              margin: "0 -8px",
              borderRadius: 8,
              // Daytime rows sit slightly proud; night rows recede.
              background: p.day ? "var(--panel)" : "transparent",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
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
              {!hideZone && focused ? (
                <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
                  {shortZone(p.tz)}
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flex: "none" }}>
              {p.label ? (
                <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
                  {p.label}
                </span>
              ) : null}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: focused ? 22 : 15,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--fg)",
                }}
              >
                {p.time}
              </span>
              {editing || focused ? (
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
              ) : null}
            </div>
          </div>
        );
      })}

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
