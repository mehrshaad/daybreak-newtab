// Pomodoro phase lengths in seconds. A long break lands after every fourth
// focus round.
//
// Minutes come in from the widget's options. The fallbacks are the lengths
// this shipped with, and they matter: remainingOf and resumeFrom are called
// from a stored run that may predate the options existing.
export const DEFAULT_FOCUS = 25;
export const DEFAULT_BREAK = 5;
export const DEFAULT_LONG_BREAK = 15;

export function phaseLength({ phase, focus, brk, longBreak } = {}) {
  if (phase === "Focus") return (focus || DEFAULT_FOCUS) * 60;
  if (phase === "Long break") return (longBreak || DEFAULT_LONG_BREAK) * 60;
  return (brk || DEFAULT_BREAK) * 60;
}

export function nextPhase(phase, round) {
  if (phase !== "Focus") return { phase: "Focus", round: round + 1 };
  return { phase: round % 4 === 0 ? "Long break" : "Break", round };
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// A run is stored as where it ends, not as how much is left: a new tab page is
// a fresh document every time, so "22 minutes remaining" written down five
// minutes ago is simply wrong by the time anything reads it. A deadline stays
// true no matter how long nobody was looking, and it means two tabs open at
// once agree instead of each counting down its own copy.
export const IDLE = { phase: "Focus", round: 1, endsAt: null, left: null };

// Seconds left in a stored run, at a given moment.
export function remainingOf(state, now, lengths) {
  if (!state) return phaseLength({ phase: "Focus", ...lengths });
  if (state.endsAt) return Math.max(0, (state.endsAt - now) / 1000);
  if (Number.isFinite(state.left)) return Math.max(0, state.left);
  return phaseLength({ phase: state.phase || "Focus", ...lengths });
}

// What a stored run has become by the time it is read back. A deadline that has
// already passed means the phase finished while nobody was watching, so it
// advances once — once and not repeatedly, because rolling a week's absence
// forward through four hundred rounds would be arithmetic, not information.
export function resumeFrom(state, now, { autoStart, ...lengths } = {}) {
  if (!state || !state.phase) return { ...IDLE, running: false };

  const running = !!state.endsAt;
  if (!running) {
    return {
      phase: state.phase,
      round: state.round || 1,
      running: false,
      left: remainingOf(state, now, lengths),
    };
  }

  if (state.endsAt > now) {
    return {
      phase: state.phase,
      round: state.round || 1,
      running: true,
      left: (state.endsAt - now) / 1000,
    };
  }

  const next = nextPhase(state.phase, state.round || 1);
  return {
    phase: next.phase,
    round: next.round,
    // Auto-start would otherwise silently begin a break that started while the
    // browser was closed and is already half over.
    running: false,
    left: phaseLength({ phase: next.phase, ...lengths }),
    finishedWhileAway: true,
    autoStartWanted: !!autoStart,
  };
}
