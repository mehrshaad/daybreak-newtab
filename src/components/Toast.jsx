// Bottom pill for transient feedback. Suppressed in edit mode, where the
// presets dock occupies the same spot.
function Toast({ message, hidden }) {
  if (!message || hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        // Auto margins, not translateX(-50%) — see PresetsDock: the entrance
        // animation ends at `transform: none` and would undo the centering.
        left: 0,
        right: 0,
        marginInline: "auto",
        width: "fit-content",
        bottom: "26px",
        zIndex: 90,
        padding: "11px 18px",
        borderRadius: "999px",
        fontSize: "13px",
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        boxShadow: "0 16px 44px rgba(0,0,0,.4)",
        backdropFilter: "var(--blur-panel)",
        animation: "db-rise-in .22s ease both",
        maxWidth: "min(560px, 90vw)",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

export default Toast;
