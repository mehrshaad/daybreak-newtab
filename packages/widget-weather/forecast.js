import { wmoWeather } from "@daybreak/sdk";

// With `timezone=auto` Open-Meteo returns local wall-clock strings with no
// offset ("2026-08-02T22:00"), for both `current.time` and every `hourly.time`
// entry. Comparing them as strings is therefore both correct and timezone-safe
// — no Date parsing, which would reinterpret them in the *browser's* zone.
export function pickNextHours(hourly, currentTime, count = 5) {
  if (!hourly?.time?.length) return [];
  const start = hourly.time.findIndex((t) => t >= currentTime);
  if (start === -1) return [];
  const out = [];
  for (let i = start; i < hourly.time.length && out.length < count; i += 1) {
    const temp = hourly.temperature_2m?.[i];
    if (temp == null) continue;
    out.push({
      time: hourly.time[i],
      temp: Math.round(temp),
      // Undefined for a payload that predates the hourly codes being asked
      // for; the caller draws no icon rather than the wrong one.
      code: hourly.weather_code?.[i],
    });
  }
  return out;
}

// "2026-08-02T22:00" -> "10p" / "22" depending on the clock preference.
// The slice must be validated, not just Number()'d: a short or malformed
// string slices to "" and Number("") is 0, which would silently render "12a".
export function formatHour(isoLocal, hour24) {
  const raw = String(isoLocal).slice(11, 13);
  if (!/^\d{2}$/.test(raw)) return "";
  const hh = Number(raw);
  if (hh > 23) return "";
  if (hour24) return String(hh).padStart(2, "0");
  const suffix = hh < 12 ? "a" : "p";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}${suffix}`;
}

// Everything the widget can show, in one request.
//
// Asked for whether or not the current size and settings display it, because a
// bigger tile or a flipped switch must never mean another round trip: the whole
// run is parsed once and each layout takes the part it has room for. Open-Meteo
// charges nothing and needs no key, and the extra fields cost a few hundred
// bytes against a request that was already being made.
//
// Seven days rather than two. A day-by-day strip is the thing a weather widget
// with room to spare should be filling that room with, and the second day was
// only ever there for today's high and low.
export const FORECAST_DAYS = 7;

export function forecastUrl({ latitude, longitude }, fahrenheit) {
  const unit = fahrenheit ? "fahrenheit" : "celsius";
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,is_day,` +
    `relative_humidity_2m,wind_speed_10m,uv_index` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
    `precipitation_probability_max,sunrise,sunset` +
    `&forecast_days=${FORECAST_DAYS}&timezone=auto&temperature_unit=${unit}`
  );
}

// The next seven days, today included, as a strip.
//
// Today keeps its own label because "Today" is what a person looks for first;
// the rest are the weekday's first three letters, which is what fits under an
// icon at 10px.
export function pickDays(daily, count = FORECAST_DAYS) {
  if (!daily?.time?.length) return [];
  const out = [];
  for (let i = 0; i < daily.time.length && out.length < count; i += 1) {
    const high = daily.temperature_2m_max?.[i];
    const low = daily.temperature_2m_min?.[i];
    if (high == null || low == null) continue;
    const date = new Date(`${daily.time[i]}T12:00`);
    out.push({
      date: daily.time[i],
      label: i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" }),
      high: Math.round(high),
      low: Math.round(low),
      code: daily.weather_code?.[i],
      // Mapped here rather than in the component, so the widget never needs to
      // know the WMO table exists — same as `hours` above.
      condition:
        daily.weather_code?.[i] == null
          ? null
          : wmoWeather(daily.weather_code[i]).condition,
      rain: daily.precipitation_probability_max?.[i],
    });
  }
  return out;
}

export function parseForecast(data, hour24) {
  if (!data?.current) return null;
  const { condition, label } = wmoWeather(data.current.weather_code);
  return {
    temp: Math.round(data.current.temperature_2m),
    // Open-Meteo reports 1 during daylight at that location. Absent (older
    // cached payloads), assume day rather than showing a moon at noon.
    isDay: data.current.is_day === undefined ? true : data.current.is_day === 1,
    feels: Math.round(data.current.apparent_temperature),
    high: Math.round(data.daily?.temperature_2m_max?.[0]),
    low: Math.round(data.daily?.temperature_2m_min?.[0]),
    condition,
    label,
    // The extras. Each is undefined for a cached payload from before it was
    // asked for, and every reader below treats undefined as "do not show".
    humidity:
      data.current.relative_humidity_2m == null
        ? undefined
        : Math.round(data.current.relative_humidity_2m),
    wind:
      data.current.wind_speed_10m == null
        ? undefined
        : Math.round(data.current.wind_speed_10m),
    uv: data.current.uv_index == null ? undefined : Math.round(data.current.uv_index),
    // Rain "now" is the chance in the hour ahead — there is no current field
    // for it, and today's maximum is a different question from whether to take
    // a coat out in the next hour.
    rain: nextRain(data.hourly, data.current.time),
    sunrise: data.daily?.sunrise?.[0],
    sunset: data.daily?.sunset?.[0],
    // A full run is parsed once and the widget takes the slice its size has room
    // for, so growing the tile never needs another request.
    hours: pickNextHours(data.hourly, data.current.time, 8).map((h) => ({
      t: formatHour(h.time, hour24),
      v: `${h.temp}°`,
      c: h.code == null ? null : wmoWeather(h.code).condition,
    })),
    days: pickDays(data.daily),
  };
}

// The precipitation chance for the first hour at or after now.
function nextRain(hourly, currentTime) {
  if (!hourly?.time?.length || !hourly.precipitation_probability) return undefined;
  const at = hourly.time.findIndex((t) => t >= currentTime);
  if (at === -1) return undefined;
  const value = hourly.precipitation_probability[at];
  return value == null ? undefined : Math.round(value);
}
