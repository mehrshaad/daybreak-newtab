import { useEffect, useRef } from "react";
import { pill, toggleStyles } from "../core/styles";
import { useHover } from "../core/useHover";

export function Pill({ active, children, style, hoverStyle, ...rest }) {
  const [hovered, bind] = useHover();
  return (
    <button
      type="button"
      aria-pressed={active}
      style={{
        ...pill(active, style),
        ...(hovered && !active ? { background: "var(--panel2)", ...hoverStyle } : null),
        ...(hovered && active ? { opacity: 0.88 } : null),
      }}
      {...bind}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Button({ children, styleFor, hover, style, ...rest }) {
  const [hovered, bind] = useHover();
  const base = styleFor ? styleFor(style) : style;
  return (
    <button
      type="button"
      style={{ ...base, ...(hovered ? hover : null) }}
      {...bind}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, label, onChange }) {
  const t = toggleStyles(on);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "10px",
        cursor: "pointer",
        width: "100%",
        background: "transparent",
        border: 0,
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--panel)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: "13px", color: "var(--fg)" }}>{label}</span>
      <span style={t.track}>
        <span style={t.knob} />
      </span>
    </button>
  );
}

export function Slider({ label, value, min, max, step, suffix = "", onChange }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--dim)",
          marginBottom: "6px",
        }}
      >
        <span>{label}</span>
        <span className="db-mono">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)" }}
      />
    </div>
  );
}

// Right-hand sheet used by both settings drawers. Traps Escape, restores focus
// and closes when the backdrop is clicked.
export function Drawer({ open, onClose, width = 340, label, scrim = false, children }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement;
    const node = panelRef.current;
    if (node) {
      const first = node.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (first || node).focus?.();
    }
    return () => {
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {scrim ? (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "var(--scrim)",
          }}
        />
      ) : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px, 100vw)`,
          zIndex: scrim ? 61 : 50,
          background: "var(--sheet)",
          borderLeft: "1px solid var(--line)",
          backdropFilter: "blur(28px)",
          padding: "24px",
          overflow: "auto",
          animation: "db-in .28s ease both",
          outline: "none",
        }}
      >
        {children}
      </div>
    </>
  );
}

export function DrawerHeader({ eyebrow, title, subtitle, onClose }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: eyebrow ? "6px" : "24px",
        }}
      >
        {eyebrow ? (
          <span className="db-label">{eyebrow}</span>
        ) : (
          <span style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-.02em" }}>
            {title}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            cursor: "pointer",
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            lineHeight: 1,
            color: "var(--fg)",
            flex: "none",
          }}
        >
          ×
        </button>
      </div>
      {eyebrow ? (
        <>
          <div
            style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-.02em", marginBottom: "2px" }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: "12px", color: "var(--dim)", marginBottom: "22px" }}>
              {subtitle}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function Section({ title, children, style }) {
  return (
    <div style={style}>
      <div className="db-label" style={{ marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
