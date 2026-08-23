// Shared inline-style factories, ported from the helper methods in
// design/Daybreak.dc.html (pill, toggle, mark). The design styles everything
// inline off CSS custom properties; keeping these as pure functions means the
// look stays consistent and stays testable.

export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export function pill(active, extra) {
  return {
    padding: "7px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    border: `1px solid ${active ? "transparent" : "var(--line)"}`,
    background: active ? "var(--accent)" : "transparent",
    color: active ? "var(--onAccent)" : "var(--dim)",
    fontWeight: active ? 500 : 400,
    transition:
      "background .18s ease, color .18s ease, border-color .18s ease, opacity .18s ease",
    ...extra,
  };
}

export function toggleStyles(on) {
  return {
    track: {
      width: "34px",
      height: "20px",
      borderRadius: "999px",
      padding: "2px",
      display: "flex",
      flex: "none",
      justifyContent: on ? "flex-end" : "flex-start",
      background: on ? "var(--accent)" : "var(--line)",
      transition: "background .2s",
    },
    knob: {
      width: "16px",
      height: "16px",
      borderRadius: "999px",
      background: on ? "var(--onAccent)" : "var(--dim)",
      transition: "all .2s",
    },
  };
}

// Deterministic gradient chip used for widget marks and store cards, so a
// widget keeps the same colour everywhere without shipping artwork.
const MARK_HUES = [0, 40, 120, 190, 250, 300];

export function mark(seed, size = 22) {
  const h = MARK_HUES[Math.abs(Math.round(seed)) % MARK_HUES.length];
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${Math.round(size * 0.3)}px`,
    flex: "none",
    background: `linear-gradient(140deg, oklch(0.72 0.14 ${h}), oklch(0.55 0.12 ${
      (h + 45) % 360
    }))`,
    display: "grid",
    placeItems: "center",
    fontSize: `${Math.round(size * 0.4)}px`,
    fontWeight: 600,
    color: "#0a0b0e",
  };
}

// Turn a widget id into a stable mark seed so colours never shuffle when the
// board is reordered.
export function seedFor(id) {
  let h = 0;
  for (let i = 0; i < String(id).length; i += 1) {
    h = (h * 31 + String(id).charCodeAt(i)) % 997;
  }
  return h;
}

// Shared transition for interactive chrome, so hover and focus feedback lands
// at the same speed everywhere.
export const CONTROL_TRANSITION =
  "background .18s ease, color .18s ease, border-color .18s ease, " +
  "box-shadow .18s ease, transform .18s ease, opacity .18s ease";

// The hover face of a small control sitting on a panel — a button inside a
// settings drawer, a chip in a widget's options. No lift and no shadow: those
// are for the chrome that floats above the board, and inside a panel they read
// as the control coming loose. Just the surface warming under the pointer.
export const HOVER_SOFT = { background: "var(--sheetHover)" };

// Lift applied on hover: enough to be unmistakable, short of bouncy.
export const HOVER_LIFT = {
  background: "var(--panel2)",
  boxShadow: "0 4px 14px rgba(0,0,0,.16)",
  transform: "translateY(-1px)",
};

// One row in a widget's list — Tasks and World Clocks sit side by side on the
// default board, so their rows have to read as the same object. Shared rather
// than copied because the two used to drift: the padding matched on paper, but
// World Clocks' taller mono time made its row 30px against Tasks' 27px, and
// the highlights used different tokens. The height is pinned here so a row
// stays the same size whatever it happens to contain.
export const LIST_ROW_HEIGHT = 30;

// `--panel`, not `--panel2`: the brighter token reads as a pressed state next
// to a daytime World Clocks row.
export const LIST_ROW_HIGHLIGHT = "var(--panel)";

// How far a row's highlight reaches past its text column on each side, out to
// the tile's own padding edge, so it reads as a full-width row.
//
// A row is therefore 2x this WIDER than the column it sits in. Anything that
// scrolls such a list has to allow for that — matching horizontal padding on
// the scroller, so the bleed happens inside it — or the extra width becomes
// scrollable overflow and a vertically-scrolling list grows a horizontal
// scrollbar along the bottom.
export const LIST_BLEED = 8;

export function listRow(extra) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: `${LIST_ROW_HEIGHT}px`,
    padding: `5px ${LIST_BLEED}px`,
    margin: `0 -${LIST_BLEED}px`,
    borderRadius: "8px",
    minWidth: 0,
    transition: "background .15s ease",
    ...extra,
  };
}

// The round 36px header controls.
export function roundControl(extra) {
  return {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    cursor: "pointer",
    background: "var(--panel)",
    border: "1px solid var(--line)",
    display: "grid",
    placeItems: "center",
    color: "var(--fg)",
    flex: "none",
    transition: CONTROL_TRANSITION,
    ...extra,
  };
}

// Pill-shaped secondary button (Store, Add widget, ...).
export function softButton(extra) {
  return {
    padding: "9px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    cursor: "pointer",
    background: "var(--panel)",
    border: "1px solid var(--line)",
    color: "var(--fg)",
    transition: CONTROL_TRANSITION,
    ...extra,
  };
}

export function primaryButton(extra) {
  return {
    padding: "9px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: 0,
    background: "var(--accent)",
    color: "var(--onAccent)",
    transition: CONTROL_TRANSITION,
    ...extra,
  };
}

export const labelStyle = {
  fontFamily: MONO,
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--faint)",
};

// One row in a dropdown menu.
//
// Shared because the app has three of these — the engine picker, the profile
// switcher and the right-click menu — and they had drifted apart in the way
// that matters most: the right-click menu lit its rows on hover and the two
// toolbar menus did not light at all, so the same gesture got feedback in one
// place and silence in the others. None of the three transitioned, so even the
// one that responded snapped rather than faded.
//
// `selected` is the row you are on (the current engine, the current profile);
// `lit` is the pointer being over it, or the tour pointing at it. Both can be
// true at once, and hovering the selected row still deepens it — a row that
// stopped responding once it was chosen reads as disabled.
export function menuRow({ lit = false, selected = false } = {}, extra) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "8px 13px",
    border: 0,
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    background: selected
      ? lit
        ? "var(--accentLine)"
        : "var(--accentSoft)"
      : lit
      ? "var(--sheetHover)"
      : "transparent",
    color: selected ? "var(--accentText)" : "var(--fg)",
    transition: "background .15s ease, color .15s ease",
    ...extra,
  };
}
