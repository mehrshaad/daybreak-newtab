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
        left: "50%",
        bottom: "26px",
        transform: "translateX(-50%)",
        zIndex: 90,
        padding: "11px 18px",
        borderRadius: "999px",
        fontSize: "13px",
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        boxShadow: "0 16px 44px rgba(0,0,0,.4)",
        backdropFilter: "blur(20px)",
        animation: "db-in .2s ease both",
        maxWidth: "min(560px, 90vw)",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

export default Toast;
