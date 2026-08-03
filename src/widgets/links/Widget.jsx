import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import IconTile from "../../components/IconTile";
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
    return new URL(href).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return "Link";
  }
}

function Links({ options, config, setConfig, editing, focused }) {
  const { hideLabels, newTab } = options;
  const items = Array.isArray(config.items) ? config.items : DEFAULTS;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const open = (url) => {
    if (newTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${focused ? 6 : 4}, 1fr)`,
        gap: 8,
        flex: 1,
        alignContent: "center",
        minWidth: 0,
      }}
    >
      {items.map((link) => (
        <button
          key={link.id}
          type="button"
          title={link.url}
          onClick={(e) => {
            e.stopPropagation();
            if (editing) return;
            open(link.url);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "10px 4px",
            borderRadius: 12,
            cursor: editing ? "grab" : "pointer",
            border: 0,
            background: "transparent",
            minWidth: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--panel2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <IconTile name={link.name} size={focused ? 40 : 30} />
          {hideLabels ? null : (
            <span
              style={{
                fontSize: 11,
                color: "var(--dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {link.name}
            </span>
          )}
        </button>
      ))}

      {adding ? (
        <form
          onSubmit={add}
          onClick={(e) => e.stopPropagation()}
          style={{ gridColumn: "span 2", display: "flex", alignItems: "center" }}
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
            gap: 6,
            padding: "10px 4px",
            borderRadius: 12,
            cursor: "pointer",
            border: 0,
            background: "transparent",
            color: "var(--faint)",
          }}
        >
          <span
            style={{
              width: focused ? 40 : 30,
              height: focused ? 40 : 30,
              borderRadius: (focused ? 40 : 30) * 0.28,
              border: "1.5px dashed var(--line)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <LuPlus size={14} />
          </span>
          {hideLabels ? null : <span style={{ fontSize: 11 }}>Add</span>}
        </button>
      )}
    </div>
  );
}

export default Links;
