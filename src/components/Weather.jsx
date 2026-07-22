import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import { useEffect, useState } from "react";
import { IconWeather } from "../components/Icon";
import { classNames } from "../utils";

function Weather({ city, day }) {
  const [temperature, setTemperature] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState(null);
  const API_KEY = "0b680b9c553380559ca29e28a2295d42";
  useEffect(() => {
    const getWeather = async () => {
      try {
        if (city) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
          );
          const data = await response.json();
          setTemperature(Math.round(data.main.temp));
          setWeatherCondition(data.weather[0].main);
        } else {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${API_KEY}`
          );
          const data = await response.json();
          setTemperature(Math.round(data.main.temp));
          setWeatherCondition(data.weather[0].main);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    getWeather();
  }, [city]);

  return (
    <div className={classNames("weather", day ? "day" : "night")}>
      {temperature !== null ? (
        <>
          <IconWeather weatherCondition={weatherCondition} day={day} />
          {temperature}°C - {weatherCondition}
        </>
      ) : (
        <LoadingOutlined
          className={classNames("loader", day ? "day" : "night")}
        />
      )}
    </div>
  );
}

export default Weather;
