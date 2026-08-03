import { useEffect, useState } from "react";
import { CitySearch, MONO, useWidgetLocal } from "@daybreak/sdk";
import ConditionIcon from "./ConditionIcon";
import { forecastUrl, parseForecast } from "./forecast";

function Weather({ id, options, config, setConfig, refreshKey, focused }) {
  const { fahrenheit, hour24, showHourly } = options;
  const city = config.city;
  // Cache the last good reading so a refresh (or being offline) shows the
  // previous numbers instead of a spinner.
  const [cached, setCached] = useWidgetLocal(id, "last", null);
  const [status, setStatus] = useState(city ? "loading" : "nocity");
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!city?.latitude) {
      setStatus("nocity");
      return undefined;
    }
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    fetch(forecastUrl(city, fahrenheit))
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const parsed = parseForecast(data, hour24);
        if (!parsed) {
          setStatus("error");
          return;
        }
        setLive(parsed);
        setCached({ ...parsed, city: city.name, unit: fahrenheit ? "f" : "c" });
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
  }, [city, fahrenheit, hour24, refreshKey]);

  if (status === "nocity") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--dim)" }}>Pick a city to start.</div>
        <CitySearch onPick={(c) => setConfig({ city: c })} />
      </div>
    );
  }

  // Fall back to the cached reading while a refetch is in flight.
  const usableCache =
    cached && cached.unit === (fahrenheit ? "f" : "c") ? cached : null;
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
        {status === "error" ? "Weather unavailable" : "Loading…"}
      </div>
    );
  }

  const deg = fahrenheit ? "°F" : "°C";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flex: 1,
        gap: 12,
        minWidth: 0,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontSize: focused ? "clamp(48px, 7vw, 76px)" : "clamp(30px, 3.4vw, 40px)",
              fontWeight: 500,
              letterSpacing: "-.03em",
              lineHeight: 1,
            }}
          >
            {data.temp}°
          </div>
          {/* Day/night decided from the location's own clock, not the
              browser's — the point of the widget is somewhere else. */}
          <ConditionIcon
            condition={data.condition}
            day={data.isDay}
            size={focused ? 44 : 30}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--dim)",
            marginTop: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {data.label} · {city?.name || data.city}
        </div>
        {focused ? (
          <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 8 }}>
            H {data.high}
            {deg} · L {data.low}
            {deg} · feels {data.feels}
            {deg}
          </div>
        ) : null}
        {status === "error" ? (
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
            Showing the last reading — refresh failed.
          </div>
        ) : null}
      </div>

      {showHourly && data.hours?.length ? (
        <div
          style={{
            display: "flex",
            gap: 14,
            fontFamily: MONO,
            fontSize: 11,
            color: "var(--faint)",
            flexWrap: "wrap",
          }}
        >
          {data.hours.map((h) => (
            <div
              key={h.t}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span>{h.t}</span>
              <span style={{ color: "var(--fg)" }}>{h.v}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default Weather;
