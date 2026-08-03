import { LuBookmark, LuRotateCcw } from "react-icons/lu";
import { PRESETS, SAVED_LAYOUT } from "../core/schema";
import { MONO, primaryButton, softButton } from "../core/styles";
import { Button, Pill } from "./primitives";

// The floating dock shown in layout-edit mode. Occupies the same spot as the
// toast, which is why toasts are suppressed while editing.
function PresetsDock({
  layoutName,
  hasSaved,
  onPreset,
  onApplySaved,
  onSaveCurrent,
  onAddWidget,
  onDone,
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 8,
        borderRadius: 999,
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 20px 60px rgba(0,0,0,.45)",
        maxWidth: "min(94vw, 860px)",
        flexWrap: "wrap",
        justifyContent: "center",
        animation: "db-in .28s ease both",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--faint)",
          padding: "0 10px",
        }}
      >
        Presets
      </span>

      {Object.keys(PRESETS).map((name) => (
        <Pill
          key={name}
          active={layoutName === name}
          onClick={() => onPreset(name)}
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          {name}
        </Pill>
      ))}

      <div style={{ width: 1, height: 22, background: "var(--line)", margin: "0 2px" }} />

      {/* The user's own layout sits with the presets but behaves differently:
          it holds a snapshot they took, and the icon re-takes it. */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Pill
          active={layoutName === SAVED_LAYOUT}
          onClick={hasSaved ? onApplySaved : onSaveCurrent}
          title={
            hasSaved
              ? "Switch to the layout you saved"
              : "Save the current board as your layout"
          }
          style={{
            padding: "8px 14px",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            ...(hasSaved ? null : { borderStyle: "dashed" }),
          }}
        >
          <LuBookmark size={12} />
          {SAVED_LAYOUT}
        </Pill>
        {hasSaved ? (
          <Button
            onClick={onSaveCurrent}
            title="Reset your saved layout to the board as it is now"
            aria-label="Reset your saved layout to the current board"
            styleFor={softButton}
            style={{
              padding: 0,
              width: 28,
              height: 28,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "transparent",
            }}
            hover={{ background: "var(--panel2)", color: "var(--accent)" }}
          >
            <LuRotateCcw size={13} />
          </Button>
        ) : null}
      </div>

      <div style={{ width: 1, height: 22, background: "var(--line)", margin: "0 2px" }} />

      <Button
        onClick={onAddWidget}
        styleFor={softButton}
        style={{ padding: "8px 14px", background: "transparent" }}
        hover={{ background: "var(--panel2)" }}
      >
        Add widget
      </Button>
      <Button
        onClick={onDone}
        styleFor={primaryButton}
        style={{ padding: "8px 16px" }}
        hover={{ opacity: 0.9 }}
      >
        Done
      </Button>
    </div>
  );
}

export default PresetsDock;
