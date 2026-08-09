import { greeting, MONO } from "@daybreak/sdk";

// The design's hero carried invented copy ("2 meetings, 4 open tasks, and clear
// skies until Thursday"). This builds the same line from what is actually on
// the board, and simply omits any part it cannot source.
function Hero({ name, summary, layoutName, tileCount, onContextMenu }) {
  return (
    <div
      onContextMenu={onContextMenu}
      style={{
        padding: "16px 28px 22px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "24px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "clamp(24px, 3.2vw, 34px)",
            fontWeight: 500,
            letterSpacing: "-.02em",
            margin: 0,
          }}
        >
          {greeting(name)}
        </h1>
        {summary ? (
          <div style={{ fontSize: "14px", color: "var(--dim)", marginTop: "4px" }}>
            {summary}
          </div>
        ) : null}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: "11px",
          color: "var(--faint)",
          textAlign: "right",
          lineHeight: 1.7,
        }}
      >
        <div>
          {layoutName} layout · {tileCount} {tileCount === 1 ? "widget" : "widgets"}
        </div>
        <div>right-click a tile for its menu · esc to close</div>
      </div>
    </div>
  );
}

export default Hero;
