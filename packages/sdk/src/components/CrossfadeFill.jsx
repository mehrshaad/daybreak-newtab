import { useEffect, useRef, useState } from "react";

// A background that changes by fading rather than by swapping.
//
// Gradients do not interpolate, so `transition: background` does nothing for
// one — the paint simply changes on a frame. Everywhere else in this app a
// change of state eases, so a tile whose colour snaps is the one thing on
// screen that looks like a bug.
//
// The trick is to keep the outgoing fill underneath and fade the incoming one
// over it. This started life inside the settings drawer for the accent
// swatches, where picking an accent repainted all sixteen on the same frame the
// page behind them was smoothly crossfading and read as the picker glitching.
// It is in the SDK now because an icon tile needs exactly the same thing when
// somebody picks its colour, and two copies of a trick like this drift.
//
// Render it inside a `position: relative` box with `overflow: hidden` and give
// that box the border radius; the layers inherit it.
export const FILL_FADE = 320;

function CrossfadeFill({ css, ms = FILL_FADE }) {
  const [layers, setLayers] = useState(() => [{ key: 0, css }]);
  const shown = useRef(css);

  useEffect(() => {
    if (shown.current === css) return;
    shown.current = css;
    setLayers((prev) => {
      const last = prev[prev.length - 1];
      // Only ever one layer underneath, so dragging along a row of swatches
      // cannot stack up a dozen gradients per tile.
      return [last, { key: last.key + 1, css }];
    });
  }, [css]);

  // A timer, not animationend: an occluded tab never fires that event and the
  // spent layer would sit there for the life of the page.
  useEffect(() => {
    if (layers.length < 2) return undefined;
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), ms + 60);
    return () => clearTimeout(t);
  }, [layers, ms]);

  return layers.map((layer, i) => (
    <span
      key={layer.key}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        background: layer.css,
        ...(layers.length > 1 && i === layers.length - 1
          ? { animation: `db-fade ${ms}ms ease both` }
          : null),
      }}
    />
  ));
}

export default CrossfadeFill;
