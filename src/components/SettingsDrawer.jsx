import { useEffect, useRef, useState } from "react";
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
import { CATEGORIES, CATEGORY_LABELS } from "../core/notices";
import { versionLabel } from "../core/version";
import { SOURCES } from "../core/suggest";
import { systemTheme } from "../core/useSystemTheme";
import { Collapse, Drawer, DrawerHeader, Pill, Section, Slider, Toggle } from "./primitives";


const SWATCH_FADE = 320;

// The swatch's own fill, crossfaded rather than swapped.
//
// Gradients do not interpolate, so `transition: background` does nothing for
// these — picking a new accent repainted all twelve swatches on the same frame
// the page behind them was smoothly crossfading, which read as the picker
// glitching. Backdrop solves this at full size the same way: keep the outgoing
// fill underneath and fade the incoming one over it.
function SwatchFill({ css }) {
  const [layers, setLayers] = useState(() => [{ key: 0, css }]);
  const shown = useRef(css);

  useEffect(() => {
    if (shown.current === css) return;
    shown.current = css;
    setLayers((prev) => {
      const last = prev[prev.length - 1];
      // Only ever one layer underneath, so dragging across the accent row
      // cannot stack up a dozen gradients per swatch.
      return [last, { key: last.key + 1, css }];
    });
  }, [css]);

  // A timer, not animationend: an occluded tab never fires it and the spent
  // layer would sit there for the life of the page.
  useEffect(() => {
    if (layers.length < 2) return undefined;
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), SWATCH_FADE + 60);
    return () => clearTimeout(t);
  }, [layers]);

  return layers.map((layer, i) => (
    <span
      key={layer.key}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        background: layer.css,
        ...(layers.length > 1 && i === layers.length - 1
          ? { animation: `db-fade ${SWATCH_FADE}ms ease both` }
          : null),
      }}
    />
  ));
}

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
  const notices = behavior.notifications || { enabled: true, categories: {} };
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
    <Drawer
      open={open}
      onClose={onClose}
      width={400}
      label="Settings"
      header={<DrawerHeader title="Settings" onClose={onClose} />}
    >

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
        <Collapse open={(appearance.theme || "system") === "system"}>
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8 }}>
            Following your {systemTheme()} browser setting.
          </div>
        </Collapse>
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
                position: "relative",
                overflow: "hidden",
                height: 54,
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0,
                background: "transparent",
                border: `1px solid ${
                  appearance.wall === w ? "var(--accent)" : "var(--line)"
                }`,
              }}
            >
              <SwatchFill css={backgroundSwatch(theme, appearance.accent, w)} />
              <span
                style={{
                  // Above the fill layers, which are positioned.
                  position: "relative",
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
          <div>
            <div style={{ fontSize: 13, marginBottom: 7 }}>Board width</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[
                ["comfortable", "Comfortable"],
                ["wide", "Wide"],
                ["full", "Full"],
              ].map(([value, label]) => (
                <Pill
                  key={value}
                  active={(appearance.boardWidth || "comfortable") === value}
                  onClick={() => update("appearance", { boardWidth: value })}
                  style={{ fontSize: 11, padding: "5px 10px" }}
                >
                  {label}
                </Pill>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
              How far the board spreads on a wide screen.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, marginBottom: 7 }}>Widget labels</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[
                ["both", "Dot & name"],
                ["name", "Name"],
                ["icon", "Dot"],
                ["none", "Neither"],
              ].map(([value, label]) => (
                <Pill
                  key={value}
                  active={(appearance.tileLabels || "both") === value}
                  onClick={() => update("appearance", { tileLabels: value })}
                  style={{ fontSize: 11, padding: "5px 10px" }}
                >
                  {label}
                </Pill>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>
              Hiding both gives that row&rsquo;s height back to the widget.
            </div>
          </div>
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
        <Pill
          onClick={() => update("behavior", { tourDone: false })}
          style={{ marginTop: 10, padding: "8px 14px", fontSize: 13 }}
        >
          Show the welcome card again
        </Pill>
      </Section>

      <Section title="Notifications" style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 8 }}>
          Messages that appear at the bottom of the page. Each kind can be
          silenced on its own — undo prompts and version notices are not the
          same sort of message.
        </div>
        <Toggle
          label="Show notifications"
          on={notices.enabled !== false}
          onChange={() =>
            update("behavior", {
              notifications: { ...notices, enabled: notices.enabled === false },
            })
          }
        />
        <Collapse open={notices.enabled !== false}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingLeft: 12,
              marginTop: 2,
              borderLeft: "1px solid var(--line)",
            }}
          >
            {CATEGORIES.map((key) => (
              <Toggle
                key={key}
                label={CATEGORY_LABELS[key]}
                on={notices.categories?.[key] !== false}
                onChange={() =>
                  update("behavior", {
                    notifications: {
                      ...notices,
                      categories: {
                        ...notices.categories,
                        [key]: notices.categories?.[key] === false,
                      },
                    },
                  })
                }
              />
            ))}
          </div>
        </Collapse>
      </Section>

      <Section title="Search suggestions" style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 8 }}>
          What the search box offers as you type. Answers are worked out here and
          need nothing; every source beyond your quick links needs a Chrome
          permission, asked for only when you switch it on.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Not one of SOURCES: those are places to look things up, each
              gated on a Chrome permission, and this is the box working out an
              answer on its own. It had no setting at all until now — the one
              feature in the search box that could not be turned off. */}
          <Toggle
            label="Answers and conversions"
            on={suggest.answers !== false}
            onChange={() =>
              update("behavior", { suggest: { ...suggest, answers: suggest.answers === false } })
            }
          />
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

      <Section title="About" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--dim)" }}>Version</span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--fg)" }}>
            {versionLabel() || "—"}
          </span>
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
                transition: "border-color .18s ease",
              }}
            >
              {/* Keyed so the label crossfades on toggle instead of snapping. */}
              <span key={confirmReset ? "confirm" : "ask"} style={{ animation: "db-fade .2s ease both" }}>
                {confirmReset ? "Tap again to confirm" : "Reset everything"}
              </span>
            </Pill>
          </div>
        </div>
      </Section>
    </Drawer>
  );
}

export default SettingsDrawer;
