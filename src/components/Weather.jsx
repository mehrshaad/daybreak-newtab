import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import { useEffect, useState } from "react";
import { IconWeather } from "../components/Icon";
import { classNames, wmoWeather } from "../utils";

function Weather({ geo, day, unit = "c" }) {
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!geo || geo.latitude == null) return;
    let active = true;
    setStatus("loading");

    const temperatureUnit = unit === "f" ? "fahrenheit" : "celsius";
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}` +
      `&longitude=${geo.longitude}` +
      `&current=temperature_2m,apparent_temperature,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&temperature_unit=${temperatureUnit}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (!d || !d.current) {
          setStatus("error");
          return;
        }
        const { condition, label } = wmoWeather(d.current.weather_code);
        setWeather({
          temp: Math.round(d.current.temperature_2m),
          feels: Math.round(d.current.apparent_temperature),
          high: Math.round(d.daily?.temperature_2m_max?.[0]),
          low: Math.round(d.daily?.temperature_2m_min?.[0]),
          condition,
          label,
        });
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [geo, unit]);

  const deg = unit === "f" ? "°F" : "°C";
  const dayClass = day ? "day" : "night";

  if (!geo || status === "loading") {
    return (
      <div className={classNames("weather", dayClass)}>
        <LoadingOutlined className={classNames("loader", dayClass)} />
      </div>
    );
  }

  if (status === "error" || !weather) {
    return (
      <div className={classNames("weather", dayClass)}>
        <span className="weather-error">Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className={classNames("weather", dayClass)}>
      <IconWeather weatherCondition={weather.condition} day={day} />
      <div className="weather-main">
        {weather.temp}
        {deg} · {weather.label}
      </div>
      <div className="weather-detail">
        H {weather.high}° · L {weather.low}° · feels {weather.feels}°
      </div>
    </div>
  );
}

export default Weather;
