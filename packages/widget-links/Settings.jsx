import { useState } from "react";
import { LuFolderPlus, LuPencil, LuX } from "react-icons/lu";
import { Button, HOVER_SOFT, useWidgetAction } from "@daybreak/sdk";
import { LOOSE, dissolveFolder, folderNames, groupLinks, renameFolder } from "./folders";

// Folders for Quick Links, and the button that gives each one its own card.
//
// Shorter than the Bookmarks panel by design. A bookmark folder is a node in
// Chrome's tree that has to be created, moved and deleted; a Quick Links folder
// is a name typed on a link, so it exists exactly as long as a link says it
// does. There is nothing here to create — filing a link into "AI" from its own
// right-click menu is what makes "AI" — which leaves only renaming one and
// taking it off its links.

const FIELD = {
  width: "100%",
  boxSizing: "border-box",
  padding: "7px 11px",
  borderRadius: 10,
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  outline: "none",
  fontSize: 13,
  fontFamily: "inherit",
  color: "var(--fg)",
};

const ROUND = {
  alignSelf: "flex-start",
  padding: "7px 14px",
  borderRadius: 999,
  fontSize: 12,
  cursor: "pointer",
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  color: "var(--fg)",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  transition: "background .15s ease, border-color .15s ease",
};

const LABEL = {
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--faint)",
};

function FolderRow({ name, count, onRename, onDissolve }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            onRename(draft);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          aria-label="Folder name"
          style={{ ...FIELD, flex: 1, fontSize: 12, padding: "5px 9px" }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: "var(--fg)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
          <span style={{ color: "var(--faint)", fontSize: 11 }}>{` · ${count}`}</span>
        </span>
      )}
      <button
        type="button"
        aria-label={`Rename ${name}`}
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        style={ICON}
      >
        <LuPencil size={12} />
      </button>
      <button
        type="button"
        // Not "delete": the links survive. Saying delete over a control that
        // keeps everything would be the wrong kind of scary.
        aria-label={`Empty ${name}, keeping its links`}
        title="Take this folder off its links"
        onClick={onDissolve}
        style={ICON}
      >
        <LuX size={12} />
      </button>
    </div>
  );
}

const ICON = {
  display: "grid",
  placeItems: "center",
  width: 24,
  height: 24,
  flex: "none",
  padding: 0,
  borderRadius: 7,
  background: "transparent",
  border: "1px solid transparent",
  color: "var(--dim)",
  cursor: "pointer",
  transition: "background .15s ease, color .15s ease",
};

function LinksSettings({ config, setConfig, options, setOptions, action, onSpawn, toast }) {
  const items = Array.isArray(config.items) ? config.items : [];
  const names = folderNames(items);
  const loose = items.filter((l) => !String(l.folder || "").trim()).length;
  const separate = !!options.separate;
  // How many cards a split would actually make.
  const groupCount = groupLinks(items).filter((g) => g.links.length).length;

  // Nothing to focus here — the add form is in the tile — so the menu's "Add a
  // link" reaching this panel just says where to go.
  useWidgetAction(action, "add", () => toast?.("Right-click the grid's Add cell to add a link"));

  const split = () => {
    // Every group that has anything in it, loose links included: they are a
    // group like the rest and a card of them is a perfectly good tile.
    const groups = groupLinks(items).filter((g) => g.links.length);
    if (!groups.length) return;
    // Each card takes its own folder's links, not a copy of the whole list.
    // Quick Links are stored per instance, so a shared list is not something
    // the board can give them — and handing every card all of them would mean
    // eight copies of the same links drifting apart as they were edited.
    // Splitting partitions; the cards are separate lists from then on.
    const configs = groups.map((g) => ({ items: g.links, folder: g.name || LOOSE }));
    const made = onSpawn?.(configs, { separate: true }) || [];
    toast?.(made.length > 1 ? `${made.length} folder cards on the board` : "One folder on this card");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
          {names.length
            ? "A folder is a name on a link. File one by right-clicking its icon."
            : "No folders yet. Right-click any icon and give it a folder name — that is all a folder is."}
        </div>

        {names.map((name) => (
          <FolderRow
            key={name}
            name={name}
            count={items.filter((l) => String(l.folder || "").trim() === name).length}
            onRename={(to) => setConfig({ items: renameFolder(items, name, to) })}
            onDissolve={() => {
              setConfig({ items: dissolveFolder(items, name) });
              toast?.(`${name} emptied — its links are still here`);
            }}
          />
        ))}

        {loose && names.length ? (
          <div style={{ fontSize: 11, color: "var(--faint)" }}>
            {`${loose} ${loose === 1 ? "link is" : "links are"} in no folder.`}
          </div>
        ) : null}
      </div>

      {/* Offered once there is more than one group to split into. One folder
          with every link in it splits into a single card, which is the board
          it already has — and the loose links count as a group, so one folder
          plus anything unfiled is two cards and worth offering. */}
      {groupCount > 1 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={LABEL}>A card per folder</div>
          <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
            {config.folder != null
              ? `This card holds ${config.folder === LOOSE ? "the ungrouped links" : config.folder}.`
              : "Each folder becomes its own card, arranged and resized on its own."}
          </div>
          {separate ? (
            <Button onClick={split} style={ROUND} hover={HOVER_SOFT}>
              <LuFolderPlus size={13} aria-hidden />
              {`Split into ${groupCount} cards`}
            </Button>
          ) : (
            <Button onClick={() => setOptions({ separate: true })} style={ROUND} hover={HOVER_SOFT}>
              Switch to a card per folder
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default LinksSettings;
