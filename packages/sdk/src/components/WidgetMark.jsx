import { GLYPHS } from "../glyphs";
import { mark, seedFor } from "../styles";

// The chip that stands for a widget, in the store and on a tile.
//
// The gradient is derived from the widget's id, so it is stable everywhere and
// needs no artwork. A manifest names a glyph to sit on top of it; the names are
// deliberately generic (`clock`, `weather`, `list`) so a widget from another
// repository can pick one without shipping an icon or knowing what set is in
// use. Anything unrecognised falls back to the widget's initial, which is why a
// missing or misspelled glyph can never render an empty chip.

function WidgetMark({ id, glyph, name, size = 22 }) {
  const Glyph = GLYPHS[glyph];
  // The gradients are mid-tone, so the near-black the design puts on the accent
  // reads on every one of them.
  const ink = "#0a0b0e";
  return (
    <div
      style={{ ...mark(seedFor(id), size), display: "grid", placeItems: "center" }}
      aria-hidden="true"
    >
      {Glyph ? (
        <Glyph size={Math.round(size * 0.52)} color={ink} strokeWidth={2.4} />
      ) : (
        <span
          style={{
            fontSize: Math.round(size * 0.44),
            fontWeight: 600,
            color: ink,
            lineHeight: 1,
          }}
        >
          {String(name || id).trim().charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default WidgetMark;
