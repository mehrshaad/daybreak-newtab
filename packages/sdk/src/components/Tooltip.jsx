import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clampToViewport } from "../clamp";
import { layoutRect, pageZoomFactor } from "../zoom";
import { usePresence } from "../usePresence";

const GAP = 6;
const EXIT_MS = 120;

// A small hover label, replacing the browser's native `title` attribute
// everywhere one is still wanted — same visual language as every other
// floating surface (db-menu/db-pop-out, --sheet/--line) instead of the OS's
// own tooltip box. Paired with useTooltip, which drives `open` on a delay.
//
// Deliberately its own portalled element rather than a reuse of Popover:
// Popover is role="dialog" and handles outside-click/Escape dismissal, none
// of which applies to a hover-only, aria-hidden label.
function Tooltip({ anchorRef, open, label, placement = "bottom-center" }) {
  const [present, closing] = usePresence(open, EXIT_MS);
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!present) return undefined;
    const reposition = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      // One coordinate space for all of it. offsetWidth is layout pixels and
      // getBoundingClientRect is visual ones, and `left` below is read as
      // layout — mixing them put this tooltip at x * zoom. See zoom.js.
      const zoom = pageZoomFactor();
      const a = layoutRect(anchor, zoom);
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const viewportHeight = window.innerHeight / zoom;
      const fitsBelow = a.bottom + GAP + h <= viewportHeight - 12;
      const y = placement === "top-center" || !fitsBelow ? a.top - GAP - h : a.bottom + GAP;
      const x = a.left + (a.width - w) / 2;
      setPos(clampToViewport(x, y, w, h, 12, zoom));
    };
    reposition();

    // Measured again whenever the box changes size under us.
    //
    // The fonts are declared font-display: swap, so a tooltip shown before
    // DM Sans has loaded is measured in the fallback — which is wider, wraps
    // differently against the 240px cap, and leaves the box centred on a width
    // it no longer has. Whether that window is ever hit depends on the
    // machine's font cache, which is exactly the shape of a bug that appears
    // on one computer and nowhere else. A ResizeObserver covers the swap and
    // anything else that resizes the panel after its first layout, without
    // needing to know what did.
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(reposition);
    if (observer && panelRef.current) observer.observe(panelRef.current);

    window.addEventListener("scroll", reposition, { capture: true, passive: true });
    window.addEventListener("resize", reposition);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", reposition, { capture: true });
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present, placement, label]);

  if (!present || !label) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="presentation"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        zIndex: 100,
        maxWidth: 240,
        padding: "5px 10px",
        borderRadius: 8,
        background: "var(--sheet)",
        border: "1px solid var(--line)",
        backdropFilter: "var(--blur-panel)",
        boxShadow: "0 8px 24px rgba(0,0,0,.28)",
        fontSize: 11,
        lineHeight: 1.35,
        color: "var(--fg)",
        // Wraps rather than running on. With nowrap the maxWidth above did
        // nothing useful: a long label overflowed its own rounded box and
        // painted past the border, and since the box is centred on the anchor
        // by its own offsetWidth, the ink ended up sitting off to one side of
        // where it was supposed to be. Wrapping is what makes the box actually
        // contain what it is measuring.
        textAlign: "center",
        pointerEvents: "none",
        animation: closing
          ? `db-pop-out ${EXIT_MS}ms ease both`
          : "db-menu .14s cubic-bezier(.2,.8,.2,1) both",
      }}
    >
      {label}
    </div>,
    document.body
  );
}

export default Tooltip;
