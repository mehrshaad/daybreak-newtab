import { useEffect, useState } from "react";
import { classNames, getTimezone } from "../utils";

function Clock({ city, setDay }) {
  const [time, setTime] = useState("");
  const [dayState, setDayState] = useState(true);

  useEffect(() => {
    const getTime = () => {
      const date = new Date();
      let options = {
        timeZone: getTimezone(city),
        hour: "2-digit",
        minute: "2-digit",
      };
      setTime(date.toLocaleTimeString("en-US", options));
    };

    getTime();
    const timer = setInterval(getTime, 1000);

    return () => clearInterval(timer);
  }, [city, setDay]);

  useEffect(() => {
    const date = new Date();
    const hour = parseInt(
      date.toLocaleString("en-US", {
        timeZone: getTimezone(city),
        hour: "numeric",
        hour12: false,
      })
    );
    const dayHour = hour >= 6 && hour < 18;
    setDay(dayHour);
    setDayState(dayHour);
  }, [city]);

  return (
    <div className={classNames("clock", dayState ? "day" : "night")}>
      {time}
    </div>
  );
}

export default Clock;
