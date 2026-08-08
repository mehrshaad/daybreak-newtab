import { useEffect, useRef, useState } from "react";
import { MONO, Tooltip, useTooltip } from "@daybreak/sdk";
import { formatClock, nextPhase, phaseLength } from "./phases";

function Timer({ options }) {
  const { longFocus, autoStart } = options;
  const resetTip = useTooltip("Reset round");
  const [phase, setPhase] = useState("Focus");
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(() => phaseLength({ phase: "Focus", longFocus }));
  // Count down against a wall-clock deadline: a plain interval drifts, and
  // browsers throttle timers in background tabs.
  const deadline = useRef(null);

  useEffect(() => {
    if (!running) {
      setLeft(phaseLength({ phase, longFocus }));
    }
    // Only reset when the configured length changes, not on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, longFocus]);

  useEffect(() => {
    if (!running) {
      deadline.current = null;
      return undefined;
    }
    deadline.current = Date.now() + left * 1000;
    const t = setInterval(() => {
      const remaining = (deadline.current - Date.now()) / 1000;
      if (remaining <= 0) {
        const next = nextPhase(phase, round);
        setPhase(next.phase);
        setRound(next.round);
        setLeft(phaseLength({ phase: next.phase, longFocus }));
        setRunning(autoStart);
        return;
      }
      setLeft(remaining);
    }, 250);
    return () => clearInterval(t);
    // `left` is intentionally excluded: it changes every tick and is captured
    // once into the deadline when the run starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round, longFocus, autoStart]);

  const total = phaseLength({ phase, longFocus });
  const progress = Math.min(100, Math.max(0, ((total - left) / total) * 100));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12,
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: "clamp(26px, 3.4vw, 36px)",
            fontWeight: 500,
            letterSpacing: "-.02em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {formatClock(left)}
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flex: "none",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRunning((v) => !v);
            }}
            style={{
              // Fixed so the crossfade between "Start" and "Pause" — different
              // widths — never nudges the reset button beside it.
              minWidth: 62,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: running ? "var(--accent)" : "var(--panel2)",
              color: running ? "var(--onAccent)" : "var(--fg)",
              border: `1px solid ${running ? "transparent" : "var(--line)"}`,
              transition: "background .18s ease, border-color .18s ease, color .18s ease",
            }}
          >
            {/* Keyed so the label crossfades on toggle instead of snapping. */}
            <span key={running ? "on" : "off"} style={{ display: "inline-block", animation: "db-fade .2s ease both" }}>
              {running ? "Pause" : "Start"}
            </span>
          </button>
          <button
            ref={resetTip.anchorRef}
            type="button"
            aria-label="Reset round"
            onClick={(e) => {
              e.stopPropagation();
              setRunning(false);
              setLeft(phaseLength({ phase, longFocus }));
            }}
            {...resetTip.anchorProps}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: "transparent",
              color: "var(--dim)",
              border: "1px solid var(--line)",
            }}
          >
            ↺
          </button>
          <Tooltip {...resetTip} />
        </div>
      </div>

      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: "var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "var(--accent)",
            transition: "width .3s linear",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: MONO,
          fontSize: 10,
          color: "var(--faint)",
        }}
      >
        <span>{phase}</span>
        <span>round {round}</span>
      </div>
    </div>
  );
}

export default Timer;
