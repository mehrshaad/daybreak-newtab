import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clampToViewport } from "../clamp";
import { usePresence } from "../usePresence";

const GAP = 6;
const EXIT_MS = 140;

// An anchored floating panel, portalled to <body>.
//
// The two dropdowns this replaces (search suggestions, city search) were
// `position: absolute` inside a `position: relative` wrapper, which only works
// as long as nothing between them and the wrapper clips overflow. A tile does
// — its own overflow is what keeps a widget from spilling past its corners —
// so those dropdowns needed a `data-dragging="true"` hack to borrow the one
// escape hatch base.scss provides for a held drag. A portal has no ancestor to
// clip it, so nothing like that is needed here: anchor a Popover to anything,
// anywhere, and it always floats free.
//
// Position comes from the anchor's own rect, not from CSS flow, so it works
// the same whether the anchor sits in a tile, the header, or a settings
// drawer. Below the anchor by default; flips above if there is not enough
// room below. Clamped to the viewport with the same math as the context menu.
function Popover({ open, anchorRef, onClose, placement = "bottom-start", width, children }) {
  const [present, closing] = usePresence(open, EXIT_MS);
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  const reposition = () => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const a = anchor.getBoundingClientRect();
    // Resolved once here and carried in state (not recomputed at render time),
    // so the width used to clamp is exactly the width that gets rendered —
    // measuring the panel at one width and then rendering it at another would
    // make the clamp math answer a question about a box that never exists.
    const w = width ?? a.width;
    const h = panel.offsetHeight;

    const fitsBelow = a.bottom + GAP + h <= window.innerHeight - 12;
    const y =
      placement === "top-start" || placement === "top-center" || !fitsBelow
        ? a.top - GAP - h
        : a.bottom + GAP;
    // Centered placements ignore the anchor's own width for x — a hover card
    // over a small icon should sit centred on it, not hang off one edge the
    // way a menu anchored to a wide search box would.
    const x =
      placement === "bottom-center" || placement === "top-center"
        ? a.left + (a.width - w) / 2
        : a.left;

    setPos({ ...clampToViewport(x, y, w, h), width: w });
  };

  // Measured after the panel has real content, so its height is not a guess.
  useLayoutEffect(() => {
    if (!present) return undefined;
    reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present, children, width]);

  useEffect(() => {
    if (!present) return undefined;
    const onScroll = () => reposition();
    // Capture, so scrolling any clipped ancestor (not just the window) still
    // repositions the popover that just escaped it.
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    // Capture so a click on something that itself stops propagation (a tile,
    // say) still closes the popover first.
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!present) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      style={{
        position: "fixed",
        // Until the first measurement lands, render off-screen rather than at
        // (0,0) — at the corner it would flash there for a frame.
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        // Just above a drawer (50), and below everything that should cover a
        // popover: the header's engine dropdown (60), the store (70), a context
        // menu (80), notifications (90), a tooltip (100).
        //
        // It used to be 48, under the drawer, on the assumption that a popover
        // always belonged to the board. Widget settings panels live inside a
        // drawer and open popovers of their own — the shared date picker is
        // one — and those disappeared behind the panel that opened them. A
        // board popover cannot collide with an open drawer in any case, since
        // the board is inset by the drawer's width while it is open.
        zIndex: 52,
        width: pos?.width ?? width ?? "max-content",
        borderRadius: 14,
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        backdropFilter: "var(--blur-panel)",
        boxShadow: "0 22px 60px rgba(0,0,0,.32)",
        overflow: "hidden",
        animation: closing
          ? `db-pop-out ${EXIT_MS}ms ease both`
          : "db-menu .16s cubic-bezier(.2,.8,.2,1) both",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

export default Popover;
