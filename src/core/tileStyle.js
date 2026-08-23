// Ported from `tileStyle()` in design/Daybreak.dc.html. Kept as a pure
// function of (appearance, tile state) so the zoom behaviour is testable
// without mounting the board.

import { tileFill, tileSurfaces } from "./tokens";

export function tileStyle({
  theme = "dark",
  tint = null,
  radius = 18,
  alpha = 100,
  blur = true,
  size = [4, 2],
  columns = 12,
  editing = false,
  menuTarget = false,
  zoomed = false,
  focused = false,
  zoomMode = "Camera",
  panelOpen = false,
}) {
  const dark = theme !== "light";
  // A tile can never span more columns than the grid has, or it overflows the
  // page on a narrow window.
  const w = Math.min(size[0], columns);
  const h = size[1];
  // The opacity slider maps straight through: 100% is a fully opaque tile, 0%
  // leaves only the content floating on the page. The surface colour is the
  // theme's own panel colour, so a solid tile is a dark card in dark mode
  // rather than a white one — moved a fraction toward the tile's own colour
  // when it has been given one. See tileFill.
  const fill = tileFill(theme, alpha, tint);

  const base = {
    // Inputs, buttons and rows inside a coloured tile follow its colour. The
    // widgets need no changes for this: they already paint with var(--panel),
    // and these override what that resolves to within this tile. See
    // tileSurfaces.
    ...tileSurfaces(theme, tint),
    // Positioned so edit-mode chrome can float over the tile instead of taking
    // part in its layout.
    position: "relative",
    gridColumn: `span ${w}`,
    gridRow: `span ${h}`,
    display: "flex",
    flexDirection: "column",
    padding: "16px 18px",
    borderRadius: `${radius}px`,
    background: fill,
    // Frosted glass when blur is on, plain translucency when it is off.
    backdropFilter: blur ? "var(--blur-tile)" : "none",
    WebkitBackdropFilter: blur ? "var(--blur-tile)" : "none",
    border: "1px solid var(--line)",
    // Tiles clip their content. That clip is what made a dragged app icon
    // vanish once it left the tile; base.scss lifts it via :has() while a
    // nested drag is in flight, which needs !important to beat this inline
    // value.
    overflow: "hidden",
    // With click-to-zoom off there is nothing to click a tile for, so it must
    // not advertise itself as clickable. Dragging starts from the handle, not
    // the tile body, even in edit mode — so editing does not change this.
    cursor: zoomMode === "None" ? "default" : "pointer",
    // background-color and backdrop-filter are here so a theme flip, an
    // opacity change or the blur toggle ease in rather than snapping.
    transition:
      "transform .3s cubic-bezier(.22,1,.36,1), opacity .3s, border-color .2s, " +
      "box-shadow .3s, background-color .34s ease, backdrop-filter .34s ease, " +
      // `scale` is its own property here, not part of `transform`, so it needs
      // naming separately — without it the 1.02 lift a dragged tile carries
      // snaps back the instant the drag ends.
      "scale .2s ease",
    boxShadow: dark
      ? "0 1px 0 rgba(255,255,255,.04) inset"
      : "0 1px 2px rgba(20,22,28,.05)",
  };

  if (editing) base.boxShadow = "0 0 0 1px var(--accentLine) inset";
  if (menuTarget) base.boxShadow = "0 0 0 1.5px var(--accent) inset";

  if (!zoomed) return base;

  const lifted = dark ? "rgba(28,30,38,.98)" : "rgba(255,255,255,.99)";
  // Expand mode leaves room for the widget-settings drawer when it is open.
  const right = panelOpen ? "calc(340px + 3vw)" : "3vw";

  if (!focused) {
    // Camera zoom reads as moving in on a physical board, so neighbours stay
    // solid and are simply cropped by the viewport — dimming them to 0.35
    // broke the illusion. Expand and Spotlight *are* overlays, so for those
    // the board really should recede.
    return {
      ...base,
      opacity: zoomMode === "Camera" ? 1 : 0.2,
      pointerEvents: "none",
    };
  }

  if (zoomMode === "Camera") {
    // Deliberately identical to the unzoomed tile apart from the cursor. A
    // lifted background and a 120px drop shadow made this read as a modal
    // being brought toward the screen; a page zoom should magnify the tile
    // exactly as it sits on the board, changing nothing about how it looks.
    return { ...base, position: "relative", cursor: "default" };
  }

  if (zoomMode === "Expand") {
    return {
      ...base,
      position: "fixed",
      top: "86px",
      left: "3vw",
      right,
      bottom: "3vh",
      zIndex: 36,
      padding: "34px 38px",
      borderRadius: "22px",
      cursor: "default",
      background: lifted,
      boxShadow: "0 40px 140px rgba(0,0,0,.5)",
    };
  }

  // Spotlight
  return {
    ...base,
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: "min(760px, 72vw)",
    height: "min(470px, 64vh)",
    zIndex: 36,
    padding: "32px 36px",
    borderRadius: "20px",
    cursor: "default",
    background: lifted,
    boxShadow: "0 40px 140px rgba(0,0,0,.5)",
  };
}

// Camera zoom: translate + scale the whole board so the clicked tile lands in
// the middle of the free space under the header. Ported from `focusTile()`.
//
// The target width is 78% of the viewport (the design used 62%) and the ceiling
// is 3.2x, which lands close to the ~3x the reference site settles on and makes
// the move read as a decisive push-in rather than a nudge.
export function cameraFor(tileRect, boardRect, viewport, headerHeight = 78) {
  const { innerWidth: vw, innerHeight: vh } = viewport;
  const scale = Math.min(
    (vw * 0.78) / tileRect.width,
    (vh - headerHeight - 56) / tileRect.height,
    3.2
  );
  return {
    ox: tileRect.left + tileRect.width / 2 - boardRect.left,
    oy: tileRect.top + tileRect.height / 2 - boardRect.top,
    tx: vw / 2 - (tileRect.left + tileRect.width / 2),
    ty: (headerHeight + vh) / 2 - (tileRect.top + tileRect.height / 2),
    s: scale,
  };
}

// The camera wrapper deliberately carries NO transform or will-change unless a
// Camera zoom is actually running. Both properties make an element a stacking
// context *and* a containing block for fixed-position descendants, which would
// pin Expand/Spotlight tiles to the board box instead of the viewport.
//
// While Camera zoom is active it also lifts above the scrim (z-index 30): the
// transform makes the wrapper a stacking context, so the focused tile's own
// z-index can no longer escape it, and without this the scrim would dim the
// very tile being focused. Unfocused tiles are dimmed by their own opacity.
// Timing lifted from the reference site (saramazaheri.com), whose board uses
// `transform .65s cubic-bezier(.5,.05,.2,1)` — a slow, weighted start that
// settles rather than the springier curve the prototype had.
export const CAMERA_TRANSITION = "transform .65s cubic-bezier(.5,.05,.2,1)";

export function cameraStyle(cam, active) {
  const style = { transition: CAMERA_TRANSITION };
  if (!cam || !active) return style;
  return {
    ...style,
    position: "relative",
    zIndex: 36,
    willChange: "transform",
    transformOrigin: `${cam.ox}px ${cam.oy}px`,
    transform: `translate(${Math.round(cam.tx)}px, ${Math.round(
      cam.ty
    )}px) scale(${cam.s.toFixed(3)})`,
  };
}
