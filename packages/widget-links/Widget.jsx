import { useMemo, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";
import {
  Appear,
  Favicon,
  IconGrid,
  iconGridSize,
  IconTile,
  MONO,
  moveItem,
  Popover,
  uid,
} from "@daybreak/sdk";

// Add-form fields: a small eyebrow label above each input, matching the
// settings drawer's field styling.
const FIELD_LABEL_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--faint)",
};

const FIELD_INPUT_STYLE = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 8,
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  outline: "none",
  fontSize: 12,
  fontFamily: "inherit",
  textTransform: "none",
  letterSpacing: "normal",
  color: "var(--fg)",
};

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
  const [draftUrl, setDraftUrl] = useState("");
  const [draftName, setDraftName] = useState("");
  const addBtnRef = useRef(null);

  const closeAdd = () => {
    setAdding(false);
    setDraftUrl("");
    setDraftName("");
  };

  // Width decides how many icons fit per row; height decides how big they are.
  // See iconGridSize — deriving the size from the column span made a wider tile
  // draw smaller icons.
  const cols = Math.max(3, Math.min(size[0], columns));
  const iconSize = iconGridSize(size, { hideLabels });

  const gridItems = useMemo(
    () =>
      items.map((l) => ({
        key: l.id,
        name: l.name,
        title: l.url,
        // Both, in that order of authority: the address names the site even
        // when the user called it "Work", and the label still gets its say
        // for an address we don't recognise.
        iconUrl: l.url,
        iconName: l.name,
      })),
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
    const url = normalizeUrl(draftUrl);
    if (!url) return;
    const name = draftName.trim() || nameFromUrl(url);
    setConfig({ items: [...items, { id: uid(), name, url }] });
    closeAdd();
  };

  const remove = (item) =>
    setConfig({ items: items.filter((l) => l.id !== item.key) });

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
      <IconGrid
        items={gridItems}
        cols={cols}
        iconSize={iconSize}
        // Matches the icon-to-label gap inside each item, so horizontal and
        // vertical rhythm read as the same spacing scaled by icon size.
        gap={Math.max(4, Math.round(iconSize * 0.16))}
        showLabels={!hideLabels}
        onOpen={open}
        onReorder={(from, to) => setConfig({ items: moveItem(items, from, to) })}
        editing={editing}
        onRemove={remove}
        onRemoveByDrag={remove}
        hoverCard={(gridItem) => {
          const link = items.find((l) => l.id === gridItem.key);
          if (!link) return null;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", maxWidth: 240 }}>
              <Favicon
                url={link.url}
                size={20}
                fallback={<IconTile name={link.name} url={link.url} size={20} />}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {link.name}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: "var(--faint)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {link.url}
                </div>
              </div>
            </div>
          );
        }}
        // Only while arranging the board: adding a link changes what the tile
        // holds rather than being something done at a glance, and a resting grid
        // of icons reads better without a permanent empty slot at the end.
        // Appear rather than a ternary so it leaves the way it arrived and the
        // grid closes up after it.
        trailing={
          <Appear open={!!editing} style={{ minWidth: 0 }}>
          <button
            ref={addBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAdding((v) => !v);
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
              transition: "color .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.firstElementChild.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--faint)";
              e.currentTarget.firstElementChild.style.borderColor = "var(--line)";
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
                transition: "border-color .2s",
              }}
            >
              <LuPlus size={Math.max(12, Math.round(iconSize * 0.4))} />
            </span>
            {hideLabels ? null : (
              <span style={{ fontSize: Math.max(9, Math.round(iconSize * 0.3)) }}>Add</span>
            )}
          </button>
          </Appear>
        }
      />

      {/* Floating rather than a grid item: an inline form used to grow the
          grid's own row to fit two text fields, which shifted every icon
          below it for as long as the form was open. A popover sits over the
          board instead, so opening it never moves anything. */}
      <Popover
        open={adding}
        anchorRef={addBtnRef}
        onClose={closeAdd}
        placement="bottom-center"
        width={220}
      >
        <form
          onSubmit={add}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "10px 12px",
          }}
        >
          <label style={FIELD_LABEL_STYLE}>
            Name
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Optional"
              aria-label="Link name"
              style={FIELD_INPUT_STYLE}
            />
          </label>
          <label style={FIELD_LABEL_STYLE}>
            Link
            <input
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="example.com"
              aria-label="Link address"
              style={FIELD_INPUT_STYLE}
            />
          </label>
          {/* A form with two text fields and no button does not submit
              on Enter — this restores that without a visible button. */}
          <button type="submit" style={{ display: "none" }} aria-hidden="true" />
        </form>
      </Popover>
    </div>
  );
}

export default Links;
