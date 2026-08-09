// Same provider as Weather, a different subdomain — confirmed CORS-open
// (access-control-allow-origin: *) with a real request before this was built.
export function aqiUrl({ latitude, longitude }) {
  return (
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}` +
    `&longitude=${longitude}&current=us_aqi,pm2_5,pm10&timezone=auto`
  );
}

// US AQI bands, fixed colours rather than themed — like the weather icons,
// air quality reads as air quality on any accent.
const BANDS = [
  { max: 50, label: "Good", color: "#3fb573" },
  { max: 100, label: "Moderate", color: "#d9b93c" },
  { max: 150, label: "Unhealthy for sensitive groups", color: "#e58a3f" },
  { max: 200, label: "Unhealthy", color: "#dd5b5b" },
  { max: 300, label: "Very unhealthy", color: "#9457c2" },
  { max: Infinity, label: "Hazardous", color: "#8a3b47" },
];

export function aqiBand(value) {
  if (value == null || Number.isNaN(value)) return null;
  return BANDS.find((b) => value <= b.max) || BANDS[BANDS.length - 1];
}

export function parseAirQuality(data) {
  const aqi = data?.current?.us_aqi;
  if (aqi == null) return null;
  const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
  return {
    aqi: Math.round(aqi),
    pm25: round1(data.current.pm2_5),
    pm10: round1(data.current.pm10),
  };
}
