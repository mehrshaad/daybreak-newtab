import { useEffect, useMemo, useState } from "react";
import { MONO, daysUntilPhase, moonPhase, moonPhaseName } from "@daybreak/sdk";
import { litPath, whenLabel } from "./terminator";

// The moon's illuminated fraction changes by about 3% a day, so once every ten
// minutes is already far finer than the drawing can express. The interval is
// only here so a tab left open overnight is not still showing last evening.
const TICK = 600000;

const R = 46;

function Moon({ options, size }) {
  const { showNext, showPercent, tint } = options;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), TICK);
    return () => clearInterval(t);
  }, []);

  const moon = useMemo(() => {
    const { phase, illumination } = moonPhase(now);
    return {
      phase,
      illumination,
      name: moonPhaseName(phase),
      toFull: daysUntilPhase(phase, 0.5),
      toNew: daysUntilPhase(phase, 0),
    };
  }, [now]);

  const lit = tint === "accent" ? "var(--accent)" : "#e9ecf2";
  const tall = size?.[1] >= 3;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: tall ? "column" : "row",
        alignItems: "center",
        justifyContent: tall ? "center" : "space-between",
        gap: tall ? 12 : 14,
        flex: 1,
        minHeight: 0,
      }}
    >
      <svg
        viewBox={`${-R - 4} ${-R - 4} ${(R + 4) * 2} ${(R + 4) * 2}`}
        style={{ width: tall ? 108 : 86, height: tall ? 108 : 86, flex: "none", display: "block" }}
        role="img"
        aria-label={`${moon.name}, ${Math.round(moon.illumination * 100)}% lit`}
      >
        <defs>
          {/* Light falls off towards the limb — the moon is a sphere, and a
              flat fill is the one thing that makes it read as a sticker. */}
          <radialGradient id="db-moon-lit" cx="38%" cy="32%" r="78%">
            <stop offset="0%" stopColor={lit} stopOpacity="1" />
            <stop offset="100%" stopColor={lit} stopOpacity=".76" />
          </radialGradient>
          <radialGradient id="db-moon-halo">
            <stop offset="55%" stopColor={lit} stopOpacity=".22" />
            <stop offset="100%" stopColor={lit} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Its own patch of night sky. Without it the light theme drew a
            near-white lit face on a near-white tile over a near-white unlit
            disc: no moon, and no terminator either. It also matches the Sun
            widget, which carries its own sky for the same reason. */}
        <circle cx="0" cy="0" r={R + 4} fill="#12141d" />
        {/* Earthshine: the unlit face is not invisible, it is faintly there. */}
        <circle cx="0" cy="0" r={R} fill="rgba(255,255,255,.07)" />
        <circle cx="0" cy="0" r={R + 3} fill="url(#db-moon-halo)" />

        {/* One path, recomputed from the phase, so the terminator is where it
            really is on any given night and slides as the month turns. The
            transition means a redraw is a movement rather than a jump. */}
        <path d={litPath(moon.phase, R)} fill="url(#db-moon-lit)" style={{ transition: "d 1.5s linear" }} />
      </svg>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
          alignItems: tall ? "center" : "flex-start",
          textAlign: tall ? "center" : "left",
        }}
      >
        <div style={{ fontSize: 14, color: "var(--fg)", fontWeight: 500 }}>{moon.name}</div>
        {showPercent ? (
          <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(moon.illumination * 100)}% lit
          </div>
        ) : null}
        {showNext ? (
          <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)", lineHeight: 1.6 }}>
            <div>Full {whenLabel(moon.toFull)}</div>
            <div>New {whenLabel(moon.toNew)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Moon;
