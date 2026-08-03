// Pomodoro phase lengths in seconds. A long break lands after every fourth
// focus round.
export function phaseLength({ phase, longFocus }) {
  if (phase === "Focus") return (longFocus ? 50 : 25) * 60;
  if (phase === "Long break") return 15 * 60;
  return 5 * 60;
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
