import { MONO, primaryButton, softButton } from "../core/styles";
import { PRESETS } from "../core/schema";
import { Button, Pill } from "./primitives";

// The floating dock shown in layout-edit mode. Occupies the same spot as the
// toast, which is why toasts are suppressed while editing.
function PresetsDock({ layoutName, onPreset, onAddWidget, onDone }) {
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
        maxWidth: "min(92vw, 760px)",
        flexWrap: "wrap",
        justifyContent: "center",
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

      <div
        style={{ width: 1, height: 22, background: "var(--line)", margin: "0 4px" }}
      />

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
