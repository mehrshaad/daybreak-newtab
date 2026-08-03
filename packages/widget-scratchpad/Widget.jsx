import { MONO, useWidgetLocal } from "@daybreak/sdk";

// Note text lives in the local bucket, not in synced settings: the whole
// settings object shares one 8KB chrome.storage.sync item and a long note
// would crowd out everything else.
function Scratchpad({ id, options }) {
  const [text, setText, ready] = useWidgetLocal(id, "text", "");

  return (
    <textarea
      value={ready ? text : ""}
      onChange={(e) => setText(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      placeholder={ready ? "Start typing…" : ""}
      aria-label="Scratchpad"
      spellCheck="false"
      style={{
        flex: 1,
        width: "100%",
        resize: "none",
        background: "transparent",
        border: 0,
        outline: "none",
        fontSize: 13,
        lineHeight: 1.7,
        color: "var(--dim)",
        fontFamily: options.monospace ? MONO : "inherit",
        padding: 0,
      }}
    />
  );
}

export default Scratchpad;
