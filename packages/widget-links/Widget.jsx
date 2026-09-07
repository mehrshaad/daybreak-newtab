import { useEffect, useMemo, useRef, useState } from "react";
import { LuClipboard, LuPlus, LuTrash2 } from "react-icons/lu";
import {
  Appear,
  Favicon,
  hasPermission,
  IconGrid,
  iconCellSize,
  iconGridSize,
  IconTile,
  MONO,
  moveItem,
  Popover,
  readClipboardLink,
  requestPermission,
  TILE_COLOR_ORDER,
  TILE_COLORS,
  TILE_INKS,
  uid,
  useWidgetAction,
} from "@daybreak/sdk";
import { LOOSE, folderNames, groupLinks, selectGroup } from "./folders";

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

const INK_BUTTON_STYLE = {
  flex: 1,
  padding: "5px 8px",
  borderRadius: 8,
  background: "var(--panel2)",
  fontSize: 11,
  fontFamily: "inherit",
  textTransform: "none",
  letterSpacing: "normal",
  cursor: "pointer",
  transition: "border-color .15s ease, color .15s ease, background .15s ease",
};

const REMOVE_ROW_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  width: "100%",
  padding: "6px 10px",
  marginTop: 2,
  borderRadius: 8,
  background: "transparent",
  border: "1px solid var(--line)",
  color: "var(--danger)",
  fontSize: 11,
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "background .15s ease",
};

const PASTE_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  width: "100%",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: 8,
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  color: "var(--dim)",
  fontSize: 11,
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "background .15s ease, color .15s ease",
};

// One colour in the picker, painted as the tile it produces rather than as a
// flat sample. A row of flat colours is a row of colours; a row of gradients
// is a preview of the grid.
function ColorSwatch({ name, selected, onPick, link }) {
  const pair = name ? TILE_COLORS[name] : null;
  return (
    <button
      type="button"
      aria-label={name ? `Colour: ${name}` : "Colour: automatic"}
      aria-pressed={selected}
      onClick={onPick}
      style={{
        width: 22,
        height: 22,
        padding: 0,
        borderRadius: 7,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        // The whole border in one declaration. A `border` here and a
        // `borderColor` in a selected state would leave the swatch with no
        // border at all once React removed the longhand — see
        // shorthandStyles.test.js, which exists because of exactly this.
        border: selected ? "2px solid var(--fg)" : "1px solid var(--line)",
        background: pair ? `linear-gradient(160deg, ${pair.from}, ${pair.to})` : "transparent",
        transition: "border-color .15s ease, transform .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Automatic draws the tile it would actually produce — this link's own
          brand mark, or its monogram on a hashed hue. A neutral square would
          have needed a legend; showing the answer needs none. It also renders
          as nothing at all on a light theme, where --panel2 and --line are
          both within a few percent of white. */}
      {pair ? null : (
        <IconTile name={link?.name || "?"} url={link?.url} size={20} radius={5} />
      )}
    </button>
  );
}

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

function Links({ options, config, setConfig, size, editing, columns, action }) {
  const { hideLabels, newTab, iconScale, hoverCard, layout, folderHeadings } = options;
  const list = layout === "list";
  const items = Array.isArray(config.items) ? config.items : DEFAULTS;
  const [adding, setAdding] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [draftName, setDraftName] = useState("");
  const addBtnRef = useRef(null);
  // Whether the clipboard can be read: null until asked, so the Paste button
  // does not flash into view for a tenth of a second on every open before the
  // answer comes back and takes it away again.
  const [canPaste, setCanPaste] = useState(null);
  // Which link is being edited, and the element its popover hangs from. The
  // element rather than a ref: each icon has its own node and there is no ref
  // to hold them all, so IconGrid hands over the one that was right-clicked.
  const [editId, setEditId] = useState(null);
  const editAnchor = useRef(null);

  // "Add a link" from the tile's right-click menu, which is where people
  // look for it before they find the button that only exists in edit mode.
  useWidgetAction(action, "add", () => setAdding(true));

  const closeAdd = () => {
    setAdding(false);
    setDraftUrl("");
    setDraftName("");
  };

  // Offer whatever address is on the clipboard, which is nearly always the
  // reason this form is open at all. Only when the permission is already
  // granted: the first paste is a button, and after that it happens by itself.
  useEffect(() => {
    if (!adding) return undefined;
    let live = true;
    hasPermission("clipboardRead").then(async (granted) => {
      if (!live) return;
      setCanPaste(granted);
      if (!granted) return;
      const link = await readClipboardLink();
      // Never over the top of something typed: the read is asynchronous and a
      // fast typist can be a word in before it lands.
      if (live) setDraftUrl((current) => current || link);
    });
    return () => {
      live = false;
    };
  }, [adding]);

  // The first paste, which is also the permission prompt.
  //
  // requestPermission has to be the first await in the handler or Chrome has
  // already spent the click gesture by the time it is called and refuses.
  const pasteFromClipboard = async () => {
    const granted = await requestPermission("clipboardRead");
    setCanPaste(granted);
    if (!granted) return;
    const link = await readClipboardLink();
    if (link) setDraftUrl(link);
  };

  // Width decides how many icons fit per row; height decides how big they are.
  // See iconGridSize — deriving the size from the column span made a wider tile
  // draw smaller icons.
  const cols = Math.max(3, Math.min(size[0], columns));
  const iconSize = iconGridSize(size, { hideLabels, step: iconScale });
  // Padding, the icon-to-caption gap and the grid gap all come from here, so
  // the Add cell below matches the real icons exactly.
  const cell = iconCellSize(iconSize, !hideLabels);

  // The links as groups, and the ones this card is actually holding.
  //
  // config.folder rather than an option, for the reason the Bookmarks widget
  // found the hard way: a card split out of another starts with its options at
  // their defaults, so a card that has been given a folder has to know it from
  // its config. null means every group.
  const groups = useMemo(
    () => selectGroup(groupLinks(items), config.folder ?? null),
    [items, config.folder]
  );
  // Exactly what it rendered before folders existed: one grid, no heading, the
  // scroller on the grid itself. Any board that has never used a folder must
  // come out of this unchanged.
  const plain = groups.length === 1 && !groups[0].name;

  const toGridItem = (l) => ({
    key: l.id,
    name: l.name,
    title: l.url,
    // Both, in that order of authority: the address names the site even
    // when the user called it "Work", and the label still gets its say
    // for an address we don't recognise.
    iconUrl: l.url,
    iconName: l.name,
    color: l.color,
    ink: l.ink,
  });

  // A drag inside one group, written back into that group's own slots.
  //
  // IconGrid reports indices within the grid it is drawing, and with folders
  // there are several grids over one list — so a plain moveItem on `items`
  // would move the wrong link the moment a second group existed. Only the
  // positions this group already occupies are rewritten, which also means a
  // drag can never move a link out of its folder by accident.
  const reorderWithin = (group, from, to) => {
    const slots = group.links.map((l) => items.indexOf(l));
    const order = moveItem(group.links, from, to);
    const next = [...items];
    slots.forEach((slot, at) => {
      next[slot] = order[at];
    });
    return next;
  };

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
    // On a card that holds one folder, a new link joins that folder. Without
    // this it would be filed as loose and then not shown at all by the very
    // card it was added from.
    const folder = config.folder == null || config.folder === LOOSE ? "" : config.folder;
    setConfig({ items: [...items, { id: uid(), name, url, ...(folder ? { folder } : null) }] });
    closeAdd();
  };

  const remove = (item) =>
    setConfig({ items: items.filter((l) => l.id !== item.key) });

  // Right-clicking one icon edits that one link. The tile's own menu still
  // opens from anywhere else in the widget, which is where "Add a link" and
  // the size picker live; this is about the icon under the pointer.
  const openItemMenu = (item, el) => {
    editAnchor.current = el;
    setEditId(item.key);
  };

  const edited = items.find((l) => l.id === editId) || null;

  // Patched live rather than on a Save button. A colour is a thing you try,
  // and a name is two characters changed — both are worse behind a commit
  // step, and the popover closing is the commit.
  const patch = (changes) =>
    setConfig({
      items: items.map((l) => (l.id === editId ? { ...l, ...changes } : l)),
    });

  // The address field writes what is typed, so "git" is briefly the link.
  // Settled when the field is left and again when the popover closes, because
  // Escape closes it without a blur. Left alone where it does not parse: the
  // person may have meant to keep typing, and replacing their text with
  // "https://git/" would be worse than leaving it.
  const commitUrl = () => {
    if (!editId) return;
    const link = items.find((l) => l.id === editId);
    const settled = link && normalizeUrl(link.url);
    if (settled && settled !== link.url) patch({ url: settled });
  };

  const closeEdit = () => {
    commitUrl();
    setEditId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
      {/* One grid per folder, or exactly one unheaded grid where nobody has
          used folders — see groupLinks. The column is the scroller in the
          grouped case; see the `scroll` prop below. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: plain ? 0 : 8,
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: plain ? "visible" : "hidden auto",
          overscrollBehavior: plain ? undefined : "contain",
        }}
      >
        {groups.map((group, at) => {
          const last = at === groups.length - 1;
          return (
            <div
              key={group.name || "__loose"}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 0,
                // The one grid in the plain case keeps the tile's whole height,
                // the way it did before this. Grouped ones take what they need.
                flex: plain ? 1 : "none",
              }}
            >
              {/* No heading on the loose group and none on a card holding a
                  single folder, where the tile's own title already says which
                  — see the manifest's `subtitle`. */}
              {group.name && folderHeadings && !config.folder ? (
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "var(--faint)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingLeft: 2,
                  }}
                >
                  {group.name}
                </div>
              ) : null}
          <IconGrid
            items={group.links.map(toGridItem)}
            cols={cols}
            iconSize={iconSize}
            // Matches the icon-to-label gap inside each item, so horizontal and
            // vertical rhythm read as the same spacing scaled by icon size.
            showLabels={!hideLabels}
            list={list}
            // The links are the user's own, so none of them may be hidden the way
            // Google Apps hides its long tail. If they do not fit, they scroll —
            // on the grid itself when it is the only one, and on the column
            // below when there are several, because two grids each flexing to
            // fill the tile is neither of them fitting.
            scroll={plain}
            onOpen={open}
            onReorder={(from, to) => setConfig({ items: reorderWithin(group, from, to) })}
            editing={editing}
            onRemove={remove}
            onRemoveByDrag={remove}
            onItemMenu={openItemMenu}
            hoverCard={!hoverCard ? undefined : (gridItem) => {
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
            trailing={!last ? null : (
              <Appear open={!!editing || adding} style={{ minWidth: 0 }}>
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
                  gap: cell.labelGap,
                  padding: `${cell.pad}px 2px`,
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
                  <span style={{ fontSize: cell.fontSize }}>Add</span>
                )}
              </button>
              </Appear>
            )}
          />
            </div>
          );
        })}
      </div>

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
          {/* Only until the permission exists, and only while the field is
              empty — once either is settled there is nothing for it to do. */}
          <Appear open={canPaste === false && !draftUrl}>
            <button
              type="button"
              onClick={pasteFromClipboard}
              style={PASTE_BUTTON_STYLE}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--panel)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--panel2)";
              }}
            >
              <LuClipboard size={12} aria-hidden />
              Paste what I copied
            </button>
          </Appear>
          {/* A form with two text fields and no button does not submit
              on Enter — this restores that without a visible button. */}
          <button type="submit" style={{ display: "none" }} aria-hidden="true" />
        </form>
      </Popover>

      {/* One link's own settings, from a right-click on its icon. Anchored to
          the icon rather than opened at the pointer, so it is obvious which of
          eight icons is being edited. */}
      <Popover
        open={!!edited}
        anchorRef={editAnchor}
        onClose={closeEdit}
        placement="bottom-center"
        width={228}
      >
        {edited ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "10px 12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <label style={FIELD_LABEL_STYLE}>
              Name
              <input
                autoFocus
                value={edited.name || ""}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={nameFromUrl(edited.url)}
                aria-label="Link name"
                style={FIELD_INPUT_STYLE}
              />
            </label>
            <label style={FIELD_LABEL_STYLE}>
              Link
              <input
                value={edited.url || ""}
                onChange={(e) => patch({ url: e.target.value })}
                onBlur={commitUrl}
                placeholder="example.com"
                aria-label="Link address"
                style={FIELD_INPUT_STYLE}
              />
            </label>

            <label style={FIELD_LABEL_STYLE}>
              Folder
              <input
                value={edited.folder || ""}
                onChange={(e) => patch({ folder: e.target.value })}
                placeholder="None"
                aria-label="Folder"
                list="db-link-folders"
                style={FIELD_INPUT_STYLE}
              />
              {/* The folders already in use, offered rather than imposed: a
                  free field is what makes a new folder, and a picker of
                  existing ones is what stops "AI" and "Ai" both existing. */}
              <datalist id="db-link-folders">
                {folderNames(items).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <div style={FIELD_LABEL_STYLE}>
              Tile colour
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, 22px)",
                  justifyContent: "space-between",
                  gap: 6,
                  paddingTop: 2,
                }}
              >
                <ColorSwatch
                  name={null}
                  link={edited}
                  selected={!edited.color}
                  onPick={() => patch({ color: null, ink: null })}
                />
                {TILE_COLOR_ORDER.map((name) => (
                  <ColorSwatch
                    key={name}
                    name={name}
                    selected={edited.color === name}
                    onPick={() => patch({ color: name })}
                  />
                ))}
              </div>
            </div>

            {/* Only with a colour chosen. On an automatic tile the mark is the
                brand's own or a monogram on a hashed hue, and neither has a
                second legible ink to offer — the option would be visible and
                inert, which reads as broken. */}
            <Appear open={!!edited.color}>
              <div style={FIELD_LABEL_STYLE}>
                Icon
                <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
                  {TILE_INKS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => patch({ ink: name })}
                      aria-pressed={(edited.ink || "light") === name}
                      style={{
                        ...INK_BUTTON_STYLE,
                        border:
                          (edited.ink || "light") === name
                            ? "1px solid var(--fg)"
                            : "1px solid var(--line)",
                        color: (edited.ink || "light") === name ? "var(--fg)" : "var(--dim)",
                      }}
                    >
                      {name === "light" ? "Light" : "Dark"}
                    </button>
                  ))}
                </div>
              </div>
            </Appear>

            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setConfig({ items: items.filter((l) => l.id !== edited.id) });
              }}
              style={REMOVE_ROW_STYLE}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--panel)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LuTrash2 size={12} aria-hidden />
              Remove
            </button>
          </div>
        ) : null}
      </Popover>
    </div>
  );
}

export default Links;
