import { Suspense, lazy, useMemo } from "react";
import { MONO, pill } from "@daybreak/sdk";
import { getWidget, resolveOptions, resolveRate, resolveSize } from "../widgets/registry";
import { Drawer, DrawerHeader, Pill, Section, Slider, Toggle } from "./primitives";

const panelCache = new Map();
function panelFor(manifest) {
  if (!manifest.settingsPanel) return null;
  if (!panelCache.has(manifest.id)) {
    panelCache.set(
      manifest.id,
      lazy(async () => {
        const mod = await manifest.settingsPanel.load();
        return { default: mod.default || mod };
      })
    );
  }
  return panelCache.get(manifest.id);
}

function WidgetSettingsDrawer({
  open,
  instanceId,
  board,
  widgets,
  onClose,
  onSize,
  onOptions,
  onConfig,
  onRate,
  onRemove,
  toast,
}) {
  const manifest = getWidget(instanceId);
  const record = widgets[instanceId] || {};
  const options = useMemo(
    () => resolveOptions(instanceId, record.options),
    [instanceId, record.options]
  );

  if (!manifest) return null;

  const currentSize = resolveSize(instanceId, board.sizes);
  const rate = resolveRate(instanceId, record.rate);
  const Panel = panelFor(manifest);

  return (
    <Drawer open={open} onClose={onClose} width={340} label={`${manifest.name} settings`}>
      <DrawerHeader
        eyebrow="Widget settings"
        title={manifest.name}
        subtitle={manifest.tagline}
        onClose={onClose}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {manifest.sizes.length > 1 ? (
          <Section title="Size">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {manifest.sizes.map((s) => (
                <Pill
                  key={s.join("x")}
                  active={currentSize[0] === s[0] && currentSize[1] === s[1]}
                  onClick={() => onSize(s)}
                  style={{ fontFamily: MONO, fontSize: 11 }}
                >
                  {s.join("×")}
                </Pill>
              ))}
            </div>
          </Section>
        ) : null}

        {Panel ? (
          <Section title={manifest.settingsPanel.title || "Configure"}>
            <Suspense fallback={<div style={{ height: 40 }} />}>
              <Panel
                config={record.config || {}}
                setConfig={onConfig}
                options={options}
                setOptions={onOptions}
                toast={toast}
              />
            </Suspense>
          </Section>
        ) : null}

        {manifest.options.length ? (
          <Section title="Options">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {manifest.options
                // An option can say which mode it belongs to. Without this the
                // clock offered "Analog face" alongside "Accent dial edge" and
                // "24-hour time" all at once, half of them doing nothing
                // whatever mode you were in. `showIf` is a plain map of
                // option key to accepted values, so it stays declarative and a
                // widget cannot smuggle a function into its manifest.
                .filter((o) => {
                  if (!o.showIf) return true;
                  return Object.entries(o.showIf).every(([key, accepted]) => {
                    const current = options[key] ?? manifest.options.find((x) => x.key === key)?.default;
                    return Array.isArray(accepted)
                      ? accepted.includes(current)
                      : accepted === current;
                  });
                })
                .map((o) => {
                // Options started out boolean-only; enum and number let a
                // widget ask for a choice or a count without needing its own
                // settings panel.
                if (o.type === "enum") {
                  return (
                    <div key={o.key}>
                      <div style={{ fontSize: 13, marginBottom: 7 }}>{o.label}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {o.of.map((choice) => (
                          <Pill
                            key={choice}
                            active={options[o.key] === choice}
                            onClick={() => onOptions({ [o.key]: choice })}
                            style={{ fontSize: 11, padding: "5px 10px" }}
                          >
                            {o.labels?.[choice] || choice}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (o.type === "number") {
                  return (
                    <Slider
                      key={o.key}
                      label={o.label}
                      min={o.min ?? 0}
                      max={o.max ?? 10}
                      step={o.step ?? 1}
                      suffix={o.suffix || ""}
                      value={Number(options[o.key] ?? o.default ?? 0)}
                      onChange={(v) => onOptions({ [o.key]: v })}
                    />
                  );
                }
                return (
                  <Toggle
                    key={o.key}
                    label={o.label}
                    on={!!options[o.key]}
                    onChange={() => onOptions({ [o.key]: !options[o.key] })}
                  />
                );
              })}
            </div>
          </Section>
        ) : null}

        {manifest.refresh ? (
          <Section title="Refresh">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {manifest.refresh.map((r) => (
                <Pill key={r} active={rate === r} onClick={() => onRate(r)}>
                  {r}
                </Pill>
              ))}
            </div>
          </Section>
        ) : null}

        {manifest.permissions.chrome.length || manifest.permissions.hosts.length ? (
          <Section title="Access">
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {manifest.permissions.chrome.map((p) => (
                <div
                  key={p}
                  style={{ fontSize: 12, color: "var(--dim)", display: "flex", gap: 9 }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 99,
                      background: "var(--accent)",
                      marginTop: 6,
                      flex: "none",
                    }}
                  />
                  Chrome <code style={{ fontFamily: MONO }}>{p}</code> permission
                </div>
              ))}
              {manifest.permissions.hosts.map((h) => (
                <div
                  key={h}
                  style={{ fontSize: 12, color: "var(--dim)", display: "flex", gap: 9 }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 99,
                      background: "var(--accent)",
                      marginTop: 6,
                      flex: "none",
                    }}
                  />
                  Requests <code style={{ fontFamily: MONO }}>{h}</code>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <div
          style={{
            paddingTop: 14,
            borderTop: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {[
            ["publisher", manifest.author],
            ["version", manifest.version],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: MONO,
                fontSize: 11,
                color: "var(--faint)",
              }}
            >
              <span>{k}</span>
              <span style={{ color: "var(--dim)" }}>{v}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={onRemove}
            style={pill(false, {
              marginTop: 8,
              padding: 9,
              borderRadius: 10,
              fontSize: 13,
              color: "var(--danger)",
              textAlign: "center",
              width: "100%",
            })}
          >
            Remove from home
          </button>
        </div>
      </div>
    </Drawer>
  );
}

export default WidgetSettingsDrawer;
