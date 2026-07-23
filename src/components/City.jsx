import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/City.scss";
import { classNames, geocodeCity } from "../utils";
import Clock from "./Clock";
import Weather from "./Weather";

// Resolve a city entry (either a stored { name, latitude, longitude, timezone }
// object or, for backward compatibility, a plain name string) to coordinates
// and a timezone via the geocoding API.
function useCityGeo(city) {
  const preset =
    city && typeof city === "object" && city.latitude != null ? city : null;
  const name = typeof city === "string" ? city : city?.name;
  const [geo, setGeo] = useState(preset);

  useEffect(() => {
    if (preset) {
      setGeo(preset);
      return;
    }
    if (!name) return;
    let active = true;
    geocodeCity(name).then((g) => {
      if (active) setGeo(g);
    });
    return () => {
      active = false;
    };
  }, [name, preset]);

  return geo;
}

function CityCard({ city, index }) {
  const {
    settings: { cities },
  } = useSettings();
  const geo = useCityGeo(city);
  const [day, setDay] = useState(true);
  const cityName = typeof city === "string" ? city : city?.name;

  return (
    <div
      className={classNames(
        "city animate__animated animate__slideInLeft",
        day ? "day" : "night"
      )}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <h2>{cityName}</h2>
      {cities?.showWeather && (
        <Weather geo={geo} day={day} unit={cities?.unit || "c"} />
      )}
      {cities?.showClock && <Clock timezone={geo?.timezone} setDay={setDay} />}
    </div>
  );
}

function City() {
  const {
    settings: { cities, leftbar },
  } = useSettings();

  return (
    leftbar === "cities" && (
      <div className="cities">
        {cities?.cityList?.map((city, index) => (
          <CityCard
            key={(typeof city === "string" ? city : city?.name) || index}
            city={city}
            index={index}
          />
        ))}
      </div>
    )
  );
}

export default City;
