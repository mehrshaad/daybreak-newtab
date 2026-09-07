// Chrome's own bookmarks, as folders of links.
//
// The tree Chrome hands back is arbitrarily deep and mostly empty: three fixed
// roots, folders inside folders, and links scattered at every level. A tile has
// room for a flat list of named groups, so this flattens the tree into exactly
// that — every folder that actually holds a link, named by its path.
//
// The reading and the writing are separated from the walking on purpose: the
// walk is where all the decisions are (what counts as a folder, what a group is
// called, what order they come in) and it is the part worth testing, which it
// cannot be if it only runs inside a browser that has a chrome.bookmarks.

export const hasBookmarksApi = () =>
  typeof chrome !== "undefined" && !!chrome.bookmarks;

// Chrome's three permanent roots. They have no meaningful title in some
// locales and cannot be deleted or moved, so they are named here rather than
// trusted to come back labelled.
const ROOT_IDS = new Set(["0", "1", "2", "3"]);

const isFolder = (node) => !node.url && Array.isArray(node.children);
const isLink = (node) => !!node.url;

// --- the walk ------------------------------------------------------------

// Every folder holding at least one link, flattened, depth-first, in Chrome's
// own order.
//
// A folder whose only contents are more folders is not a group — it is
// scaffolding, and showing it as an empty heading is worse than not showing
// it. Its children still come through on their own.
//
// `path` is what a group is called: "AI tools" where that is unambiguous, and
// "Work / AI tools" where it is nested, so two folders of the same name in
// different places do not read as one. The bookmarks bar is not prefixed —
// nearly everything is in it, and "Bookmarks bar / " in front of every group
// is a column of the same three words.
const BAR_ID = "1";

export function foldersFrom(tree, { barId = BAR_ID } = {}) {
  const out = [];

  const walk = (node, trail) => {
    if (!node || !Array.isArray(node.children)) return;
    const links = node.children.filter(isLink).map((n) => ({
      id: n.id,
      title: n.title || n.url,
      url: n.url,
    }));
    if (links.length) {
      out.push({
        id: node.id,
        title: node.title || "Bookmarks",
        path: trail.length ? `${trail.join(" / ")} / ${node.title}` : node.title || "Bookmarks",
        links,
      });
    }
    for (const child of node.children.filter(isFolder)) {
      // The bar itself contributes no path segment; its children start at
      // their own names.
      const next = node.id === barId || ROOT_IDS.has(node.id) ? trail : [...trail, node.title];
      walk(child, next);
    }
  };

  for (const root of tree || []) {
    if (Array.isArray(root.children)) {
      for (const top of root.children) walk(top, []);
    }
  }
  return out;
}

// Only the folders this instance is meant to show, in the order the settings
// chose. An empty selection means all of them, which is what a widget just
// added has to do — the alternative is a new tile that shows nothing until
// somebody finds the settings.
export function selectFolders(folders, { folderId = null, selected = null } = {}) {
  if (folderId) return folders.filter((f) => f.id === folderId);
  if (!Array.isArray(selected) || !selected.length) return folders;
  const order = new Map(selected.map((id, at) => [id, at]));
  return folders
    .filter((f) => order.has(f.id))
    .sort((a, b) => order.get(a.id) - order.get(b.id));
}

// The links a group shows, and how many it is holding back. `limit` of 0 means
// no limit, which is what "view all" switches to.
export function cap(links, limit) {
  if (!limit || links.length <= limit) return { shown: links, more: 0 };
  return { shown: links.slice(0, limit), more: links.length - limit };
}

// --- reading -------------------------------------------------------------

export function readFolders() {
  if (!hasBookmarksApi()) return Promise.resolve([]);
  return new Promise((resolve) => {
    try {
      chrome.bookmarks.getTree((tree) => resolve(foldersFrom(tree)));
    } catch {
      resolve([]);
    }
  });
}

// Every folder, including the empty ones, for the settings panel's "put it in
// which folder" picker. An empty folder is a perfectly good destination even
// though it is not a group worth drawing.
export function readAllFolders() {
  if (!hasBookmarksApi()) return Promise.resolve([]);
  return new Promise((resolve) => {
    const out = [];
    const walk = (node, trail) => {
      if (!Array.isArray(node.children)) return;
      for (const child of node.children) {
        if (!isFolder(child)) continue;
        const path = trail.length ? `${trail.join(" / ")} / ${child.title}` : child.title;
        out.push({ id: child.id, title: child.title || "Untitled", path });
        walk(child, ROOT_IDS.has(child.id) ? trail : [...trail, child.title]);
      }
    };
    try {
      chrome.bookmarks.getTree((tree) => {
        for (const root of tree || []) walk(root, []);
        resolve(out);
      });
    } catch {
      resolve([]);
    }
  });
}

// Chrome fires these when anything anywhere changes a bookmark — this widget,
// the bookmark manager, another window, a sync from another device. Subscribed
// to rather than polled, so the tile is never showing yesterday's folders.
const EVENTS = ["onCreated", "onRemoved", "onChanged", "onMoved", "onChildrenReordered"];

export function watchBookmarks(onChange) {
  if (!hasBookmarksApi()) return () => {};
  const listeners = [];
  for (const name of EVENTS) {
    const event = chrome.bookmarks[name];
    if (!event?.addListener) continue;
    event.addListener(onChange);
    listeners.push([event, onChange]);
  }
  return () => {
    for (const [event, fn] of listeners) event.removeListener(fn);
  };
}

// --- writing -------------------------------------------------------------
//
// These change the browser's real bookmarks, not a copy of them. That is the
// point — a bookmark manager that manages its own private list is two lists to
// keep in step — but it means a delete here is a delete in Chrome, so the
// settings panel confirms one rather than doing it on a single click.

const promised = (fn) =>
  new Promise((resolve, reject) => {
    if (!hasBookmarksApi()) {
      reject(new Error("No bookmarks API"));
      return;
    }
    try {
      fn((result) => {
        const error = chrome.runtime?.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });

export const createBookmark = ({ parentId, title, url }) =>
  promised((cb) => chrome.bookmarks.create({ parentId, title, url }, cb));

export const createFolder = ({ parentId, title }) =>
  promised((cb) => chrome.bookmarks.create({ parentId, title }, cb));

export const renameNode = (id, title) =>
  promised((cb) => chrome.bookmarks.update(id, { title }, cb));

export const editBookmark = (id, { title, url }) =>
  promised((cb) => chrome.bookmarks.update(id, { title, url }, cb));

export const moveNode = (id, parentId) =>
  promised((cb) => chrome.bookmarks.move(id, { parentId }, cb));

export const removeBookmark = (id) => promised((cb) => chrome.bookmarks.remove(id, cb));

// A folder and everything in it. Separate from removeBookmark because the API
// is separate and because the consequence is: `remove` refuses a non-empty
// folder, so a caller that used it for both would silently fail on the folders
// that matter.
export const removeFolder = (id) => promised((cb) => chrome.bookmarks.removeTree(id, cb));
