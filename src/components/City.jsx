import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/City.scss";
import { classNames } from "../utils";
import Clock from "./Clock";
import Weather from "./Weather";

function City() {
  const {
    settings: { cities, leftbar },
  } = useSettings();
  const [dayStates, setDayStates] = useState(
    cities?.cityList.reduce((acc, city) => ({ ...acc, [city]: true }), {})
  );

  const setDayForCity = (city, value) => {
    setDayStates((prev) => ({ ...prev, [city]: value }));
  };

  return (
    leftbar === "cities" && (
      <div className="cities">
        {cities?.cityList.map((city, index) => (
          <div
            key={city}
            className={classNames(
              "city animate__animated animate__slideInLeft",
              dayStates[city] ? "day" : "night"
            )}
            style={{
              animationDelay: `${index * 0.15}s`,
            }}
          >
            <h2>{city}</h2>
            {cities?.showWeather && (
              <Weather city={city} day={dayStates[city]} />
            )}
            {cities?.showClock && (
              <Clock
                city={city}
                setDay={(value) => setDayForCity(city, value)}
              />
            )}
          </div>
        ))}
      </div>
    )
  );
}

export default City;
