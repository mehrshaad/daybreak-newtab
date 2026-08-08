import { useRef, useState } from "react";
import {
  backupFilename,
  download,
  exportBackup,
  parseBackup,
  restoreBuckets,
} from "../core/backup";
import { dropPermission, MONO, requestAllPermissions } from "@daybreak/sdk";
import {
  ACCENTS,
  PAGE_ZOOM_MAX,
  PAGE_ZOOM_MIN,
  WALLPAPERS,
  backgroundSwatch,
} from "../core/tokens";
import { SOURCES } from "../core/suggest";
import { systemTheme } from "../core/useSystemTheme";
import { Drawer, DrawerHeader, Pill, Section, Slider, Toggle } from "./primitives";


function SettingsDrawer({
  open,
  settings,
  theme,
  update,
  onClose,
  onReset,
  onRestore,
  toast,
}) {
  const { appearance, behavior, profile } = settings;
  const suggest = behavior.suggest || { links: true };
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
    <Drawer open={open} onClose={onClose} width={400} label="Settings">
      <DrawerHeader title="Settings" onClose={onClose} />

      <Section title="Appearance" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            ["system", "System"],
            ["dark", "Dark"],
            ["light", "Light"],
          ].map(([value, label]) => (
            <Pill
              key={value}
              active={(appearance.theme || "system") === value}
              onClick={() => update("appearance", { theme: value })}
              style={{ flex: 1, textAlign: "center", padding: 10 }}
            >
              {label}
            </Pill>
          ))}
        </div>
        {(appearance.theme || "system") === "system" ? (
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8 }}>
            Following your {systemTheme()} browser setting.
          </div>
        ) : null}
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
                background: backgroundSwatch(theme, appearance.accent, w),
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
          <Toggle
            label="Blur behind panels"
            on={appearance.blur !== false}
            onChange={() => update("appearance", { blur: appearance.blur === false })}
          />
          <Slider
            label="Page zoom"
            suffix="%"
            min={PAGE_ZOOM_MIN}
            max={PAGE_ZOOM_MAX}
            step={5}
            value={appearance.pageZoom ?? 100}
            onChange={(pageZoom) => update("appearance", { pageZoom })}
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

      <Section title="Search suggestions" style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 8 }}>
          What the search box offers as you type. Each source beyond your quick
          links needs a Chrome permission, asked for only when you switch it on.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SOURCES.map((source) => {
            const on = !!suggest[source.key];
            return (
              <Toggle
                key={source.key}
                label={source.label}
                on={on}
                // The permission request must run inside this click; Chrome
                // rejects one that is not tied to a user gesture.
                onChange={async () => {
                  if (!on && source.permission) {
                    // Requested together, in one call: real site icons in the
                    // results are worth asking for right alongside the source
                    // that will actually produce results to show them next
                    // to. Declining just the icon half of the dialog is not
                    // possible — Chrome shows one combined prompt — so this
                    // only fires when there is already a reason to prompt.
                    const granted = await requestAllPermissions([
                      source.permission,
                      "favicon",
                    ]);
                    if (!granted) {
                      toast(`${source.label} needs the ${source.permission} permission`);
                      return;
                    }
                  }
                  if (on && source.permission) {
                    // Give the permission back when the source is turned off.
                    dropPermission(source.permission);
                  }
                  update("behavior", { suggest: { ...suggest, [source.key]: !on } });
                }}
              />
            );
          })}
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
