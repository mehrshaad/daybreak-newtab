import { useEffect, useMemo, useState } from "react";
import { CitySearch, formatJalali, LIST_BLEED, MONO } from "@daybreak/sdk";
import {
  currentAndNext,
  PRAYER_LABELS,
  PRAYER_LABELS_FA,
  PRAYERS,
  prayerTimes,
  untilLabel,
} from "./prayers";

// Once a minute: the countdown to the next prayer is shown in minutes, and a
// tab left open overnight has to roll onto the next day's table by itself.
const TICK = 30000;

// The place's own offset from UTC, in hours, for the date in question — so a
// zone that keeps half-hours (Tehran is +3:30) and one that changes for summer
// are both right. Derived from the zone name rather than assumed.
function offsetHoursFor(timeZone, date) {
  if (!timeZone) return undefined;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "";
    const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) + Number(match[3] || 0) / 60);
  } catch {
    return undefined;
  }
}

const timeLabel = (date, hour24) =>
  date
    ? date.toLocaleTimeString([], {
        hour: hour24 ? "2-digit" : "numeric",
        minute: "2-digit",
        hour12: !hour24,
      })
    : "—";

function Prayer({ config, setConfig, options, size }) {
  const { method, asr, hour24, hideSunrise, script } = options;
  const city = config.city;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), TICK);
    return () => clearInterval(t);
  }, []);

  const table = useMemo(() => {
    if (!city?.latitude) return null;
    // Read inside the memo: `config.adjustments || {}` outside it is a fresh
    // object on every render, which would recompute the whole table each time.
    const adjustments = config.adjustments || {};
    const timeZoneOffsetHours = offsetHoursFor(city.timezone, now);
    const shared = {
      latitude: city.latitude,
      longitude: city.longitude,
      method,
      asr,
      timeZoneOffsetHours,
      adjustments,
    };
    const today = prayerTimes({ date: now, ...shared });
    const { current, next } = currentAndNext(today, now);
    if (next) return { today, current, next, tomorrow: false };

    // Past Isha, the next prayer is tomorrow's Fajr. Reaching for it is better
    // than showing an empty countdown for the rest of the evening.
    const after = new Date(now);
    after.setDate(after.getDate() + 1);
    const nextDay = prayerTimes({ date: after, ...shared });
    return {
      today,
      current,
      next: nextDay.fajr ? { name: "fajr", at: nextDay.fajr } : null,
      tomorrow: true,
    };
  }, [city, now, method, asr, config.adjustments]);

  if (!city?.latitude) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
          Pick a city. Times are worked out on this device from its coordinates —
          nothing is fetched.
        </div>
        <CitySearch onPick={(picked) => setConfig({ city: picked })} placeholder="Search for a city…" />
      </div>
    );
  }

  const { today, current, next, tomorrow } = table;
  const labels = script === "farsi" ? PRAYER_LABELS_FA : PRAYER_LABELS;
  const rows = PRAYERS.filter((name) => !(hideSunrise && name === "sunrise"));
  const tall = (size?.[1] ?? 3) >= 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 8 }}>
      {next ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            flex: "none",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, color: "var(--fg)", fontWeight: 500 }}>
              {labels[next.name]}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
              {untilLabel(next.at, now)}
              {tomorrow ? " · tomorrow" : ""}
            </div>
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 20,
              color: "var(--accentText)",
              fontVariantNumeric: "tabular-nums",
              flex: "none",
            }}
          >
            {timeLabel(next.at, hour24)}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          margin: `0 -${LIST_BLEED}px`,
          padding: `0 ${LIST_BLEED}px`,
          overflowY: "auto",
          overflowX: "hidden",
          justifyContent: "safe center",
        }}
      >
        {rows.map((name) => {
          const at = today[name];
          const isNow = current?.name === name;
          const isNext = !tomorrow && next?.name === name;
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                minHeight: 26,
                padding: `3px ${LIST_BLEED}px`,
                margin: `0 -${LIST_BLEED}px`,
                borderRadius: 8,
                // The one in progress is marked, not merely coloured: at a
                // glance the question is "where am I in the day".
                background: isNow ? "var(--accentSoft)" : "transparent",
                transition: "background .3s ease",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: isNow || isNext ? "var(--fg)" : "var(--dim)",
                  // Sunrise is a marker in the day, not a prayer.
                  fontStyle: name === "sunrise" ? "italic" : "normal",
                }}
              >
                {labels[name]}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                  color: at ? (isNow || isNext ? "var(--fg)" : "var(--dim)") : "var(--faint)",
                }}
              >
                {/* Null is honest: at high latitudes in summer the sun never
                    gets low enough for these definitions to have an answer. */}
                {at ? timeLabel(at, hour24) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {tall ? (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: "var(--faint)",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            flex: "none",
          }}
        >
          <span>{city.name}</span>
          <span>{formatJalali(now)}</span>
        </div>
      ) : null}
    </div>
  );
}

export default Prayer;
