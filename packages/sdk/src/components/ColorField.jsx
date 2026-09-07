import { useRef } from "react";
import { LuPipette } from "react-icons/lu";
import {
  TILE_COLOR_COLUMNS,
  TILE_COLOR_ORDER,
  TILE_COLORS,
  TILE_INKS,
  defaultInk,
  gradientFor,
} from "../tilePalette";
import { labelStyle } from "../styles";

// Picking a tile's colour and the ink on it.
//
// In the SDK because it is a widget control and a second copy is how this
// codebase ended up with three menus that hovered differently — the Bookmarks
// widget will want the same field.
//
// Three kinds of answer in one grid, deliberately: automatic (which draws the
// tile it would actually produce, so it needs no legend), ten presets, and any
// colour at all from the system picker. Twelve cells over six columns, which is
// two full rows — a picker with a hole on its last row reads as unfinished.

const SWATCH = 22;

// The "any colour" swatch, before one has been chosen.
//
// A conic rainbow was the obvious thing and the wrong thing: it is the only
// element in the picker not drawn like a tile, so it read as a control
// borrowed from somewhere else. This is the same 160-degree linear sweep every
// tile and every brand uses, through four of the palette's own colours — so it
// says "a colour, any colour" in the grid's own voice.
const PICKER_SWEEP =
  "linear-gradient(160deg, #ff8f8f, #ffd76f 32%, #4fd8c4 66%, #8a3ff0)";

function Swatch({ label, selected, onPick, background, dashed = false, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onPick}
      style={{
        width: SWATCH,
        height: SWATCH,
        padding: 0,
        borderRadius: 7,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        // The whole border in one declaration — a `border` here plus a
        // `borderColor` in a selected state leaves the swatch with no border at
        // all once React removes the longhand. See shorthandStyles.test.js.
        //
        // Dashed marks the automatic swatch, which is not a colour: it used to
        // draw the tile it would produce, at 20px inside a 22px box, and never
        // quite looked centred however it was aligned. A dashed outline says
        // "no colour chosen" without needing to be centred at all.
        border: `${selected ? 2 : 1}px ${dashed ? "dashed" : "solid"} ${
          selected ? "var(--fg)" : "var(--line)"
        }`,
        background,
        transition: "border-color .15s ease, transform .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}

// The ink buttons, in the same idiom as every other small segmented control.
function InkButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        padding: "5px 8px",
        borderRadius: 8,
        fontSize: 11,
        fontFamily: "inherit",
        textTransform: "none",
        letterSpacing: "normal",
        cursor: "pointer",
        // Active carries the accent the way the app's other pressed controls
        // do, rather than only a darker border.
        border: `1px solid ${active ? "var(--accentLine)" : "var(--line)"}`,
        background: active ? "var(--accentSoft)" : "var(--panel2)",
        color: active ? "var(--accentText)" : "var(--dim)",
        transition: "border-color .15s ease, color .15s ease, background .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function ColorField({
  color,
  ink,
  onColor,
  onInk,
  label = "Tile colour",
  inkLabel = "Icon",
}) {
  const pickerRef = useRef(null);
  // Whichever ink the colour asks for, until the person says otherwise. Shown
  // as the active one rather than left blank, so the control always says what
  // is actually being used.
  const effective = ink || defaultInk(color);
  const custom = color && !TILE_COLORS[color] ? color : "";

  return (
    <>
      <div style={labelStyle}>
        {label}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${TILE_COLOR_COLUMNS}, ${SWATCH}px)`,
            justifyContent: "space-between",
            gap: 6,
            paddingTop: 2,
          }}
        >
          <Swatch
            label="Colour: automatic"
            selected={!color}
            onPick={() => onColor(null)}
            background="transparent"
            dashed
          />

          {TILE_COLOR_ORDER.map((name) => {
            const pair = TILE_COLORS[name];
            return (
              <Swatch
                key={name}
                label={`Colour: ${name}`}
                selected={color === name}
                onPick={() => onColor(name)}
                background={`linear-gradient(160deg, ${pair.from}, ${pair.to})`}
              />
            );
          })}

          {/* Any colour, from the system's own wheel. The input is the control
              — a button that then clicks a hidden input cannot open a native
              picker in every browser — so it is sized to the swatch and given
              the same border and radius. */}
          <span
            style={{
              position: "relative",
              width: SWATCH,
              height: SWATCH,
              display: "grid",
              placeItems: "center",
              borderRadius: 7,
              overflow: "hidden",
              border: custom ? "2px solid var(--fg)" : "1px solid var(--line)",
              background: custom
                ? `linear-gradient(160deg, ${gradientFor(custom).from}, ${gradientFor(custom).to})`
                : PICKER_SWEEP,
              boxShadow: "0 1px 2px rgba(0,0,0,.18)",
              transition: "border-color .15s ease",
            }}
          >
            {custom ? null : (
              // White, like the mark on every other saturated tile in the
              // grid, with the same soft shadow the tiles carry.
              <LuPipette
                size={11}
                aria-hidden
                style={{
                  color: "#fff",
                  pointerEvents: "none",
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,.35))",
                }}
              />
            )}
            <input
              ref={pickerRef}
              type="color"
              value={custom || "#6f9bff"}
              onChange={(e) => onColor(e.target.value)}
              aria-label="Colour: pick any"
              title="Pick any colour"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                padding: 0,
                border: 0,
                background: "transparent",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </span>
        </div>
      </div>

      {/* Always shown, not only once a colour is chosen. The ink applies to
          the automatic tile too — a brand mark or a monogram is drawn in it
          either way — and a control that appears and disappears as you move
          along a row of swatches is harder to use than one that is simply
          there. */}
      <div style={labelStyle}>
        {inkLabel}
        <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
          {TILE_INKS.map((name) => (
            <InkButton
              key={name}
              active={effective === name}
              onClick={() => onInk(ink === name ? null : name)}
            >
              {name === "light" ? "Light" : "Dark"}
            </InkButton>
          ))}
        </div>
        {!ink ? (
          <span style={{ fontSize: 10, color: "var(--faint)", textTransform: "none", letterSpacing: "normal" }}>
            {`Chosen for this colour — tap to fix it`}
          </span>
        ) : null}
      </div>
    </>
  );
}

export default ColorField;
