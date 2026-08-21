import { useEffect, useRef, useState } from "react";
import { MONO, Tooltip, useTooltip, useWidgetLocal } from "@daybreak/sdk";
import { formatClock, IDLE, nextPhase, phaseLength, remainingOf, resumeFrom } from "./phases";

// The run lives in storage, not in this component.
//
// A new tab page is a fresh document every single time, so a timer held in
// component state was a timer that ended the moment the tab did — and two open
// new tabs each ran their own, disagreeing with each other. Storing where the
// phase *ends* rather than how much is left means any tab can work out the
// truth whenever it happens to render, and the shared bucket keeps them in step.
//
// Local rather than synced: a countdown running on this machine is not
// something the laptop in the other room should join halfway through.
function Timer({ id, options, toast }) {
  const { longFocus, autoStart } = options;
  const resetTip = useTooltip("Reset round");
  const [saved, setSaved] = useWidgetLocal(id, "run", IDLE);

  // Resolved from storage on every render, so a tab that was in the background
  // while the phase ended catches up the moment it is looked at again.
  const resumed = resumeFrom(saved, Date.now(), { longFocus, autoStart });
  const [left, setLeft] = useState(() => resumed.left);

  const { phase, round } = resumed;
  const running = resumed.running;

  // Announced once, and only for a phase that ended while nobody was watching.
  const announced = useRef(null);
  useEffect(() => {
    if (!resumed.finishedWhileAway) return;
    const key = `${phase}-${round}`;
    if (announced.current === key) return;
    announced.current = key;
    setSaved({ phase, round, endsAt: null, left: phaseLength({ phase, longFocus }) });
    toast?.(`${phase === "Focus" ? "Break" : "Focus"} finished while you were away`);
  }, [resumed.finishedWhileAway, phase, round, longFocus, setSaved, toast]);

  // A changed round length only applies to a phase that is not already running,
  // the way it did before — moving the dial should not shorten the sprint you
  // are in the middle of.
  useEffect(() => {
    if (running) return;
    setLeft(phaseLength({ phase, longFocus }));
  }, [phase, longFocus, running]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const remaining = remainingOf(saved, Date.now(), longFocus);
      if (remaining <= 0) {
        const next = nextPhase(phase, round);
        setSaved({
          phase: next.phase,
          round: next.round,
          endsAt: autoStart
            ? Date.now() + phaseLength({ phase: next.phase, longFocus }) * 1000
            : null,
          left: phaseLength({ phase: next.phase, longFocus }),
        });
        return;
      }
      setLeft(remaining);
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [running, saved, phase, round, longFocus, autoStart, setSaved]);

  const start = () => {
    if (running) {
      // Pausing writes down what is left, so the deadline can be rebuilt from
      // it whenever the user comes back to it.
      setSaved({ phase, round, endsAt: null, left: remainingOf(saved, Date.now(), longFocus) });
      return;
    }
    const seconds = left > 0 ? left : phaseLength({ phase, longFocus });
    setSaved({ phase, round, endsAt: Date.now() + seconds * 1000, left: seconds });
  };

  const reset = () => {
    const full = phaseLength({ phase, longFocus });
    setSaved({ phase, round, endsAt: null, left: full });
    setLeft(full);
  };

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
              start();
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
              reset();
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: "transparent",
              color: "var(--dim)",
              border: "1px solid var(--line)",
              transition: "background .15s ease, border-color .15s ease",
            }}
            onMouseEnter={(e) => {
              resetTip.anchorProps.onMouseEnter?.();
              e.currentTarget.style.background = "var(--panel2)";
              e.currentTarget.style.borderColor = "var(--accentLine)";
            }}
            onMouseLeave={(e) => {
              resetTip.anchorProps.onMouseLeave?.();
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--line)";
            }}
            onFocus={resetTip.anchorProps.onFocus}
            onBlur={resetTip.anchorProps.onBlur}
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
