import { LuCircleAlert, LuCloudOff, LuDownload, LuGauge, LuInfo, LuUndo2, LuX } from "react-icons/lu";
import { useNotices } from "../core/noticeContext";

// The stack of notices. Bottom centre, where the old toast was — but a stack of
// cards rather than one pill, because these can carry an action and a countdown
// and can arrive while another is still on screen.
//
// Suppressed in edit mode: the presets dock owns that spot, and the two
// overlapping is how the old toast behaved before it was given the same guard.

const ICONS = {
  info: LuInfo,
  undo: LuUndo2,
  update: LuDownload,
  performance: LuGauge,
  sync: LuCloudOff,
  error: LuCircleAlert,
};

// Only the ones that mean something is wrong get coloured. A confirmation
// borrowing the accent made every "Saved" read like a warning.
const TINT = {
  info: "var(--faint)",
  undo: "var(--faint)",
  update: "var(--accent)",
  performance: "var(--accent)",
  sync: "var(--danger)",
  error: "var(--danger)",
};

function Notice({ notice, onDismiss, onFreeze }) {
  const Icon = ICONS[notice.category] || LuInfo;
  const tint = TINT[notice.category] || "var(--faint)";

  return (
    <div
      role={notice.category === "error" || notice.category === "sync" ? "alert" : "status"}
      aria-live={notice.category === "error" ? "assertive" : "polite"}
      onMouseEnter={() => onFreeze(notice.id, true)}
      onMouseLeave={() => onFreeze(notice.id, false)}
      // Held as well as hovered: reading one on a touchpad while it counts down
      // is the same problem, and a press is how you stop it there.
      onPointerDown={() => onFreeze(notice.id, true)}
      onPointerUp={() => onFreeze(notice.id, false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 12px 11px 15px",
        borderRadius: 14,
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        boxShadow: "0 16px 44px rgba(0,0,0,.4)",
        backdropFilter: "var(--blur-panel)",
        animation: "db-rise-in .22s ease both",
        maxWidth: "min(520px, 92vw)",
        pointerEvents: "auto",
        overflow: "hidden",
      }}
    >
      {/* The countdown, drawn as the border depleting along the bottom rather
          than as a separate progress bar — it is the notice's own edge running
          out, which reads as time without adding another element to look at. */}
      {notice.duration ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 2,
            width: `${Math.max(0, Math.min(1, notice.remaining)) * 100}%`,
            background: tint,
            opacity: notice.frozen ? 0.35 : 0.85,
            // No transition while frozen, or thawing would animate the bar
            // back to where it should have been instead of holding it.
            transition: notice.frozen ? "opacity .2s ease" : "width .1s linear, opacity .2s ease",
          }}
        />
      ) : null}

      <Icon size={15} style={{ color: tint, flex: "none" }} aria-hidden="true" />

      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--fg)", lineHeight: 1.35 }}>
        {notice.message}
      </div>

      {notice.action ? (
        <button
          type="button"
          onClick={() => {
            notice.action.run();
            onDismiss(notice.id);
          }}
          style={{
            flex: "none",
            padding: "5px 11px",
            borderRadius: 999,
            border: "1px solid var(--accentLine)",
            background: "var(--accentSoft)",
            color: "var(--accentText)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accentLine)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accentSoft)";
          }}
        >
          {notice.action.label}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(notice.id)}
        style={{
          flex: "none",
          display: "grid",
          placeItems: "center",
          width: 22,
          height: 22,
          padding: 0,
          border: 0,
          borderRadius: 999,
          background: "transparent",
          color: "var(--faint)",
          cursor: "pointer",
          transition: "background .15s ease, color .15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--sheetHover)";
          e.currentTarget.style.color = "var(--fg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--faint)";
        }}
      >
        <LuX size={12} />
      </button>
    </div>
  );
}

function Notifications({ hidden }) {
  const { notices, dismiss, freeze } = useNotices();
  if (hidden || !notices.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 26,
        // Auto margins, not translateX(-50%) — the entrance animation ends at
        // `transform: none` and would undo the centering. Same reason as
        // PresetsDock and the toast this replaces.
        marginInline: "auto",
        width: "fit-content",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        // The column itself must not eat clicks meant for the board behind it;
        // each notice turns pointer events back on for itself.
        pointerEvents: "none",
      }}
    >
      {notices.map((notice) => (
        <Notice key={notice.id} notice={notice} onDismiss={dismiss} onFreeze={freeze} />
      ))}
    </div>
  );
}

export default Notifications;
