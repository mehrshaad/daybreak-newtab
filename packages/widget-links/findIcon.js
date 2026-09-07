// The DOM node currently carrying a link's key, inside this widget.
//
// A walk-and-compare rather than a `[data-flip-id="..."]` selector, because a
// key in a selector has to be escaped and getting that wrong is a thrown
// exception in the middle of a render — and CSS.escape does not exist in
// jsdom, so the escaping path would be the one the tests never take. Comparing
// dataset values needs no escaping and cannot be quoted wrong.
//
// Scoped to the widget's own root so two Quick Links cards cannot answer for
// each other.
export function findIcon(root, key) {
  if (!root || !key) return null;
  for (const el of root.querySelectorAll("[data-flip-id]")) {
    if (el.dataset.flipId === key) return el;
  }
  return null;
}
