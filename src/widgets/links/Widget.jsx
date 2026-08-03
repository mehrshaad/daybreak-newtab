import { useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import IconGrid from "../../components/IconGrid";
import { moveItem } from "../../core/usePointerReorder";
import { uid } from "../../utils";

const DEFAULTS = [
  { id: "d1", name: "GitHub", url: "https://github.com" },
  { id: "d2", name: "YouTube", url: "https://www.youtube.com" },
  { id: "d3", name: "Gmail", url: "https://mail.google.com" },
  { id: "d4", name: "Drive", url: "https://drive.google.com" },
];

// Accept "github.com" as readily as a full URL.
function normalizeUrl(input) {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).href;
  } catch {
    return null;
  }
}

function nameFromUrl(href) {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "").split(".")[0];
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return "Link";
  }
}

function Links({ options, config, setConfig, size, editing, columns }) {
  const { hideLabels, newTab } = options;
  const items = Array.isArray(config.items) ? config.items : DEFAULTS;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // Columns follow the tile width so icons fill the space at every size.
  const cols = Math.max(3, Math.min(size[0], columns));
  const iconSize = Math.max(24, Math.min(42, Math.round(150 / cols)));

  const gridItems = useMemo(
    () => items.map((l) => ({ key: l.id, name: l.name, title: l.url, iconName: l.name })),
    [items]
  );

  const open = (item) => {
    if (editing) return;
    const link = items.find((l) => l.id === item.key);
    if (!link) return;
    if (newTab) window.open(link.url, "_blank", "noopener,noreferrer");
    else window.location.href = link.url;
  };

  const add = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = normalizeUrl(draft);
    if (!url) return;
    setConfig({ items: [...items, { id: uid(), name: nameFromUrl(url), url }] });
    setDraft("");
    setAdding(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
      <IconGrid
        items={gridItems}
        cols={cols}
        iconSize={iconSize}
        gap={6}
        showLabels={!hideLabels}
        onOpen={open}
        onReorder={(from, to) => setConfig({ items: moveItem(items, from, to) })}
        trailing={
          adding ? (
            <form
              onSubmit={add}
              onClick={(e) => e.stopPropagation()}
              style={{ gridColumn: "span 2", width: "100%", alignSelf: "center" }}
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => !draft && setAdding(false)}
                placeholder="example.com"
                aria-label="Link address"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--panel2)",
                  border: "1px solid var(--line)",
                  outline: "none",
                  fontSize: 12,
                  color: "var(--fg)",
                }}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAdding(true);
              }}
              aria-label="Add a link"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: Math.max(4, Math.round(iconSize * 0.16)),
                padding: `${Math.max(4, Math.round(iconSize * 0.16))}px 2px`,
                borderRadius: 12,
                cursor: "pointer",
                border: 0,
                background: "transparent",
                color: "var(--faint)",
                width: "100%",
              }}
            >
              <span
                style={{
                  width: iconSize,
                  height: iconSize,
                  borderRadius: iconSize * 0.28,
                  border: "1.5px dashed var(--line)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <LuPlus size={Math.max(12, Math.round(iconSize * 0.4))} />
              </span>
              {hideLabels ? null : (
                <span style={{ fontSize: Math.max(9, Math.round(iconSize * 0.3)) }}>Add</span>
              )}
            </button>
          )
        }
      />

    </div>
  );
}

export default Links;
