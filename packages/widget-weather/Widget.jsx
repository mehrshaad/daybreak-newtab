import { useEffect, useState } from "react";
import { Appear, CitySearch, MONO, useWidgetLocal } from "@daybreak/sdk";
import ConditionIcon from "./ConditionIcon";
import { forecastUrl, parseForecast } from "./forecast";
import { layoutFor, statsToShow } from "./layout";

// One number from the extras row: rain, wind, humidity, UV.
//
// A chip rather than a labelled card like Detail below, because four of these
// have to fit one line on a four-column tile and a card each would need two
// rows. The label is the unit, which is the only word any of them needs.
const STAT_LABEL = {
  rain: (v) => [`${v}%`, "rain"],
  wind: (v, unit) => [`${v}`, unit],
  humidity: (v) => [`${v}%`, "humidity"],
  uv: (v) => [`${v}`, "UV"],
};

function Stat({ kind, value, windUnit }) {
  const [amount, unit] = STAT_LABEL[kind](value, windUnit);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 3,
        flex: "none",
        fontFamily: MONO,
        fontSize: 11,
        color: "var(--dim)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {amount}
      <span style={{ fontSize: 9, color: "var(--faint)" }}>{unit}</span>
    </span>
  );
}

// One day of the day-by-day strip.
function Day({ day, icons, deg }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        minWidth: 0,
        flex: 1,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "var(--faint)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {day.label}
      </span>
      {icons && day.condition ? (
        <ConditionIcon condition={day.condition} day size={17} />
      ) : null}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: "var(--fg)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {day.high}
        {deg}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: "var(--faint)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {day.low}
        {deg}
      </span>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "8px 10px",
        borderRadius: 10,
        background: "var(--panel)",
        border: "1px solid var(--line)",
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--faint)",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, color: "var(--fg)" }}>{value}</span>
    </div>
  );
}

function Weather({ id, options, config, setConfig, refreshKey, size }) {
  const {
    align,
    fahrenheit,
    hour24,
    showHourly,
    showDaily,
    showRain,
    showWind,
    showHumidity,
    showUv,
  } = options;
  const centred = align === "center";
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
  const view = layoutFor(size, {
    hourly: showHourly,
    daily: showDaily,
    stats: showRain || showWind || showHumidity || showUv,
  });
  const hours = data.hours?.slice(0, view.hours) || [];
  const days = data.days?.slice(0, view.days) || [];
  const stats = statsToShow(
    { rain: showRain, wind: showWind, humidity: showHumidity, uv: showUv },
    data
  );
  // Open-Meteo answers in km/h unless asked otherwise, and it is asked in the
  // same unit system as the temperature.
  const windUnit = fahrenheit ? "mph" : "km/h";

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
      <div style={{ textAlign: centred ? "center" : "left" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: centred ? "center" : "flex-start",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: view.narrow
                ? "clamp(26px, 2.4vw, 32px)"
                : view.tall
                  ? "clamp(38px, 4.4vw, 54px)"
                  : "clamp(30px, 3.4vw, 40px)",
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
            size={view.narrow ? 24 : view.tall ? 38 : 30}
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
          {view.narrow ? city?.name || data.city : `${data.label} · ${city?.name || data.city}`}
        </div>
        {view.summary && !view.details ? (
          <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 8 }}>
            H {data.high}
            {deg} · L {data.low}
            {deg} · feels {data.feels}
            {deg}
          </div>
        ) : null}

        {/* The extras, on one line. Appear so switching one on eases. */}
        <Appear open={!!(view.stats && stats.length)}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 8,
              justifyContent: centred ? "center" : "flex-start",
            }}
          >
            {stats.map((kind) => (
              <Stat key={kind} kind={kind} value={data[kind]} windUnit={windUnit} />
            ))}
          </div>
        </Appear>
        {status === "error" ? (
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
            Showing the last reading — refresh failed.
          </div>
        ) : null}
      </div>

      {/* Taller tiles get the same three numbers as a labelled grid, which is
          what the height is good for. */}
      {view.details ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <Detail label="High" value={`${data.high}${deg}`} />
          <Detail label="Low" value={`${data.low}${deg}`} />
          <Detail label="Feels" value={`${data.feels}${deg}`} />
        </div>
      ) : null}

      {/* The day ahead, where the tile has the height for it. This is what
          the empty half of a 4x3 was for. */}
      <Appear open={!!(view.daily && days.length)}>
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "space-between",
            paddingTop: 2,
          }}
        >
          {days.map((day) => (
            <Day key={day.date} day={day} icons={view.dailyIcons} deg={deg.slice(0, 1)} />
          ))}
        </div>
      </Appear>

      <Appear open={!!(view.hourly && hours.length)}>
        <div
          style={{
            display: "flex",
            gap: view.hourIcons ? 10 : 14,
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 11,
            color: "var(--faint)",
            flexWrap: "wrap",
          }}
        >
          {hours.map((h) => (
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
              {view.hourIcons && h.c ? (
                <ConditionIcon condition={h.c} day={data.isDay} size={18} />
              ) : null}
              <span style={{ color: "var(--fg)" }}>{h.v}</span>
            </div>
          ))}
        </div>
      </Appear>
    </div>
  );
}

export default Weather;
