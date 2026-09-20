import { useCallback, useEffect, useRef, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import {
  Button,
  ColorField,
  IconGrid,
  MONO,
  Popover,
  hasPermission,
  iconGridSize,
  requestPermission,
  findIcon,
  useLiveRef,
  useWidgetAction,
} from "@daybreak/sdk";
import {
  cap,
  editBookmark,
  hasBookmarksApi,
  readFolders,
  removeBookmark,
  selectFolders,
  watchBookmarks,
} from "./tree";

// The browser's own bookmarks, by folder.
//
// Nothing is copied. The tile reads Chrome's tree and subscribes to its change
// events, so a bookmark added in the bookmark manager, on another window or by
// a sync from another device is here without a refresh — and a rename done in
// this widget's settings shows up in the manager the same way. One list, in
// the one place the browser already keeps it.

function Empty({ children }) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        fontSize: 12,
        color: "var(--faint)",
        padding: "0 8px",
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

const FIELD_LABEL = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "var(--faint)",
};

const FIELD_INPUT = {
  padding: "7px 9px",
  borderRadius: 9,
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  outline: "none",
  fontSize: 12,
  color: "var(--fg)",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

// One bookmark's own settings.
//
// Two halves with two different owners, and the UI does not make a point of
// it: the name and the address are Chrome's and are written back to Chrome, so
// a rename here is a rename in the bookmark manager; the colour is not
// something Chrome's model has, so it lives in this widget's config.
//
// Writes go on blur rather than on every keystroke. chrome.bookmarks.update
// fires a change event that reloads the whole tree, so per-keystroke writes
// would re-render the grid under the cursor on every letter.
function BookmarkEditor({ link, style, onStyle, onSaved, toast }) {
  const [title, setTitle] = useState(link.title || "");
  const [url, setUrl] = useState(link.url || "");
  const [confirming, setConfirming] = useState(false);

  const commit = async (next) => {
    const wanted = { title: title.trim() || link.title, url: url.trim() || link.url, ...next };
    if (wanted.title === link.title && wanted.url === link.url) return;
    try {
      await editBookmark(link.id, wanted);
    } catch {
      toast?.("Chrome would not save that change");
      setTitle(link.title || "");
      setUrl(link.url || "");
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <label style={FIELD_LABEL}>
        Name
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => commit()}
          aria-label="Bookmark name"
          style={FIELD_INPUT}
        />
      </label>
      <label style={FIELD_LABEL}>
        Link
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => commit()}
          aria-label="Bookmark address"
          style={FIELD_INPUT}
        />
      </label>

      <ColorField
        color={style?.color}
        ink={style?.ink}
        onColor={(color) => onStyle({ color })}
        onInk={(ink) => onStyle({ ink })}
      />

      {/* Two taps, because this one is not undoable from here: the bookmark
          goes out of Chrome, not just off the board. */}
      <button
        type="button"
        onClick={async () => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          try {
            await removeBookmark(link.id);
            onSaved?.();
          } catch {
            toast?.("Chrome would not delete that bookmark");
          }
        }}
        onMouseLeave={() => setConfirming(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "7px 9px",
          borderRadius: 9,
          border: "1px solid var(--line)",
          background: confirming ? "var(--dangerSoft, var(--panel))" : "transparent",
          color: "var(--danger)",
          fontSize: 12,
          fontFamily: "inherit",
          cursor: "pointer",
          transition: "background .15s ease",
        }}
      >
        <LuTrash2 size={12} aria-hidden />
        {confirming ? "Delete from Chrome?" : "Delete bookmark"}
      </button>
    </div>
  );
}

// One folder: its name, then its links, then what it is holding back.
function Folder({
  folder,
  limit,
  showHeading,
  iconSize,
  list,
  onOpen,
  editing,
  styles,
  onItemMenu,
  activeKey,
}) {
  const [all, setAll] = useState(false);
  const { shown, more } = cap(folder.links, all ? 0 : limit);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      {showHeading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            // Not sticky — see the note on the same heading in the Quick
            // Links widget. A band cannot be painted to match a translucent
            // tile, so the heading scrolls with its own group.
            paddingBottom: 3,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: "none",
              maxWidth: "70%",
            }}
          >
            {folder.title}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--faint)", flex: "none" }}>
            {folder.links.length}
          </span>
          <span
            aria-hidden
            style={{ flex: 1, height: 1, background: "var(--line)", minWidth: 8 }}
          />
        </div>
      ) : null}

      <IconGrid
        items={shown.map((link) => ({
          key: link.id,
          name: link.title,
          title: link.url,
          iconUrl: link.url,
          iconName: link.title,
          // A bookmark is Chrome's, so its colour cannot live on it. Kept in
          // this widget's own config, keyed by the bookmark's id.
          ...(styles?.[link.id] || null),
        }))}
        cols={4}
        iconSize={iconSize}
        showLabels
        list={list}
        onOpen={onOpen}
        editing={editing}
        onItemMenu={onItemMenu}
        activeKey={activeKey}
        // Lined up under the heading rather than centred beneath it.
        align={showHeading ? "start" : "center"}
        // Bookmarks are Chrome's, and their order is Chrome's. Dragging one
        // here would have to move it in the browser's own tree, which is a
        // reorder of somebody's bookmarks bar done by accident on the way past
        // — the settings panel is where they get moved, deliberately.
        reorderable={false}
      />

      {more || all ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAll((v) => !v);
          }}
          style={{
            alignSelf: "flex-start",
            padding: "3px 8px",
            marginTop: 2,
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--dim)",
            fontSize: 10,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "background .15s ease, color .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--panel2)";
            e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--dim)";
          }}
        >
          {all ? "Show fewer" : `${more} more`}
        </button>
      ) : null}
    </div>
  );
}

function Bookmarks({
  options,
  config,
  setConfig,
  setOptions,
  size,
  editing,
  refreshKey,
  action,
  onSpawn,
  onRejoin,
  toast,
}) {
  const { layout, iconScale, perFolder, showHeadings, newTab } = options;
  const [granted, setGranted] = useState(null);
  const [folders, setFolders] = useState([]);
  // Which bookmark's editor is open, and the icon it hangs off. useLiveRef
  // because the grid re-renders whenever Chrome's tree changes underneath it,
  // and a plain ref would be pointing at a node React had already replaced.
  const [edited, setEdited] = useState(null);
  const rootRef = useRef(null);
  const editAnchor = useLiveRef(() => (edited ? findIcon(rootRef.current, edited) : null));
  const styles = config.styles || {};

  const load = useCallback(() => {
    readFolders().then(setFolders);
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
  }, [load, refreshKey]);

  // Chrome's own change events rather than a poll — see watchBookmarks. Only
  // once the permission is there, since subscribing without it throws.
  useEffect(() => {
    if (!granted) return undefined;
    return watchBookmarks(load);
  }, [granted, load]);

  // Splitting and rejoining, from the tile's own menu.
  //
  // The folders are Chrome's, so this is the one that can tell whether there
  // are any — the manifest cannot, which is why actionsFor there offers the
  // split on any unsplit card and this declines with a reason.
  useWidgetAction(action, "separate", () => {
    const chosen = selectFolders(folders, { selected: config.folders });
    if (chosen.length < 2) {
      toast?.(
        folders.length
          ? "Only one folder here — nothing to split"
          : "No bookmark folders to split yet"
      );
      return;
    }
    onSpawn?.(
      chosen.map((f) => ({ folders: [], folderId: f.id, folderTitle: f.title })),
      { separate: true }
    );
  });

  // Back to one card. Nothing has to be merged — a Bookmarks card holds no
  // content of its own, only which folder to read — so the merge just clears
  // the pin, and the host removes the siblings.
  useWidgetAction(action, "rejoin", () => {
    onRejoin?.(() => ({ folders: [], folderId: null, folderTitle: "" }));
    setOptions({ separate: false });
  });

  // A card pinned to a folder that has since been deleted in Chrome.
  //
  // It would otherwise sit there empty for good, with its title still naming
  // something that no longer exists. Only once the folders have actually
  // loaded, or the first render before the read lands would unpin every card.
  useEffect(() => {
    if (!config.folderId || !folders.length) return;
    if (folders.some((f) => f.id === config.folderId)) return;
    setConfig({ folderId: null, folderTitle: "" });
    setOptions({ separate: false });
    toast?.("That bookmark folder is gone — showing all of them");
  }, [config.folderId, folders, setConfig, setOptions, toast]);

  // Keep the card's own title in step with the folder's name.
  //
  // The tile's header comes from the manifest's `subtitle`, which is handed
  // only the config and runs during render — it cannot go and ask Chrome. So
  // the name is carried in config, and renaming a folder here or in the
  // bookmark manager would otherwise leave the card titled with the old one
  // indefinitely. This is the one write-back: only when the two disagree, so
  // it settles in a single pass rather than looping.
  const live = folders.find((f) => f.id === config.folderId);
  useEffect(() => {
    if (!live || live.title === config.folderTitle) return;
    setConfig({ folderTitle: live.title });
  }, [live, config.folderTitle, setConfig]);

  // Must run straight off the click: Chrome rejects a permission request that
  // is not tied to a user gesture, so nothing may be awaited before it.
  const grant = (e) => {
    e.stopPropagation();
    requestPermission("bookmarks").then((ok) => {
      setGranted(ok);
      if (ok) load();
    });
  };

  if (!hasBookmarksApi()) {
    return (
      <Empty>
        Available in the installed extension — Chrome&apos;s bookmarks are not
        reachable from a plain page.
      </Empty>
    );
  }

  if (granted === false) {
    return (
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}
      >
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
          Daybreak needs Chrome&apos;s <strong>bookmarks</strong> permission to
          show your folders. They stay on this device.
        </div>
        <Button
          onClick={grant}
          style={{
            alignSelf: "flex-start",
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid var(--accentLine)",
            background: "var(--accentSoft)",
            color: "var(--accentText)",
            fontSize: 12,
            cursor: "pointer",
          }}
          hover={{ background: "var(--accentLine)" }}
        >
          Allow
        </Button>
      </div>
    );
  }

  // config.folderId and not the `separate` option, which is per instance: a
  // card split out of another starts with its own options at their defaults,
  // so gating on the option made every card but the first show every folder.
  // A card that has been given a folder holds that folder, and the option is
  // only which mode the settings panel is offering.
  const visible = selectFolders(folders, {
    folderId: config.folderId || null,
    selected: config.folders,
  });

  if (granted && !visible.length) {
    return (
      <Empty>
        {folders.length
          ? "None of the folders you chose has anything in it."
          : "No bookmarks with folders yet. Chrome's bookmark manager is where they live; this shows them."}
      </Empty>
    );
  }

  const open = (item) => {
    if (editing) return;
    const url = item.title;
    if (!url) return;
    if (newTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  };

  const iconSize = iconGridSize(size, { hideLabels: false, step: iconScale });
  // One folder to a card carries no heading — the tile's own title says which
  // folder it is, from the manifest's `subtitle`.
  const headings = config.folderId ? false : showHeadings && visible.length > 1;
  // Every link this card is showing, flattened, so the open editor can find
  // its bookmark again after Chrome's tree reloads underneath it.
  const flatLinks = visible.flatMap((f) => f.links);

  // One bookmark's own settings, from a right-click on its icon — the same
  // gesture Quick Links uses, because from the board they are the same kind of
  // thing.
  //
  // The split is the interesting part. The name and the address belong to
  // Chrome and are written straight back to it, so a rename here is a rename
  // in the bookmark manager. The colour does not exist in Chrome's model at
  // all, so it is kept in this widget's config keyed by the bookmark's id —
  // which also means it survives the bookmark being renamed or moved, and goes
  // away with the widget rather than leaving anything behind in the browser.
  const editTarget = edited ? flatLinks.find((l) => l.id === edited) : null;
  const patchStyle = (next) =>
    setConfig({ styles: { ...styles, [edited]: { ...(styles[edited] || null), ...next } } });

  return (
    <>
      <div
      ref={rootRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        // Several folders in one card will not always fit, and the honest
        // answer is a scroller rather than a clipped last group. minHeight is
        // what lets a flex child shrink under its own content.
        overflow: "hidden auto",
        overscrollBehavior: "contain",
      }}
    >
      {visible.map((folder) => (
        <Folder
          key={folder.id}
          folder={folder}
          limit={perFolder}
          showHeading={headings}
          iconSize={iconSize}
          list={layout !== "grid"}
          onOpen={open}
          editing={editing}
          styles={styles}
          activeKey={edited}
          onItemMenu={(item) => setEdited(item.key)}
        />
      ))}
      </div>

      <Popover
        open={!!editTarget}
        anchorRef={editAnchor}
        onClose={() => setEdited(null)}
        placement="bottom-center"
        width={228}
      >
        {editTarget ? (
          <BookmarkEditor
            link={editTarget}
            style={styles[editTarget.id]}
            onStyle={patchStyle}
            onSaved={() => setEdited(null)}
            toast={toast}
          />
        ) : null}
      </Popover>
    </>
  );
}

export default Bookmarks;
