import { useEffect, useMemo, useState } from "react";
import {
  CitySearch,
  MONO,
  dayLengthDelta,
  dayProgress,
  sunPosition,
  sunTimes,
} from "@daybreak/sdk";
import { arcPoint, deltaLabel, lengthLabel, rgb, skyAt } from "./sky";

// The sun moves a quarter of a degree a minute, so a redraw every half minute
// is already finer than the arc can show. Cheap enough to leave running.
const TICK = 30000;

// In the city's own timezone, not the viewer's. Formatting Tehran's sunrise
// against a browser set to New York rendered it as "9:59 pm" — the right
// instant, the wrong day, and the wrong clock, which made sunrise look like it
// came after sunset.
const timeLabel = (date, hour24, timeZone) =>
  date
    ? date.toLocaleTimeString([], {
        hour: hour24 ? "2-digit" : "numeric",
        minute: "2-digit",
        hour12: !hour24,
        ...(timeZone ? { timeZone } : null),
      })
    : "—";

// The city's own clock, but only when it differs from this machine's. Saying
// "times in Tehran" beside a label that already reads TEHRAN was redundant;
// the current time there says the same thing and is worth knowing anyway.
function cityClock(timeZone, hour24) {
  if (!timeZone) return "";
  try {
    const now = new Date();
    const opts = { hour12: false, timeStyle: "short" };
    if (now.toLocaleString([], opts) === now.toLocaleString([], { ...opts, timeZone })) return "";
    return now.toLocaleTimeString([], {
      hour: hour24 ? "2-digit" : "numeric",
      minute: "2-digit",
      hour12: !hour24,
      timeZone,
    });
  } catch {
    // An unknown zone should not take the widget down with it.
    return "";
  }
}

function Row({ label, value, mono = true }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--faint)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? MONO : "inherit",
          fontSize: 12,
          color: "var(--fg)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Sun({ config, setConfig, options, size }) {
  const { hour24, showDelta, showAzimuth, arc } = options;
  const city = config.city;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), TICK);
    return () => clearInterval(t);
  }, []);

  const sky = useMemo(() => {
    if (!city?.latitude) return null;
    const times = sunTimes(now, city.latitude, city.longitude);
    const position = sunPosition(now, city.latitude, city.longitude);
    return {
      times,
      position,
      progress: dayProgress(now, city.latitude, city.longitude),
      delta: showDelta ? dayLengthDelta(now, city.latitude, city.longitude) : null,
    };
  }, [city, now, showDelta]);

  if (!city?.latitude) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
          Pick a city and Daybreak works the rest out on this machine — nothing
          is fetched.
        </div>
        <CitySearch onPick={(picked) => setConfig({ city: picked })} placeholder="Search for a city…" />
      </div>
    );
  }

  const { times, position, progress, delta } = sky;
  const zone = city.timezone;
  const note = cityClock(zone, hour24);
  const palette = skyAt(position.altitude);
  const plain = arc === "plain";
  const daytime = position.altitude > -0.833;

  // A fixed viewBox and a percentage width: the tile can be any shape, and the
  // arc should keep its proportions rather than shearing with the tile.
  const VIEW = { width: 300, height: 96 };
  // Below the horizon the sun has no place on the arc, so it is parked at the
  // nearest end rather than drawn hovering in the dark at a made-up spot.
  const point = arcPoint(progress ?? (position.altitude > 0 ? 0.5 : 0), VIEW);
  const tall = size?.[1] >= 3;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        gap: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          // Shrinkable, with the rows below taking what they need first. Left
          // to its intrinsic aspect the SVG claimed ~150px in a two-row tile
          // and pushed the times clean out of the bottom.
          flex: "1 1 auto",
          minHeight: 54,
          // The sky itself. Transitioned, so the colour walks through dawn
          // rather than stepping between presets on each redraw.
          background: plain
            ? "var(--panel)"
            : `linear-gradient(to bottom, ${rgb(palette.top)}, ${rgb(palette.bottom)})`,
          transition: "background 1.2s linear",
        }}
      >
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="db-sun-glow">
              <stop offset="0%" stopColor={rgb(palette.glow)} stopOpacity=".95" />
              <stop offset="55%" stopColor={rgb(palette.glow)} stopOpacity=".28" />
              <stop offset="100%" stopColor={rgb(palette.glow)} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* The sun's whole path, so its position reads as a point along a
              journey rather than a dot floating on a gradient. */}
          <path
            d={`M ${arcPoint(0, VIEW).x} ${arcPoint(0, VIEW).y}
                Q ${VIEW.width / 2} ${arcPoint(0.5, VIEW).y - 26}
                  ${arcPoint(1, VIEW).x} ${arcPoint(1, VIEW).y}`}
            fill="none"
            stroke={plain ? "var(--line)" : "rgba(255,255,255,.35)"}
            strokeWidth="1"
            strokeDasharray="3 4"
          />

          {/* The horizon. Everything below it is ground, which is what makes a
              sun sitting on the line read as rising rather than as small. */}
          <line
            x1="0"
            y1={VIEW.height - 1}
            x2={VIEW.width}
            y2={VIEW.height - 1}
            stroke={plain ? "var(--line)" : "rgba(255,255,255,.5)"}
            strokeWidth="1.5"
          />

          {daytime ? (
            <>
              <circle cx={point.x} cy={point.y} r="26" fill="url(#db-sun-glow)">
                {/* A slow breath, so the tile is alive without being busy. */}
                <animate attributeName="r" values="24;28;24" dur="6s" repeatCount="indefinite" />
              </circle>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill={plain ? "var(--accent)" : rgb(palette.glow)}
                style={{ transition: "cx 1.2s linear, cy 1.2s linear" }}
              />
            </>
          ) : (
            // Half-sunk on the horizon rather than hidden entirely: a tile that
            // shows nothing at night reads as broken, and where the sun sits
            // below the line is still information.
            <circle
              cx={point.x}
              cy={VIEW.height + 3}
              r="7"
              fill={plain ? "var(--line)" : rgb(palette.glow)}
              opacity=".7"
            />
          )}
        </svg>

        <div
          style={{
            position: "absolute",
            left: 10,
            top: 8,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: plain ? "var(--faint)" : "rgba(255,255,255,.72)",
          }}
        >
          {city.name}
          {note ? (
            <span style={{ opacity: 0.7, textTransform: "none", letterSpacing: 0 }}>
              {" · "}
              {note}
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "none" }}>
        <Row label="Sunrise" value={timeLabel(times.sunrise, hour24, zone)} />
        <Row label="Sunset" value={timeLabel(times.sunset, hour24, zone)} />
        {tall ? (
          <>
            <Row label="Solar noon" value={timeLabel(times.solarNoon, hour24, zone)} />
            <Row label="Golden hour" value={timeLabel(times.goldenHour, hour24, zone)} />
            <Row label="Dusk" value={timeLabel(times.dusk, hour24, zone)} />
          </>
        ) : null}
        <Row
          label="Daylight"
          value={
            <>
              {times.dayLength == null
                ? position.altitude > 0
                  ? "All day"
                  : "None"
                : lengthLabel(times.dayLength)}
              {showDelta && delta != null ? (
                <span style={{ color: "var(--faint)", fontSize: 10, marginLeft: 6 }}>
                  {deltaLabel(delta, true)}
                </span>
              ) : null}
            </>
          }
        />
        {showAzimuth ? <Row label="Bearing" value={`${Math.round(position.azimuth)}°`} /> : null}
      </div>

    </div>
  );
}

export default Sun;
