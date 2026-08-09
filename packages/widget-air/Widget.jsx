import { useEffect, useState } from "react";
import { CitySearch, MONO, useWidgetLocal } from "@daybreak/sdk";
import { aqiBand, aqiUrl, parseAirQuality } from "./aqi";

function Air({ id, config, setConfig, refreshKey, size }) {
  const city = config.city;
  // Cache the last good reading so a refresh (or being offline) shows the
  // previous numbers instead of a spinner.
  const [cached, setCached] = useWidgetLocal(id, "last", null);
  const [status, setStatus] = useState(city ? "loading" : "nocity");
  const [live, setLive] = useState(null);
  const wide = (size?.[0] ?? 3) >= 4;

  useEffect(() => {
    if (!city?.latitude) {
      setStatus("nocity");
      return undefined;
    }
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    fetch(aqiUrl(city))
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const parsed = parseAirQuality(data);
        if (!parsed) {
          setStatus("error");
          return;
        }
        setLive(parsed);
        setCached({ ...parsed, city: city.name });
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
    // setCached is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, refreshKey]);

  if (status === "nocity") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--dim)" }}>Pick a city to start.</div>
        <CitySearch onPick={(c) => setConfig({ city: c })} />
      </div>
    );
  }

  // Guard against showing a previous city's cached reading while a new
  // city's first fetch is still in flight.
  const usableCache = cached && cached.city === city?.name ? cached : null;
  const data = live || usableCache;

  if (!data) {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          color: "var(--faint)",
        }}
      >
        {status === "error" ? "Air quality unavailable" : "Loading…"}
      </div>
    );
  }

  const band = aqiBand(data.aqi);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flex: 1,
        gap: 10,
        minWidth: 0,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div
            style={{
              fontSize: "clamp(30px, 3.4vw, 40px)",
              fontWeight: 500,
              letterSpacing: "-.03em",
              lineHeight: 1,
            }}
          >
            {data.aqi}
          </div>
          {band ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: band.color,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: band.color,
                }}
              />
              {band.label}
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--dim)",
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {city?.name || data.city}
        </div>
        {status === "error" ? (
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
            Showing the last reading — refresh failed.
          </div>
        ) : null}
      </div>

      {wide && (data.pm25 != null || data.pm10 != null) ? (
        <div
          style={{
            display: "flex",
            gap: 14,
            fontFamily: MONO,
            fontSize: 11,
            color: "var(--faint)",
          }}
        >
          {data.pm25 != null ? (
            <span>
              PM2.5 <span style={{ color: "var(--fg)" }}>{data.pm25}</span>
            </span>
          ) : null}
          {data.pm10 != null ? (
            <span>
              PM10 <span style={{ color: "var(--fg)" }}>{data.pm10}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default Air;
