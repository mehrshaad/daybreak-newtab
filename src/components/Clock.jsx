import { useEffect, useState } from "react";
import { classNames } from "../utils";

function Clock({ timezone, setDay }) {
  const [time, setTime] = useState("");
  const [dayState, setDayState] = useState(true);

  useEffect(() => {
    if (!timezone) return;
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      const hour = parseInt(
        now.toLocaleString("en-US", {
          timeZone: timezone,
          hour: "numeric",
          hour12: false,
        }),
        10
      );
      const isDay = hour >= 6 && hour < 18;
      setDayState(isDay);
      if (setDay) setDay(isDay);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timezone, setDay]);

  return (
    <div className={classNames("clock", dayState ? "day" : "night")}>{time}</div>
  );
}

export default Clock;
