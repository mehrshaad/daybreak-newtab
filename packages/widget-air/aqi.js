// Same provider as Weather, a different subdomain — confirmed CORS-open
// (access-control-allow-origin: *) with a real request before this was built.
//
// Both indices are always requested, never just the one in use. They cost
// nothing extra on the same call, and asking for only the selected one would
// mean a refetch every time the scale is switched — a visible reload of a tile,
// for a number the response already contained.
export function aqiUrl({ latitude, longitude }) {
  return (
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}` +
    `&longitude=${longitude}&current=us_aqi,european_aqi,pm2_5,pm10&timezone=auto`
  );
}

// Fixed colours rather than themed — like the weather icons, air quality reads
// as air quality on any accent.
//
// Two scales, because the number on its own is meaningless without knowing
// which. 55 is "moderate" on the US index and "poor" on the European one, and
// showing a US AQI to someone in Europe is showing them a figure their own
// forecast, news and health advice will never use. Bands and labels are from
// Open-Meteo's own air-quality documentation.
const US_BANDS = [
  { max: 50, label: "Good", color: "#3fb573" },
  { max: 100, label: "Moderate", color: "#d9b93c" },
  { max: 150, label: "Unhealthy for sensitive groups", color: "#e58a3f" },
  { max: 200, label: "Unhealthy", color: "#dd5b5b" },
  { max: 300, label: "Very unhealthy", color: "#9457c2" },
  { max: Infinity, label: "Hazardous", color: "#8a3b47" },
];

const EUROPEAN_BANDS = [
  { max: 20, label: "Good", color: "#3fb573" },
  { max: 40, label: "Fair", color: "#8cc63f" },
  { max: 60, label: "Moderate", color: "#d9b93c" },
  { max: 80, label: "Poor", color: "#e58a3f" },
  { max: 100, label: "Very poor", color: "#dd5b5b" },
  { max: Infinity, label: "Extremely poor", color: "#8a3b47" },
];

export const SCALES = {
  us: { key: "aqi", label: "US AQI", bands: US_BANDS },
  european: { key: "europeanAqi", label: "European AQI", bands: EUROPEAN_BANDS },
};

export function aqiBand(value, scale = "us") {
  if (value == null || Number.isNaN(value)) return null;
  const bands = (SCALES[scale] || SCALES.us).bands;
  return bands.find((b) => value <= b.max) || bands[bands.length - 1];
}

export function parseAirQuality(data) {
  const us = data?.current?.us_aqi;
  const european = data?.current?.european_aqi;
  // One of the two is enough to draw the tile. Requiring both would blank a
  // reading that arrived perfectly usable for the scale actually selected.
  if (us == null && european == null) return null;
  const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
  const round = (v) => (v == null ? null : Math.round(v));
  return {
    aqi: round(us),
    europeanAqi: round(european),
    pm25: round1(data.current.pm2_5),
    pm10: round1(data.current.pm10),
  };
}

// Which number the tile shows, falling back to the other scale rather than
// showing nothing when the provider only returned one of them.
export function readingFor(data, scale = "us") {
  if (!data) return null;
  const wanted = data[(SCALES[scale] || SCALES.us).key];
  if (wanted != null) return { value: wanted, scale };
  const other = scale === "us" ? "european" : "us";
  const fallback = data[SCALES[other].key];
  return fallback == null ? null : { value: fallback, scale: other };
}
