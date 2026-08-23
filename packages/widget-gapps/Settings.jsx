import { APPS } from "./apps";
import { Button, HOVER_SOFT } from "@daybreak/sdk";

const byKey = new Map(APPS.map((a) => [a.key, a]));

// Dragging an icon out of the grid hides it rather than deleting anything —
// there is nothing else to configure here, just a way back for what got
// hidden that way.
function GappsSettings({ config, setConfig }) {
  const hidden = Array.isArray(config.hidden) ? config.hidden : [];
  const hiddenApps = hidden.map((k) => byKey.get(k)).filter(Boolean);

  if (!hiddenApps.length) {
    return (
      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
        Nothing hidden. Drag an icon out of the grid in edit mode to hide it.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
        {hiddenApps.length} hidden: {hiddenApps.map((a) => a.name).join(", ")}
      </div>
      <Button
        onClick={() => setConfig({ hidden: [] })}
        style={{
          alignSelf: "flex-start",
          padding: "7px 14px",
          borderRadius: 999,
          fontSize: 12,
          cursor: "pointer",
          background: "var(--panel2)",
          border: "1px solid var(--line)",
          color: "var(--fg)",
        }}
        hover={HOVER_SOFT}
      >
        Restore hidden apps
      </Button>
    </div>
  );
}

export default GappsSettings;
