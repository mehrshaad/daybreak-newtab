import { useEffect, useRef, useState } from "react";

// The page background, and the crossfade between two of them.
//
// The background is a stack of radial gradients, which CSS cannot transition —
// gradients do not interpolate. So each background is its own fixed layer and a
// change fades the new one in over the old, then drops the old one.
//
// Both layers sit at a negative z-index: behind every bit of in-flow content,
// above the canvas. That is only safe because <body> is transparent — a
// background on body paints over negative-z-index content, which is exactly the
// bug that once made the wallpaper options look like they did nothing.
//
// Why the layer owns the gradient rather than <html>:
//
// Painting the live background on the canvas and fading the *outgoing* one on a
// layer meant every change rasterised two full-viewport gradient stacks — one
// for the canvas, one for the layer. That showed up as a hitch at the start of a
// wallpaper or accent change. Keeping the background here means the old one is
// already rasterised and only the incoming one is new: one rasterisation per
// change instead of two. <html> keeps a flat base colour, which is what the
// overscroll area needs anyway.

const FADE = 320;

let seq = 0;

function Backdrop({ background }) {
  // Oldest first. One layer at rest, two mid-fade.
  const [layers, setLayers] = useState(() => [{ key: seq++, css: background }]);
  const shown = useRef(background);

  useEffect(() => {
    if (shown.current === background) return;
    shown.current = background;
    setLayers((prev) => [
      // Only ever keep the one visible layer underneath, so flicking through
      // the wallpaper picker cannot stack up eight gradients.
      prev[prev.length - 1],
      { key: seq++, css: background },
    ]);
  }, [background]);

  // A timer rather than onAnimationEnd: animationend does not arrive while the
  // tab is throttled or occluded, and the spent layer would sit there forever.
  useEffect(() => {
    if (layers.length < 2) return undefined;
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), FADE + 60);
    return () => clearTimeout(t);
  }, [layers]);

  return layers.map((layer, i) => {
    const incoming = layers.length > 1 && i === layers.length - 1;
    return (
      <div
        key={layer.key}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          // Incoming sits above outgoing; both stay behind the app.
          zIndex: incoming ? -1 : -2,
          pointerEvents: "none",
          background: layer.css,
          backgroundAttachment: "fixed",
          ...(incoming
            ? {
                // Compositor-only fade, and the hint is dropped with the layer.
                willChange: "opacity",
                animation: `db-fade ${FADE}ms ease both`,
              }
            : null),
        }}
      />
    );
  });
}

export default Backdrop;
