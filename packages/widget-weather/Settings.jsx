import { LuX } from "react-icons/lu";
import { CitySearch, MONO } from "@daybreak/sdk";
import { MAX_CITIES, addCity, cityKey, citiesOf, removeCity } from "./cities";

// The cities this widget holds. Up to five; one or two on screen at a time,
// which the tile's own picker decides.
function WeatherSettings({ config, setConfig }) {
  const cities = citiesOf(config);
  const full = cities.length >= MAX_CITIES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {cities.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cities.map((city) => (
            <div
              key={cityKey(city)}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                fontSize: 13,
                padding: "4px 0",
              }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                {city.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--faint)", flex: 1, minWidth: 0 }}>
                {city.country}
              </span>
              <button
                type="button"
                aria-label={`Remove ${city.name}`}
                // Removing the shown city would leave the tile blank for a
                // frame; shownCities pads from the front, so it does not.
                onClick={() =>
                  setConfig({
                    cities: removeCity(config, cityKey(city)),
                    shown: (config.shown || []).filter((k) => k !== cityKey(city)),
                  })
                }
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 20,
                  height: 20,
                  flex: "none",
                  padding: 0,
                  border: 0,
                  borderRadius: 6,
                  background: "transparent",
                  color: "var(--faint)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--faint)";
                }}
              >
                <LuX size={13} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--faint)" }}>No city set.</div>
      )}

      {full ? (
        <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
          Five is the most. Remove one to add another.
        </div>
      ) : (
        <CitySearch
          placeholder={cities.length ? "Add another city…" : "Search a city…"}
          onPick={(c) => setConfig({ cities: addCity(config, c) })}
        />
      )}
    </div>
  );
}

export default WeatherSettings;
