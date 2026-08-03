// Every entry here has an authentic brand mark (see core/brands.js). Google
// apps with no distinct public icon — Contacts, Books, Play Games, Password
// Manager, Drawings — are deliberately absent rather than given a borrowed
// glyph, and Jamboard is gone because Google retired it.
//
// Order is the default launcher order, most-used first; the user can drag to
// reorder and the result is stored per widget.
export const APPS = [
  { key: "gmail", name: "Gmail", url: "https://mail.google.com/" },
  { key: "calendar", name: "Calendar", url: "https://calendar.google.com/" },
  { key: "drive", name: "Drive", url: "https://drive.google.com/" },
  { key: "meet", name: "Meet", url: "https://meet.google.com/" },
  { key: "docs", name: "Docs", url: "https://docs.google.com/" },
  { key: "sheets", name: "Sheets", url: "https://sheets.google.com/" },
  { key: "slides", name: "Slides", url: "https://slides.google.com/" },
  { key: "keep", name: "Keep", url: "https://keep.google.com/" },
  { key: "photos", name: "Photos", url: "https://photos.google.com/" },
  { key: "maps", name: "Maps", url: "https://maps.google.com/" },
  { key: "youtube", name: "YouTube", url: "https://www.youtube.com/" },
  { key: "gemini", name: "Gemini", url: "https://gemini.google.com/" },
  { key: "tasks", name: "Tasks", url: "https://tasks.google.com/" },
  { key: "chat", name: "Chat", url: "https://mail.google.com/chat/" },
  { key: "messages", name: "Messages", url: "https://messages.google.com/" },
  { key: "translate", name: "Translate", url: "https://translate.google.com/" },
  { key: "forms", name: "Forms", url: "https://forms.google.com/" },
  { key: "classroom", name: "Classroom", url: "https://classroom.google.com/" },
  { key: "scholar", name: "Scholar", url: "https://scholar.google.com/" },
  { key: "colab", name: "Colab", url: "https://colab.research.google.com/" },
  { key: "news", name: "News", url: "https://news.google.com/" },
  { key: "play", name: "Play", url: "https://play.google.com/" },
  { key: "lens", name: "Lens", url: "https://lens.google.com/" },
  { key: "earth", name: "Earth", url: "https://earth.google.com/" },
  { key: "home", name: "Home", url: "https://home.google.com/" },
  { key: "fit", name: "Fit", url: "https://fit.google.com/" },
  { key: "pay", name: "Pay", url: "https://pay.google.com/" },
  { key: "chrome", name: "Chrome", url: "https://www.google.com/chrome/" },
  { key: "analytics", name: "Analytics", url: "https://analytics.google.com/" },
  { key: "cloud", name: "Cloud", url: "https://console.cloud.google.com/" },
  { key: "fonts", name: "Fonts", url: "https://fonts.google.com/" },
  { key: "account", name: "Account", url: "https://myaccount.google.com/" },
];

const byKey = new Map(APPS.map((a) => [a.key, a]));

// Apply a stored order, dropping keys that no longer exist and appending any
// app added in a later release so it is never invisible.
export function orderedApps(order) {
  if (!Array.isArray(order) || !order.length) return APPS;
  const known = order.map((k) => byKey.get(k)).filter(Boolean);
  const seen = new Set(known.map((a) => a.key));
  return [...known, ...APPS.filter((a) => !seen.has(a.key))];
}

// How many icons a tile can show without cramping, given its span. Rather than
// overflow or shrink icons to nothing, the tile fills a whole grid for its size
// and hides the rest behind a "+N more" affordance. Zoom is not a factor: it
// magnifies the tile as-is rather than relaying it out.
export function gridFor(size, columns = 12) {
  const [w, h] = size;
  // Roughly one icon column per grid column, two icon rows per grid row.
  const cols = Math.max(3, Math.min(w + 1, columns));
  const rows = Math.max(2, Math.min(h + 1, 5));
  return { cols, rows };
}
