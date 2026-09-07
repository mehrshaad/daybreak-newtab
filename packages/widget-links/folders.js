// Quick Links, grouped into the folders you gave them.
//
// The same idea as the Bookmarks widget's folders, and deliberately not the
// same mechanism: a bookmark's folder is a real node in Chrome's tree with an
// id, and a Quick Link's is a name somebody typed on the link itself. There is
// no folder object to create, rename or delete — a folder here exists exactly
// as long as a link says it does, which means there is no way to end up with
// an empty one and nothing to tidy up after moving the last link out.
//
// The cost is that renaming one means renaming it on each of its links, which
// renameFolder below does in a single config write.

// The group ungrouped links fall into. Named rather than left as a nameless
// first block so the settings panel has something to list and the separated
// mode has something to title.
export const LOOSE = "Ungrouped";

const nameOf = (link) => String(link?.folder || "").trim();

// Every folder in use, in the order its first link appears — so the grid's
// groups follow the order the links were arranged in rather than an
// alphabetical one nobody chose.
export function folderNames(items) {
  const seen = [];
  for (const link of items || []) {
    const name = nameOf(link);
    if (name && !seen.includes(name)) seen.push(name);
  }
  return seen;
}

// The links, as groups. Loose links come first and under no heading: on a board
// where nobody has used folders at all this has to come out as exactly the one
// unheaded grid it was before folders existed.
export function groupLinks(items) {
  const list = Array.isArray(items) ? items : [];
  const loose = list.filter((l) => !nameOf(l));
  const groups = folderNames(list).map((name) => ({
    name,
    links: list.filter((l) => nameOf(l) === name),
  }));
  return loose.length ? [{ name: "", links: loose }, ...groups] : groups;
}

// Only the group a separated card holds. An empty `folder` means the loose
// links, which is why this takes the name and a flag rather than treating ""
// as "no selection".
export function selectGroup(groups, folder) {
  if (folder == null) return groups;
  const want = folder === LOOSE ? "" : folder;
  return groups.filter((g) => g.name === want);
}

// Rename a folder across every link in it.
export function renameFolder(items, from, to) {
  const name = String(to || "").trim();
  return (items || []).map((l) => (nameOf(l) === from ? { ...l, folder: name } : l));
}

// Take a folder off its links without touching the links themselves. Deleting
// a folder must never delete what was in it — the links go back to loose,
// which is the only reading of "remove this folder" that cannot lose anything.
export function dissolveFolder(items, name) {
  return (items || []).map((l) => (nameOf(l) === name ? { ...l, folder: "" } : l));
}
