import { LuBookmark, LuRotateCcw, LuWandSparkles } from "react-icons/lu";
import { PRESETS, SAVED_LAYOUT } from "../core/schema";
import { Appear, HOVER_LIFT, MONO, primaryButton, softButton } from "@daybreak/sdk";
import { Button, Pill } from "./primitives";

// The floating dock shown in layout-edit mode. Occupies the same spot as the
// toast, which is why toasts are suppressed while editing.
function PresetsDock({
  closing,
  layoutName,
  hasSaved,
  onPreset,
  onApplySaved,
  onSaveCurrent,
  onAutoArrange,
  onAddWidget,
  onDone,
}) {
  return (
    <div
      style={{
        position: "fixed",
        // Centred with auto margins rather than translateX(-50%): the db-in
        // keyframes end at `transform: none`, and an animation with fill both
        // outranks an inline style, so a transform-based centre gets wiped the
        // moment the entrance finishes.
        left: 0,
        right: 0,
        marginInline: "auto",
        width: "fit-content",
        bottom: 24,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 8,
        borderRadius: 999,
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        backdropFilter: "var(--blur-panel)",
        boxShadow: "0 20px 60px rgba(0,0,0,.28)",
        // One line whenever the viewport allows; wrap only as a last resort.
        maxWidth: "calc(100vw - 32px)",
        flexWrap: "nowrap",
        overflowX: "auto",
        scrollbarWidth: "none",
        justifyContent: "center",
        // Sinks back out on the way to being unmounted; App keeps it around
        // for the length of this animation.
        animation: closing
          ? "db-rise-out .22s ease both"
          : "db-rise-in .3s cubic-bezier(.2,.8,.2,1) both",
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
        <Appear open={hasSaved} style={{ display: "flex" }}>
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
            hover={{ ...HOVER_LIFT, color: "var(--accent)" }}
          >
            <LuRotateCcw size={13} />
          </Button>
        </Appear>
      </div>

      <div style={{ width: 1, height: 22, background: "var(--line)", margin: "0 2px" }} />

      {/* Repacks what is already on the board; never adds or removes a widget. */}
      <Button
        onClick={onAutoArrange}
        title="Tidy the current widgets into neat rows"
        styleFor={softButton}
        style={{
          padding: "8px 13px",
          background: "transparent",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          whiteSpace: "nowrap",
        }}
        hover={{ ...HOVER_LIFT, color: "var(--accent)" }}
      >
        <LuWandSparkles size={13} />
        Auto arrange
      </Button>

      <Button
        onClick={onAddWidget}
        styleFor={softButton}
        style={{ padding: "8px 14px", background: "transparent" }}
        hover={HOVER_LIFT}
      >
        Add widget
      </Button>
      <Button
        onClick={onDone}
        styleFor={primaryButton}
        style={{ padding: "8px 16px" }}
        hover={{ opacity: 0.92, transform: "translateY(-1px)" }}
      >
        Done
      </Button>
    </div>
  );
}

export default PresetsDock;
