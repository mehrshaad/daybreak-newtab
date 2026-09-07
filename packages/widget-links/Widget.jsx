import { useEffect, useMemo, useRef, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import {
  Appear,
  ColorField,
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
  Select,
  uid,
  useLiveRef,
  useWidgetAction,
} from "@daybreak/sdk";
import { LOOSE, folderNames, groupLinks, selectGroup } from "./folders";
import { findIcon } from "./findIcon";

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

function Links({
  options,
  config,
  setConfig,
  setOptions,
  size,
  editing,
  columns,
  action,
  onSpawn,
  onRejoin,
}) {
  const { hideLabels, newTab, iconScale, hoverCard, layout, folderHeadings } = options;
  const list = layout === "list";
  const items = Array.isArray(config.items) ? config.items : DEFAULTS;
  const [adding, setAdding] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [draftName, setDraftName] = useState("");
  // null means "whatever this card is", which is the right default and not the
  // same as "" (no folder), so it cannot be folded into one value.
  const [draftFolder, setDraftFolder] = useState(null);
  const addBtnRef = useRef(null);
  // Whether the clipboard can be read: null until asked, so the Paste button
  // does not flash into view for a tenth of a second on every open before the
  // answer comes back and takes it away again.
  const [canPaste, setCanPaste] = useState(null);
  // Which link is being edited, and the element its popover hangs from. The
  // element rather than a ref: each icon has its own node and there is no ref
  // to hold them all, so IconGrid hands over the one that was right-clicked.
  const [editId, setEditId] = useState(null);
  // Resolved on read, not held. Filing a link into a folder moves it to a
  // different group and therefore a different IconGrid, so the icon is
  // unmounted and remade — and a held reference to the old node answers
  // getBoundingClientRect with zeroes, which sent this popover to the corner
  // of the window mid-keystroke. See useLiveRef.
  const rootRef = useRef(null);
  const editAnchor = useLiveRef(() =>
    editId ? findIcon(rootRef.current, editId) : null
  );

  // "Add a link" from the tile's right-click menu, which is where people
  // look for it before they find the button that only exists in edit mode.
  useWidgetAction(action, "add", () => setAdding(true));

  // Splitting, straight from the menu. The same partition the settings panel
  // does — see the note there on why each card takes its own links rather than
  // a copy of all of them.
  useWidgetAction(action, "separate", () => {
    const filled = groupLinks(items).filter((g) => g.links.length);
    if (filled.length < 2) return;
    setOptions({ separate: true });
    onSpawn?.(filled.map((g) => ({ items: g.links, folder: g.name || LOOSE })));
  });

  // And the way back: one card again, with every link from the cards it was
  // split into brought home. The host finds the siblings and removes them;
  // deciding what "merged" means is this widget's job, since splitting
  // partitioned the list rather than copying it.
  useWidgetAction(action, "rejoin", () => {
    onRejoin?.((own, others) => {
      const seen = new Set();
      const all = [];
      for (const list of [own.items, ...others.map((c) => c.items)]) {
        for (const link of Array.isArray(list) ? list : []) {
          // A link cannot be in two cards at once, but a board restored from
          // an older backup could disagree — and a duplicate id would collide
          // as a React key and in the editor's lookup.
          if (!link?.id || seen.has(link.id)) continue;
          seen.add(link.id);
          all.push(link);
        }
      }
      return { items: all, folder: null };
    });
    setOptions({ separate: false });
  });

  // Separation stops being a mode the moment there is nothing to separate.
  //
  // Emptying the last folder used to leave the switch on, so the settings
  // panel still offered to split a widget into one card and the size picker
  // was still narrowed for a mode that had no folders in it. Reset here rather
  // than in the panel, because the folders are emptied from the tile.
  useEffect(() => {
    if (!options.separate) return;
    if (config.folder != null) return;
    if (folderNames(items).length) return;
    setOptions({ separate: false });
  }, [options.separate, config.folder, items, setOptions]);

  const closeAdd = () => {
    setAdding(false);
    setDraftUrl("");
    setDraftName("");
    setDraftFolder(null);
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

  // Opening the add form, and — the first time only — asking for the
  // clipboard so it can fill itself in.
  //
  // There is no Paste button any more. A button that might turn out to have
  // nothing to paste is worse than no button, and the address on the clipboard
  // is nearly always the reason the form is being opened, so the right
  // behaviour is for it to already be there. The permission is the only reason
  // a button was needed, and a click on Add is a user gesture, which is all
  // Chrome requires — so it is asked for here, once, and never again either
  // way. Declined, the field is simply typed into.
  const askedPaste = useRef(false);
  const openAdd = (e) => {
    e.stopPropagation();
    if (adding) {
      closeAdd();
      return;
    }
    setAdding(true);
    if (canPaste !== false || askedPaste.current) return;
    askedPaste.current = true;
    // Nothing may be awaited before this or the gesture is already spent.
    requestPermission("clipboardRead").then(async (granted) => {
      setCanPaste(granted);
      if (!granted) return;
      const link = await readClipboardLink();
      if (link) setDraftUrl((current) => current || link);
    });
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

  // The folder this card is pinned to, as a plain name ("" for the ungrouped
  // card, null for a card showing everything).
  const cardFolder =
    config.folder == null ? null : config.folder === LOOSE ? "" : config.folder;

  // What either form offers. "No folder" first because it is the common answer
  // and the one a link starts in.
  const folderOptions = useMemo(
    () => [
      { value: "", label: "No folder" },
      ...folderNames(items).map((name) => ({ value: name, label: name })),
    ],
    [items]
  );

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
    // The folder the form chose, defaulting to this card's own — a card that
    // holds one folder cannot show a link filed anywhere else.
    const folder = (draftFolder ?? cardFolder) || "";
    setConfig({ items: [...items, { id: uid(), name, url, ...(folder ? { folder } : null) }] });
    closeAdd();
  };

  const remove = (item) =>
    setConfig({ items: items.filter((l) => l.id !== item.key) });

  // Right-clicking one icon edits that one link. The tile's own menu still
  // opens from anywhere else in the widget, which is where "Add a link" and
  // the size picker live; this is about the icon under the pointer.
  // The element is not kept — editAnchor finds whichever node currently
  // carries the key, every time it is read. See useLiveRef.
  const openItemMenu = (item) => setEditId(item.key);

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
    <div
      ref={rootRef}
      style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}
    >
      {/* One grid per folder, or exactly one unheaded grid where nobody has
          used folders — see groupLinks. The column is the scroller in the
          grouped case; see the `scroll` prop below. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: plain ? 0 : 14,
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
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    // Sticky inside the column's scroller, so scrolling a long
                    // board of folders never leaves you looking at a row of
                    // icons with no idea which folder they are in.
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    // Its own backing, or the icons scroll up through the text.
                    background: "var(--tile-sticky-bg, var(--panel))",
                    backdropFilter: "var(--tile-sticky-blur, none)",
                    WebkitBackdropFilter: "var(--tile-sticky-blur, none)",
                    paddingBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      // The reading colour, not --faint. A heading you have to
                      // look for is not organising anything, and this is the
                      // only label in the tile.
                      color: "var(--dim)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: "none",
                      maxWidth: "70%",
                    }}
                  >
                    {group.name}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--faint)", flex: "none" }}>
                    {group.links.length}
                  </span>
                  {/* A rule out to the edge, which is what actually separates
                      one group from the next — a gap alone reads as a wide row
                      of icons rather than as two folders. */}
                  <span
                    aria-hidden
                    style={{ flex: 1, height: 1, background: "var(--line)", minWidth: 8 }}
                  />
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
            // Under a heading the icons line up with it; a single grid that is
            // the whole tile stays centred the way it always was.
            align={plain ? "center" : "start"}
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
                onClick={openAdd}
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
          {/* The folder a new link goes into. Defaults to whatever this card
              holds, so a link added from the "Dev" card joins Dev. */}
          <label style={FIELD_LABEL_STYLE}>
            Folder
            <Select
              value={draftFolder ?? cardFolder ?? ""}
              options={folderOptions}
              onChange={setDraftFolder}
              onCreate={(name) => setDraftFolder(name)}
              createLabel="New folder…"
              createPlaceholder="Folder name"
              ariaLabel="Folder"
            />
          </label>
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
              <Select
                value={edited.folder || ""}
                options={folderOptions}
                onChange={(folder) => patch({ folder })}
                onCreate={(folder) => patch({ folder })}
                createLabel="New folder…"
                createPlaceholder="Folder name"
                ariaLabel="Folder"
              />
            </label>

            <ColorField
              color={edited.color}
              ink={edited.ink}
              onColor={(color) => patch({ color })}
              onInk={(ink) => patch({ ink })}
            />

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
