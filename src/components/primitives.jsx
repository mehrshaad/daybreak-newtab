import { useEffect, useRef } from "react";
import { CONTROL_TRANSITION, pill, toggleStyles, useHover, usePresence } from "@daybreak/sdk";

// Height-animated show/hide for content in normal flow.
//
// grid-template-rows 1fr <-> 0fr animates the *real* content height, so there is
// no max-height guess to get wrong and whatever sits below slides into place
// instead of jumping. The child stays mounted, so there is nothing to hold on to
// for the exit.
export function Collapse({ open, children }) {
  return (
    <div
      aria-hidden={open ? undefined : true}
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows .34s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div
        style={{
          overflow: "hidden",
          minHeight: 0,
          opacity: open ? 1 : 0,
          // Fades out ahead of the collapse and in behind it, so the content is
          // never half-clipped and legible at the same time.
          transition: open ? "opacity .26s ease .06s" : "opacity .18s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
      // First so a caller's own transition still wins.
      style={{ transition: CONTROL_TRANSITION, ...base, ...(hovered ? hover : null) }}
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
        transition: "background .18s ease",
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
  // Drives the filled portion of the custom track styled in base.scss.
  const fill = `${((value - min) / (max - min)) * 100}%`;
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
        style={{ width: "100%", "--range-fill": fill }}
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

export function Drawer({ open, onClose, width = 340, label, header, children }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const [present, closing] = usePresence(open, EXIT_MS);

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
          backdropFilter: "var(--blur-sheet)",
          boxShadow: "-18px 0 50px rgba(0,0,0,.22)",
          // The panel itself no longer scrolls: it is a column with a fixed
          // header and a scrolling body below it, so the title and the close
          // button stay put while the settings move. A sticky header inside one
          // scroller would have worked too, but the padding then has to scroll
          // out from under it and the shadow it needs to cast over departing
          // content is guesswork.
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: closing
            ? `db-slide-out ${EXIT_MS}ms ease both`
            : "db-slide-in .3s cubic-bezier(.2,.8,.2,1) both",
          outline: "none",
        }}
      >
        {header ? (
          <div style={{ flex: "none", padding: "24px 24px 10px" }}>{header}</div>
        ) : null}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            // Vertical only. A drawer is a fixed-width column of settings; if
            // something inside it ever fails to fit, the answer is to wrap or
            // truncate it, never to make the whole panel slide sideways.
            overflowY: "auto",
            overflowX: "hidden",
            // The board behind is taller than the viewport, so it has a
            // scrollbar of its own. Without this, a wheel that reaches the end
            // of the drawer keeps going into the page underneath: the board
            // slides away behind the panel while the user is only trying to
            // reach the last setting, and closing the drawer leaves them
            // somewhere they never meant to scroll to.
            overscrollBehavior: "contain",
            padding: header ? "0 24px 24px" : "24px",
          }}
        >
          {children}
        </div>
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
          // No trailing margin: the drawer's fixed header region owns the gap
          // to the body now, so a margin here would double it.
          marginBottom: eyebrow ? "6px" : 0,
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

export function Section({ title, children, style, ...rest }) {
  return (
    // ...rest so a caller can hang a data-* handle on a section — the tour uses
    // them to point at one, and threading a prop per section would be worse.
    <div style={style} {...rest}>
      <div className="db-label" style={{ marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
