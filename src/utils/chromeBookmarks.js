// Read the browser's bookmarks via chrome.bookmarks (requires the "bookmarks"
// permission). Returns a flat list of { title, url }. Empty when running as a
// plain web page (e.g. `npm run dev`) where the API is unavailable.
export function hasChromeBookmarks() {
  return (
    typeof chrome !== "undefined" &&
    chrome.bookmarks &&
    typeof chrome.bookmarks.getTree === "function"
  );
}

export function getChromeBookmarks() {
  if (!hasChromeBookmarks()) return Promise.resolve([]);
  return new Promise((resolve) => {
    try {
      chrome.bookmarks.getTree((tree) => {
        const flat = [];
        const walk = (nodes) => {
          for (const node of nodes || []) {
            if (node.url) flat.push({ title: node.title || node.url, url: node.url });
            if (node.children) walk(node.children);
          }
        };
        walk(tree);
        resolve(flat);
      });
    } catch {
      resolve([]);
    }
  });
}
