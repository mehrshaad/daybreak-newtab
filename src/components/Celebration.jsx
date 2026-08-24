import { useMemo } from "react";

// Confetti, for finishing the tour.
//
// Deliberately small: a burst from behind the card, forty-odd pieces, gone in
// under two seconds and nothing left running. A celebration that keeps going is
// not a celebration, it is a page that will not settle.
//
// Built from divs and one keyframe rather than a canvas. Forty elements
// animating transform and opacity is work the compositor does without touching
// the main thread, and it costs no library, no canvas sizing and no cleanup
// beyond React unmounting the thing.

const COUNT = 44;
const DURATION = 1500;

// The board's own palette. Confetti in colours the app never uses would look
// borrowed from somewhere else.
const COLOURS = ["#6f9bff", "#7de2b8", "#ffb26f", "#ff8fb1", "#c79bff", "#f5d979", "#86d99a"];

// A tiny deterministic generator, seeded per mount. Math.random would do, but
// this way the same burst can be reproduced from a seed if it ever needs
// looking at, and every piece is decided in one place.
function pieces(seed) {
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: COUNT }, (_, i) => {
    // Fired upward and outward, so it arcs rather than falling straight down.
    const angle = -90 + (rand() - 0.5) * 130;
    const speed = 120 + rand() * 260;
    const radians = (angle * Math.PI) / 180;
    return {
      id: i,
      x: Math.cos(radians) * speed,
      y: Math.sin(radians) * speed,
      drop: 140 + rand() * 220,
      spin: (rand() - 0.5) * 900,
      delay: rand() * 140,
      size: 6 + rand() * 6,
      colour: COLOURS[Math.floor(rand() * COLOURS.length)],
      round: rand() > 0.6,
    };
  });
}

function Celebration({ x, y }) {
  const confetti = useMemo(() => pieces(Math.floor(x * 1000 + y) || 1), [x, y]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: 0,
        height: 0,
        // Never in the way of the card it is celebrating.
        pointerEvents: "none",
        zIndex: 96,
      }}
    >
      {confetti.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * (p.round ? 1 : 0.5),
            borderRadius: p.round ? 999 : 2,
            background: p.colour,
            // Every piece animates the same keyframe and differs only in these
            // custom properties, so there is one animation in the stylesheet
            // rather than forty-four.
            "--fly-x": `${p.x}px`,
            "--fly-y": `${p.y}px`,
            "--fly-drop": `${p.drop}px`,
            "--fly-spin": `${p.spin}deg`,
            animation: `db-confetti ${DURATION}ms cubic-bezier(.15,.6,.4,1) ${p.delay}ms both`,
          }}
        />
      ))}
    </div>
  );
}

export default Celebration;
