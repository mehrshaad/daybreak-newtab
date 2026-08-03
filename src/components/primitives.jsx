import { useEffect, useRef, useState } from "react";
import { pill, toggleStyles, useHover } from "@daybreak/sdk";

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

// Right-hand sheet used by both settings drawers.
//
// Deliberately no scrim and no blur: the whole point of the settings drawer is
// watching the board change as you adjust it, so dimming or blurring the thing
// being configured is self-defeating. An invisible click-catcher still closes it
// on an outside click.
//
// Closing is animated too. That needs the panel to stay mounted for the length
// of the exit, so `open` going false starts the animation and unmounting waits
// for it to finish.
const EXIT_MS = 220;

export function Drawer({ open, onClose, width = 340, label, children }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const [present, setPresent] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setPresent(true);
      setClosing(false);
      return undefined;
    }
    if (!present) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      setPresent(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open, present]);

  useEffect(() => {
    if (!present || closing) return undefined;
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
  }, [present, closing]);

  if (!present) return null;

  return (
    <>
      {/* Transparent: catches the outside click without hiding the board. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 49, background: "transparent" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label={label}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px, 100vw)`,
          zIndex: 50,
          background: "var(--sheet)",
          borderLeft: "1px solid var(--line)",
          backdropFilter: "blur(28px)",
          boxShadow: "-18px 0 50px rgba(0,0,0,.22)",
          padding: "24px",
          overflow: "auto",
          animation: closing
            ? `db-slide-out ${EXIT_MS}ms ease both`
            : "db-slide-in .3s cubic-bezier(.2,.8,.2,1) both",
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
