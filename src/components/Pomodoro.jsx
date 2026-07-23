import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import "../styles/components/Widgets.scss";

const WORK = 25 * 60;
const BREAK = 5 * 60;

function Pomodoro() {
  const { settings } = useSettings();
  const [mode, setMode] = useState("work"); // work | break
  const [remaining, setRemaining] = useState(WORK);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (remaining !== 0) return;
    const nextMode = mode === "work" ? "break" : "work";
    setMode(nextMode);
    setRemaining(nextMode === "work" ? WORK : BREAK);
    setRunning(false);
  }, [remaining, mode]);

  if (settings.leftbar !== "pomodoro") return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const reset = () => {
    setRunning(false);
    setRemaining(mode === "work" ? WORK : BREAK);
  };

  return (
    <div className="widget-wrapper animate__animated animate__slideInLeft">
      <div className="widget-container pomodoro-widget">
        <h2>Focus</h2>
        <div className="pomodoro-mode">{mode === "work" ? "Work" : "Break"}</div>
        <div className="pomodoro-time">
          {mm}:{ss}
        </div>
        <div className="pomodoro-controls">
          <Button type="primary" onClick={() => setRunning((v) => !v)}>
            {running ? "Pause" : "Start"}
          </Button>
          <Button onClick={reset}>Reset</Button>
        </div>
      </div>
    </div>
  );
}

export default Pomodoro;
