import { useEffect, useRef, useState } from "react";
import { Appear, CitySearch, MONO, useFlip, useWidgetLocal } from "@daybreak/sdk";
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
    forecast,
    showRain,
    showWind,
    showHumidity,
    showUv,
  } = options;
  const centred = align === "center";
  // The readout's lines slide when the alignment changes. Above the early
  // returns below, because a hook cannot be called conditionally — and keyed
  // on the alignment alone, so a refresh or a new reading never animates.
  const readoutRef = useRef(null);
  useFlip(readoutRef, [centred]);
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
    forecast,
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
      {/* A flex column whose alignment moves, rather than a block whose text
          alignment changes — so each line is a box that slides, and useFlip
          can animate the move. Switching Left to Centre used to teleport
          everything on one frame, which is the one change in this widget big
          enough to be jarring. Each child carries a data-flip-id; the hook
          only looks at direct children. */}
      <div
        ref={readoutRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: centred ? "center" : "flex-start",
          textAlign: centred ? "center" : "left",
          minWidth: 0,
        }}
      >
        <div
          data-flip-id="readout-temp"
          style={{
            display: "flex",
            alignItems: "center",
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
          data-flip-id="readout-place"
          style={{
            fontSize: 13,
            color: "var(--dim)",
            marginTop: 6,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {view.narrow ? city?.name || data.city : `${data.label} · ${city?.name || data.city}`}
        </div>
        {view.summary && !view.details ? (
          <div
            data-flip-id="readout-summary"
            style={{ fontSize: 13, color: "var(--faint)", marginTop: 8 }}
          >
            H {data.high}
            {deg} · L {data.low}
            {deg} · feels {data.feels}
            {deg}
          </div>
        ) : null}

        {/* The extras, on one line. The wrapper carries the flip id because
            Appear does not forward arbitrary props, and Appear itself is what
            eases a stat being switched on. */}
        <div data-flip-id="readout-stats" style={{ maxWidth: "100%" }}>
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
        </div>
        {status === "error" ? (
          <div
            data-flip-id="readout-error"
            style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}
          >
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
            gap: 6,
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 11,
            color: "var(--faint)",
          }}
        >
          {hours.map((h) => (
            <div
              key={h.t}
              // Even columns, like the day strip — the hours used to be their
              // own widths with the space pushed between them, so five of them
              // sat in a ragged row under a row of seven that was regular.
              // No wrap either: a strip that wraps is a strip that does not
              // fit, and the count comes from layoutFor for that reason.
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "center",
                flex: 1,
                minWidth: 0,
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
