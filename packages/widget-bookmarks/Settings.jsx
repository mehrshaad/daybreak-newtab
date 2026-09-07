import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuChevronDown,
  LuChevronRight,
  LuCopy,
  LuFolderPlus,
  LuPencil,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import {
  Button,
  HOVER_SOFT,
  MONO,
  Select,
  hasPermission,
  useWidgetAction,
} from "@daybreak/sdk";
import {
  createBookmark,
  createFolder,
  editBookmark,
  hasBookmarksApi,
  readAllFolders,
  readFolders,
  removeBookmark,
  removeFolder,
  renameNode,
  watchBookmarks,
} from "./tree";

// Everything you can do to a bookmark, in the one place it makes sense to do
// it: a drawer with room for a list, rather than a popover over a tile.
//
// These are the browser's real bookmarks. A rename here is a rename in
// Chrome's bookmark manager, and a delete is a delete — which is why deleting
// asks twice and deleting a folder says how many links go with it.

const FIELD = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 12px",
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

const ICON_BUTTON = {
  display: "grid",
  placeItems: "center",
  width: 26,
  height: 26,
  flex: "none",
  padding: 0,
  borderRadius: 8,
  background: "transparent",
  border: "1px solid transparent",
  color: "var(--dim)",
  cursor: "pointer",
  transition: "background .15s ease, color .15s ease, border-color .15s ease",
};

const LABEL = {
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--faint)",
};

function IconButton({ label, danger, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ ...ICON_BUTTON, color: danger ? "var(--danger)" : "var(--dim)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--panel2)";
        e.currentTarget.style.borderColor = "var(--line)";
        if (!danger) e.currentTarget.style.color = "var(--fg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.color = danger ? "var(--danger)" : "var(--dim)";
      }}
    >
      {children}
    </button>
  );
}

// A checkbox row, in the app's own idiom rather than a native one.
function CheckRow({ checked, label, note, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "7px 8px",
        borderRadius: 10,
        background: "transparent",
        border: "1px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "background .15s ease, border-color .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--panel2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          flex: "none",
          borderRadius: 5,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          color: "var(--accentText)",
          // One declaration, not a border plus a borderColor in a state — see
          // src/core/shorthandStyles.test.js.
          border: checked ? "1px solid var(--accentLine)" : "1px solid var(--line)",
          background: checked ? "var(--accentSoft)" : "transparent",
          transition: "background .15s ease, border-color .15s ease",
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--fg)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        {note ? (
          <span style={{ display: "block", fontSize: 11, color: "var(--faint)" }}>{note}</span>
        ) : null}
      </span>
    </button>
  );
}

// One link, with its own edit form folded away until asked for.
function LinkRow({ link, folders, onSaved, onError }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);

  const save = async () => {
    try {
      await editBookmark(link.id, { title: title.trim() || link.title, url: url.trim() || link.url });
      setOpen(false);
      onSaved?.();
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: "var(--fg)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {link.title}
        </span>
        <IconButton
          label={open ? "Done editing" : `Edit ${link.title}`}
          onClick={() => setOpen((v) => !v)}
        >
          <LuPencil size={12} />
        </IconButton>
        <IconButton
          label={confirm ? "Tap again to delete" : `Delete ${link.title}`}
          danger
          onClick={async () => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            try {
              await removeBookmark(link.id);
              onSaved?.();
            } catch (error) {
              onError?.(error);
            }
          }}
        >
          <LuTrash2 size={12} />
        </IconButton>
      </div>

      {confirm && !open ? (
        <div style={{ fontSize: 11, color: "var(--danger)" }}>
          Tap the bin again to remove this from Chrome.
        </div>
      ) : null}

      {open ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "8px 0 4px",
            animation: "db-menu .16s ease both",
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Bookmark name"
            placeholder="Name"
            style={{ ...FIELD, fontSize: 12, padding: "6px 10px" }}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Bookmark address"
            placeholder="https://example.com"
            style={{ ...FIELD, fontSize: 12, padding: "6px 10px" }}
          />
          <Select
            value={link.parentId || ""}
            options={folders.map((f) => ({ value: f.id, label: f.path }))}
            onChange={async (parentId) => {
              try {
                const { moveNode } = await import("./tree");
                await moveNode(link.id, parentId);
                onSaved?.();
              } catch (error) {
                onError?.(error);
              }
            }}
            ariaLabel="Folder"
          />
          <Button onClick={save} style={{ ...ROUND, padding: "5px 12px" }} hover={HOVER_SOFT}>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// One folder in the manage list: rename it, delete it with everything in it,
// or open it and work on its links.
function FolderBlock({ folder, allFolders, onSaved, onError }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.title);
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IconButton label={open ? "Collapse" : "Expand"} onClick={() => setOpen((v) => !v)}>
          {open ? <LuChevronDown size={13} /> : <LuChevronRight size={13} />}
        </IconButton>
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== "Enter") return;
              try {
                await renameNode(folder.id, name.trim() || folder.title);
                setRenaming(false);
                onSaved?.();
              } catch (error) {
                onError?.(error);
              }
            }}
            onBlur={() => setRenaming(false)}
            aria-label="Folder name"
            style={{ ...FIELD, flex: 1, fontSize: 12, padding: "5px 9px" }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "left",
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              color: "var(--fg)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {folder.title}
            <span style={{ color: "var(--faint)", fontSize: 11 }}>
              {` · ${folder.links.length}`}
            </span>
          </button>
        )}
        <IconButton label={`Rename ${folder.title}`} onClick={() => setRenaming(true)}>
          <LuPencil size={12} />
        </IconButton>
        <IconButton
          label={confirm ? "Tap again to delete the folder" : `Delete ${folder.title}`}
          danger
          onClick={async () => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            try {
              await removeFolder(folder.id);
              onSaved?.();
            } catch (error) {
              onError?.(error);
            }
          }}
        >
          <LuTrash2 size={12} />
        </IconButton>
      </div>

      {confirm ? (
        <div style={{ fontSize: 11, color: "var(--danger)", lineHeight: 1.5 }}>
          {`Tap the bin again to delete this folder and its ${folder.links.length} ${
            folder.links.length === 1 ? "bookmark" : "bookmarks"
          } from Chrome.`}
        </div>
      ) : null}

      {open ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 4,
            animation: "db-menu .16s ease both",
          }}
        >
          {folder.links.map((link) => (
            <LinkRow
              key={link.id}
              link={{ ...link, parentId: folder.id }}
              folders={allFolders}
              onSaved={onSaved}
              onError={onError}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImportGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...ROUND,
          alignSelf: "stretch",
          justifyContent: "space-between",
          padding: "8px 12px",
        }}
      >
        <span>Bringing bookmarks in from another browser</span>
        {open ? <LuChevronDown size={13} /> : <LuChevronRight size={13} />}
      </button>

      {open ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--dim)",
            lineHeight: 1.6,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            animation: "db-menu .18s ease both",
          }}
        >
          <div>
            Chrome does the importing, and this widget shows whatever it ends up
            with. Daybreak has no way to open Chrome&apos;s own pages for you, so
            these are the steps:
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
            <li>
              Open Chrome&apos;s menu — the three dots at the top right.
            </li>
            <li>
              <strong>Bookmarks and lists</strong> →{" "}
              <strong>Import bookmarks and settings</strong>.
            </li>
            <li>
              Pick the browser you are coming from. If it is not listed, export a{" "}
              <strong>Bookmarks HTML file</strong> from it first and choose that
              instead.
            </li>
            <li>
              Tick <strong>Favourites / Bookmarks</strong> and import. They arrive
              in a folder of their own, usually named after the browser.
            </li>
            <li>Come back here and tick that folder under Show.</li>
          </ol>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--fg)" }}>
              chrome://bookmarks
            </span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText("chrome://bookmarks");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {
                  /* clipboard refused; the address is on screen to type */
                }
              }}
              style={{ ...ROUND, padding: "4px 10px", fontSize: 11 }}
            >
              <LuCopy size={11} aria-hidden />
              {copied ? "Copied" : "Copy"}
            </button>
            <span style={{ fontSize: 11, color: "var(--faint)" }}>
              Paste it in the address bar for the bookmark manager.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BookmarksSettings({ config, setConfig, options, setOptions, action, onSpawn, toast }) {
  const [granted, setGranted] = useState(null);
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftParent, setDraftParent] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const titleRef = useRef(null);

  const selected = Array.isArray(config.folders) ? config.folders : [];
  const separate = !!options.separate;

  const load = useCallback(() => {
    readFolders().then(setFolders);
    readAllFolders().then((list) => {
      setAllFolders(list);
      // Default the "add to" folder to the bookmarks bar, which is what people
      // mean by "my bookmarks" — and only until they choose otherwise.
      setDraftParent((current) => current || list.find((f) => f.id === "1")?.id || list[0]?.id || "");
    });
  }, []);

  useEffect(() => {
    let active = true;
    hasPermission("bookmarks").then((ok) => {
      if (!active) return;
      setGranted(ok);
      if (ok) load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    if (!granted) return undefined;
    return watchBookmarks(load);
  }, [granted, load]);

  useWidgetAction(action, "add", () => titleRef.current?.focus());

  const fail = (error) => toast?.(error?.message || "Chrome refused that change");

  if (!hasBookmarksApi()) {
    return (
      <div style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5 }}>
        Bookmarks are only reachable from the installed extension, not from a
        plain page.
      </div>
    );
  }

  if (granted === false) {
    return (
      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
        Allow the bookmarks permission on the widget itself first, and everything
        here fills in.
      </div>
    );
  }

  const toggleFolder = (id) =>
    setConfig({
      folders: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    });

  // "A card per folder": the folders this instance is showing become one card
  // each, keeping the first for the tile that asked. See spawnInstances.
  const split = () => {
    const chosen = selected.length ? folders.filter((f) => selected.includes(f.id)) : folders;
    if (!chosen.length) return;
    const configs = chosen.map((f) => ({
      folders: [],
      folderId: f.id,
      // Carried so the tile's own header can name the folder without reading
      // Chrome — see the manifest's `subtitle`, which runs synchronously off
      // config during render.
      folderTitle: f.title,
    }));
    const made = onSpawn?.(configs) || [];
    toast?.(
      made.length > 1
        ? `${made.length} folder cards on the board`
        : "One folder on this card"
    );
  };

  const addBookmark = async (e) => {
    e.preventDefault();
    const url = draftUrl.trim();
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    try {
      await createBookmark({
        parentId: draftParent || undefined,
        title: draftTitle.trim() || href,
        url: href,
      });
      setDraftTitle("");
      setDraftUrl("");
      toast?.("Bookmark added in Chrome");
    } catch (error) {
      fail(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* --- what this card shows ------------------------------------- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={LABEL}>Show</div>
        {separate ? (
          <>
            <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
              {config.folderId
                ? `This card holds ${config.folderTitle || "one folder"}. Split again to add the rest.`
                : "One folder to a card. Tick the folders you want and split them out."}
            </div>
            {folders.map((f) => (
              <CheckRow
                key={f.id}
                checked={selected.includes(f.id)}
                label={f.title}
                note={`${f.links.length} ${f.links.length === 1 ? "bookmark" : "bookmarks"}`}
                onToggle={() => toggleFolder(f.id)}
              />
            ))}
            <Button onClick={split} style={ROUND} hover={HOVER_SOFT}>
              <LuFolderPlus size={13} aria-hidden />
              {selected.length > 1 ? `Split into ${selected.length} cards` : "Give each folder a card"}
            </Button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
              {selected.length
                ? "Only the folders ticked here."
                : "Every folder, until you tick some."}
            </div>
            {folders.map((f) => (
              <CheckRow
                key={f.id}
                checked={selected.includes(f.id)}
                label={f.title}
                note={f.path === f.title ? undefined : f.path}
                onToggle={() => toggleFolder(f.id)}
              />
            ))}
            {selected.length ? (
              <Button
                onClick={() => setConfig({ folders: [] })}
                style={{ ...ROUND, padding: "5px 12px", fontSize: 11 }}
                hover={HOVER_SOFT}
              >
                Show every folder
              </Button>
            ) : null}
          </>
        )}
      </div>

      {/* --- add ------------------------------------------------------- */}
      <form onSubmit={addBookmark} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={LABEL}>Add a bookmark</div>
        <input
          ref={titleRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Name (optional)"
          aria-label="New bookmark name"
          style={FIELD}
        />
        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          placeholder="example.com"
          aria-label="New bookmark address"
          style={FIELD}
        />
        <Select
          value={draftParent}
          options={allFolders.map((f) => ({ value: f.id, label: f.path }))}
          onChange={setDraftParent}
          ariaLabel="Folder for the new bookmark"
        />
        <Button type="submit" style={ROUND} hover={HOVER_SOFT}>
          <LuPlus size={13} aria-hidden />
          Add to Chrome
        </Button>
      </form>

      {/* --- new folder ------------------------------------------------ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={LABEL}>New folder</div>
        <input
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key !== "Enter" || !newFolder.trim()) return;
            e.preventDefault();
            try {
              await createFolder({ parentId: draftParent || undefined, title: newFolder.trim() });
              setNewFolder("");
              toast?.("Folder created in Chrome");
            } catch (error) {
              fail(error);
            }
          }}
          placeholder="Name, then Enter"
          aria-label="New folder name"
          style={FIELD}
        />
        <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>
          Created inside the folder chosen above.
        </div>
      </div>

      {/* --- manage ---------------------------------------------------- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={LABEL}>Manage</div>
        <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>
          These are Chrome&apos;s own bookmarks. Anything changed here changes
          there too.
        </div>
        {folders.length ? (
          folders.map((f) => (
            <FolderBlock
              key={f.id}
              folder={f}
              allFolders={allFolders}
              onSaved={load}
              onError={fail}
            />
          ))
        ) : (
          <div style={{ fontSize: 12, color: "var(--faint)" }}>
            No folders with bookmarks in them yet.
          </div>
        )}
      </div>

      {/* --- import ---------------------------------------------------- */}
      <ImportGuide />

      {/* Kept so the manifest's own option row is not the only place the
          separated mode can be reached from — the split button above needs it
          on, and being told to go and find it is worse than a sentence. */}
      {!separate ? (
        <button
          type="button"
          onClick={() => setOptions({ separate: true })}
          style={{ ...ROUND, alignSelf: "stretch", justifyContent: "center", fontSize: 11 }}
        >
          Switch to a card per folder
        </button>
      ) : null}
    </div>
  );
}

export default BookmarksSettings;
