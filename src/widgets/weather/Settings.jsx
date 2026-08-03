import CitySearch from "../../components/CitySearch";

// Widget-specific settings panel, mounted by the widget settings drawer.
// Generic option toggles come from the manifest; this covers the one thing
// that needs a richer control than a switch.
function WeatherSettings({ config, setConfig }) {
  const city = config.city;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {city ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 10,
            fontSize: 13,
          }}
        >
          <span>{city.name}</span>
          <span style={{ fontSize: 11, color: "var(--faint)" }}>{city.country}</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--faint)" }}>No city set.</div>
      )}
      <CitySearch
        placeholder={city ? "Change city…" : "Search a city…"}
        onPick={(c) => setConfig({ city: c })}
      />
    </div>
  );
}

export default WeatherSettings;
