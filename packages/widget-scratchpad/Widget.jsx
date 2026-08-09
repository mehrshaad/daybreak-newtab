import { MONO, useWidgetSynced } from "@daybreak/sdk";

const MAX_BYTES = 6000;
// Where the quiet counter starts showing, well before the cap actually bites.
const WARN_AT_BYTES = 5000;

// Note text syncs across signed-in profiles when it fits in its own budget;
// past that it keeps typing working and stays on this device only, rather
// than losing a keystroke or silently failing to save.
function Scratchpad({ id, options }) {
  const [text, setText, ready, overflowed] = useWidgetSynced(id, "text", "", {
    maxBytes: MAX_BYTES,
  });
  const bytes = new Blob([text]).size;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <textarea
        value={ready ? text : ""}
        onChange={(e) => setText(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder={ready ? "Start typing…" : ""}
        aria-label="Scratchpad"
        spellCheck="false"
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          resize: "none",
          background: "transparent",
          border: 0,
          outline: "none",
          fontSize: Number(options.fontSize) || 13,
          lineHeight: 1.7,
          color: "var(--dim)",
          fontFamily: options.monospace ? MONO : "inherit",
          padding: 0,
        }}
      />
      {overflowed ? (
        <div style={{ flex: "none", fontSize: 10, color: "var(--faint)", marginTop: 4 }}>
          Too long to sync — kept on this device only.
        </div>
      ) : bytes >= WARN_AT_BYTES ? (
        <div style={{ flex: "none", fontFamily: MONO, fontSize: 10, color: "var(--faint)", marginTop: 4 }}>
          {bytes.toLocaleString()} / {MAX_BYTES.toLocaleString()} bytes
        </div>
      ) : null}
    </div>
  );
}

export default Scratchpad;
