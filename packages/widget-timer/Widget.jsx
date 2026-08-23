import { useEffect, useRef, useState } from "react";
import { LuPause, LuPlay, LuRotateCcw } from "react-icons/lu";
import { MONO, Tooltip, useMeasuredWidth, useTooltip, useWidgetLocal } from "@daybreak/sdk";
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

  // The word goes only where it genuinely will not fit. The row needs about
  // 197px — roughly 90 for the clock, 10 of gap, 62 for the button, 6 more and
  // 29 for the reset — so the threshold sits just under that rather than at a
  // round number that would drop the label on tiles with room to spare. My
  // first pass used 220 and hid it on a two-column tile that fits it fine.
  //
  // Measured, not the grid span: the same two-column tile is 203px on the
  // default board and 370px on a full-width one, and only one of those is
  // cramped. See useMeasuredWidth.
  const [boxRef, measured] = useMeasuredWidth();
  const tight = measured != null && measured < 195;

  const total = phaseLength({ phase, longFocus });
  const progress = Math.min(100, Math.max(0, ((total - left) / total) * 100));

  return (
    <div
      ref={boxRef}
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
            aria-label={running ? "Pause" : "Start"}
            style={{
              display: "grid",
              placeItems: "center",
              // Fixed so the crossfade between "Start" and "Pause" — different
              // widths — never nudges the reset button beside it. Collapsing to
              // the reset button's own width when there is no room for a word
              // is transitioned rather than swapped, so the row narrows rather
              // than jumping.
              minWidth: tight ? 29 : 62,
              width: tight ? 29 : undefined,
              // Explicit, so it and the round reset button beside it are the
              // same height whatever the font metrics do.
              height: 29,
              padding: tight ? 0 : "0 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: running ? "var(--accent)" : "var(--panel2)",
              color: running ? "var(--onAccent)" : "var(--fg)",
              border: `1px solid ${running ? "transparent" : "var(--line)"}`,
              transition:
                "background .18s ease, border-color .18s ease, color .18s ease, " +
                "min-width .22s cubic-bezier(.2,.8,.2,1), width .22s cubic-bezier(.2,.8,.2,1), padding .22s ease",
            }}
          >
            {/* Keyed on both, so the word crossfades when the timer toggles and
                again when the tile gets too narrow to hold one. */}
            <span
              key={`${running ? "on" : "off"}-${tight ? "icon" : "text"}`}
              style={{ display: "grid", placeItems: "center", animation: "db-fade .2s ease both" }}
            >
              {tight ? (
                running ? (
                  // Filled, and bigger than the 12px first tried: two thin
                  // outlined bars at that size read as almost nothing.
                  <LuPause size={13} fill="currentColor" aria-hidden="true" />
                ) : (
                  <LuPlay size={13} fill="currentColor" aria-hidden="true" />
                )
              ) : running ? (
                "Pause"
              ) : (
                "Start"
              )}
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
            // Matched to the button beside it. It used to be transparent with
            // a border while Start was filled, which read as two different
            // kinds of control rather than a pair — and the raw ↺ character
            // sat on the text baseline, so it was a couple of pixels off centre
            // and a different weight from everything else in the widget.
            style={{
              display: "grid",
              placeItems: "center",
              // The same box as Start: same vertical padding, and a width that
              // makes it a circle at that height rather than a squashed pill.
              width: 29,
              height: 29,
              padding: 0,
              borderRadius: 999,
              cursor: "pointer",
              background: "var(--panel2)",
              color: "var(--dim)",
              border: "1px solid var(--line)",
              transition: "background .15s ease, border-color .15s ease, color .15s ease",
            }}
            onMouseEnter={(e) => {
              resetTip.anchorProps.onMouseEnter?.();
              e.currentTarget.style.borderColor = "var(--accentLine)";
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={(e) => {
              resetTip.anchorProps.onMouseLeave?.();
              e.currentTarget.style.borderColor = "var(--line)";
              e.currentTarget.style.color = "var(--dim)";
            }}
            onFocus={resetTip.anchorProps.onFocus}
            onBlur={resetTip.anchorProps.onBlur}
          >
            <LuRotateCcw size={13} aria-hidden="true" />
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
