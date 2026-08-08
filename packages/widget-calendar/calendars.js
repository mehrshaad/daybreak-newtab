// Provider detection and the multi-calendar config shape. Kept separate from
// the permission-request/fetch machinery in Widget.jsx and Settings.jsx
// (side-effecting, not worth pretending is pure) — this is just the bits
// that are.

export function providerFor(url) {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host.includes("google")) return "google";
  if (host.includes("outlook") || host.includes("office365") || host.includes("office.com")) {
    return "outlook";
  }
  if (host.includes("icloud")) return "apple";
  return "other";
}

export const PROVIDER_LABEL = {
  google: "Google Calendar",
  outlook: "Outlook",
  apple: "iCloud",
  other: "Calendar",
};

// Google Calendar's mark is already registered in the SDK's brand map under
// "calendar" (IconTile resolves it there); Apple's under "icloud". Outlook
// has no real mark in the bundled icon set, so it — and anything
// unrecognised — falls back to IconTile's own lettered tile rather than a
// borrowed glyph.
export const PROVIDER_ICON_NAME = {
  google: "calendar",
  apple: "icloud",
  outlook: "Outlook",
  other: "Calendar",
};

// Normalises config into a list of { id, url, provider }, adapting the old
// single-calendar shape (`icsUrl: string`) at read time rather than writing
// a migration — the same pattern orderedApps uses for gapps.
export function resolveCalendars(config) {
  if (Array.isArray(config?.calendars) && config.calendars.length) {
    return config.calendars;
  }
  if (config?.icsUrl) {
    return [{ id: "legacy", url: config.icsUrl, provider: providerFor(config.icsUrl) }];
  }
  return [];
}
