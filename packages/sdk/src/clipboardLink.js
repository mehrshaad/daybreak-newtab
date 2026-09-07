// Offering the address you just copied, when adding a link.
//
// Copying a URL and then opening the add form is the whole reason the add form
// gets opened, and it used to mean pasting into a field by hand. So the form
// reads the clipboard and fills the field in if what is on it is a link.
//
// Reading the clipboard needs a permission, which is why this asks for one
// rather than declaring it up front: "Read data you copy and paste" is the
// scariest line in an install dialog, and putting it there for a convenience
// would be a bad trade for everyone who never adds a link. It sits in
// optional_permissions and is asked for the first time somebody presses Paste.

// Whether the clipboard text is a link worth offering.
//
// Deliberately narrow. This puts a value in a field the person then submits,
// so a false positive is a wrong link in their grid, and the clipboard is full
// of things that are not links — a sentence, a phone number, a file path.
//
// A single token with a dot in it, and nothing else. Never a scheme other than
// http or https: `javascript:` in an anchor's href is a script that runs on
// click, and the other schemes (mailto:, file:, data:, chrome:) are not things
// a tile can open. normalizeUrl in the widget refuses them too, but a
// clipboard is the one input here that arrives without anyone typing it, so
// it gets checked where it enters rather than only where it lands.
const BAD_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function clipboardLink(text) {
  const raw = String(text || "").trim();
  // A URL cannot contain whitespace, and a sentence that happens to end in a
  // domain is not somebody asking for a link to it.
  if (!raw || /\s/.test(raw)) return "";
  // Long enough to be a mistake rather than a link. The longest real URLs run
  // past this, but a clipboard holding 2000 characters is holding a document.
  if (raw.length > 2000) return "";

  const scheme = /^https?:\/\//i.test(raw);
  if (!scheme && BAD_SCHEME.test(raw)) return "";

  let url;
  try {
    url = new URL(scheme ? raw : `https://${raw}`);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  // A hostname with no dot is a bare word — "notes", "todo", the name of a
  // file. localhost is the one exception worth keeping.
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return "";
  return url.href;
}

export const hasClipboardRead = () =>
  typeof navigator !== "undefined" && !!navigator.clipboard?.readText;

// Reads the clipboard, or resolves to "" rather than throwing.
//
// Every way this fails is a way that should leave the form exactly as it was:
// the permission was refused, the document is not focused, the clipboard holds
// an image. None of them is worth an error in front of somebody who was trying
// to add a bookmark.
export async function readClipboardLink() {
  if (!hasClipboardRead()) return "";
  try {
    return clipboardLink(await navigator.clipboard.readText());
  } catch {
    return "";
  }
}
