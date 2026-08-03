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

export function forecastUrl({ latitude, longitude }, fahrenheit) {
  const unit = fahrenheit ? "fahrenheit" : "celsius";
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&forecast_days=2&timezone=auto&temperature_unit=${unit}`
  );
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
    // A full run is parsed once and the widget takes the slice its size has room
    // for, so growing the tile never needs another request.
    hours: pickNextHours(data.hourly, data.current.time, 8).map((h) => ({
      t: formatHour(h.time, hour24),
      v: `${h.temp}°`,
      c: h.code == null ? null : wmoWeather(h.code).condition,
    })),
  };
}
