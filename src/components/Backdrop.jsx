import { useEffect, useRef, useState } from "react";

// Crossfades the page background.
//
// The live background is painted on <html> (see App) because that element is
// the canvas and therefore always behind everything. CSS cannot transition it:
// the value is a gradient stack, and gradients do not interpolate — a theme or
// wallpaper change snaps.
//
// So the *previous* background lingers here as a fixed layer sitting above the
// canvas but below all content, and fades out. The new background is revealed
// through it, which reads as a crossfade without needing two live layers or a
// wrapper around the app.
//
// z-index: -1 is safe now that <body> is transparent — a background on body
// would paint over this layer (which is exactly the bug that made the wallpaper
// options look broken).

const FADE = 340;

function Backdrop({ background }) {
  const shown = useRef(background);
  const [outgoing, setOutgoing] = useState(null);

  useEffect(() => {
    if (shown.current === background) return;
    setOutgoing({ key: background, css: shown.current });
    shown.current = background;
  }, [background]);

  // A timer, not just onAnimationEnd: animationend does not arrive while the
  // tab is throttled or occluded, and the layer would then sit there forever
  // holding a composited copy of a background nobody can see.
  useEffect(() => {
    if (!outgoing) return undefined;
    const t = setTimeout(() => setOutgoing(null), FADE + 80);
    return () => clearTimeout(t);
  }, [outgoing]);

  if (!outgoing) return null;

  return (
    <div
      key={outgoing.key}
      aria-hidden="true"
      // Remove the layer as soon as it is invisible so nothing accumulates.
      // Under prefers-reduced-motion the duration collapses and this fires at
      // once, which is the intended behaviour.
      onAnimationEnd={() => setOutgoing(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: outgoing.css,
        backgroundAttachment: "fixed",
        // Its own compositor layer, so fading a full-screen gradient underneath
        // a dozen backdrop-filter tiles stays on the GPU.
        willChange: "opacity",
        animation: `db-out ${FADE}ms ease forwards`,
      }}
    />
  );
}

export default Backdrop;
