import { dropOrigin, originOf } from "@daybreak/sdk";

// No field to re-show or edit the address here — it is a credential, and the
// tile's own empty state (with the provider tutorial) is where a new one
// gets pasted in anyway.
function CalendarSettings({ config, setConfig }) {
  const connected = !!config.icsUrl;

  const disconnect = () => {
    try {
      dropOrigin(originOf(config.icsUrl));
    } catch {
      /* address no longer parses; nothing to release */
    }
    setConfig({ icsUrl: null });
  };

  if (!connected) {
    return (
      <div style={{ fontSize: 12, color: "var(--faint)" }}>
        No calendar connected yet — paste a link on the tile itself.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, color: "var(--fg)" }}>Calendar connected.</div>
      <button
        type="button"
        onClick={disconnect}
        style={{
          alignSelf: "flex-start",
          padding: "7px 14px",
          borderRadius: 999,
          fontSize: 12,
          cursor: "pointer",
          background: "var(--panel2)",
          border: "1px solid var(--line)",
          color: "var(--danger)",
        }}
      >
        Disconnect
      </button>
    </div>
  );
}

export default CalendarSettings;
