import { useRef, useState } from "react";
import {
  backupFilename,
  download,
  exportBackup,
  parseBackup,
  restoreBuckets,
} from "../core/backup";
import { MONO } from "../core/styles";
import { ACCENTS, WALLPAPERS, backgroundSwatch } from "../core/tokens";
import { Drawer, DrawerHeader, Pill, Section, Slider, Toggle } from "./primitives";


function SettingsDrawer({
  settings,
  update,
  onClose,
  onReset,
  onRestore,
  toast,
}) {
  const { appearance, behavior, profile } = settings;
  const fileRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const { data, error } = parseBackup(await file.text());
    if (error) {
      toast(error);
      return;
    }
    await restoreBuckets(data.buckets);
    onRestore(data.settings);
    toast("Backup restored");
  };

  return (
    <Drawer open onClose={onClose} width={400} label="Settings" scrim>
      <DrawerHeader title="Settings" onClose={onClose} />

      <Section title="Appearance" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["dark", "light"].map((t) => (
            <Pill
              key={t}
              active={appearance.theme === t}
              onClick={() => update("appearance", { theme: t })}
              style={{ flex: 1, textAlign: "center", padding: 10 }}
            >
              {t === "dark" ? "Dark" : "Light"}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Accent" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              aria-pressed={appearance.accent === c}
              onClick={() => update("appearance", { accent: c })}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                cursor: "pointer",
                background: c,
                border: 0,
                padding: 0,
                boxShadow:
                  appearance.accent === c
                    ? `0 0 0 2px var(--sheet), 0 0 0 4px ${c}`
                    : "none",
              }}
            />
          ))}
        </div>
      </Section>

      <Section title="Background" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          {WALLPAPERS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={appearance.wall === w}
              onClick={() => update("appearance", { wall: w })}
              style={{
                height: 54,
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0,
                background: backgroundSwatch(appearance.theme, appearance.accent, w),
                border: `1px solid ${
                  appearance.wall === w ? "var(--accent)" : "var(--line)"
                }`,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  color: "var(--fg)",
                  textShadow: "0 1px 3px rgba(0,0,0,.6)",
                }}
              >
                {w}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Click-to-zoom is parked until the interaction is good enough, so the
          picker is not offered. The modes still exist in the schema. */}

      <Section title="Grid" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Slider
            label="Gap"
            suffix="px"
            min={6}
            max={28}
            step={2}
            value={appearance.gap}
            onChange={(gap) => update("appearance", { gap })}
          />
          <Slider
            label="Corner radius"
            suffix="px"
            min={4}
            max={32}
            step={2}
            value={appearance.radius}
            onChange={(radius) => update("appearance", { radius })}
          />
          <Slider
            label="Tile opacity"
            suffix="%"
            min={0}
            max={100}
            step={5}
            value={appearance.alpha}
            onChange={(alpha) => update("appearance", { alpha })}
          />
        </div>
      </Section>

      <Section title="General" style={{ marginBottom: 22 }}>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--fg)" }}>Your name</span>
          <input
            value={profile.name}
            onChange={(e) => update("profile", { name: e.target.value })}
            placeholder="Used in the greeting"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 13,
              color: "var(--fg)",
            }}
          />
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Toggle
            label="Show greeting"
            on={behavior.showGreeting}
            onChange={() =>
              update("behavior", { showGreeting: !behavior.showGreeting })
            }
          />
          <Toggle
            label="Keyboard shortcuts"
            on={behavior.shortcuts}
            onChange={() => update("behavior", { shortcuts: !behavior.shortcuts })}
          />
        </div>
      </Section>

      <Section title="Backup">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
            Exports your layout, settings and widget content as a file on this
            device. Nothing is uploaded.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill
              onClick={async () => {
                download(await exportBackup(), backupFilename());
                toast("Backup downloaded");
              }}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              Export
            </Pill>
            <Pill
              onClick={() => fileRef.current?.click()}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              Import
            </Pill>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={importFile}
              style={{ display: "none" }}
            />
            <Pill
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                setConfirmReset(false);
                onReset();
                toast("Reset to defaults");
              }}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                color: "var(--danger)",
                borderColor: confirmReset ? "var(--danger)" : "var(--line)",
              }}
            >
              {confirmReset ? "Tap again to confirm" : "Reset everything"}
            </Pill>
          </div>
        </div>
      </Section>
    </Drawer>
  );
}

export default SettingsDrawer;
