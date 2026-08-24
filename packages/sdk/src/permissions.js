// Optional Chrome permissions, requested only when a widget that needs one is
// actually added or first used.
//
// `chrome.permissions.request` must be called from a user gesture, so every
// caller wires it straight into a click handler — never into an effect.

export const hasPermissionsApi = () =>
  typeof chrome !== "undefined" && !!chrome.permissions;

export function hasPermission(name) {
  if (!name) return Promise.resolve(true);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.contains({ permissions: [name] }, (granted) =>
      resolve(!!granted)
    );
  });
}

// Must be called synchronously from a click.
export function requestPermission(name) {
  if (!name) return Promise.resolve(true);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.request({ permissions: [name] }, (granted) =>
      resolve(!!granted)
    );
  });
}

// Hand a permission back when the feature that needed it is switched off, so
// the extension holds no more access than it is actually using.
export function dropPermission(name) {
  if (!name || !hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.remove({ permissions: [name] }, (removed) => resolve(!!removed));
  });
}

export function hasAllPermissions(names = []) {
  if (!names.length) return Promise.resolve(true);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.contains({ permissions: names }, (granted) =>
      resolve(!!granted)
    );
  });
}

export function requestAllPermissions(names = []) {
  if (!names.length) return Promise.resolve(true);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.request({ permissions: names }, (granted) =>
      resolve(!!granted)
    );
  });
}

// Per-origin access, granted one address at a time under
// optional_host_permissions ("https://*/*" in the manifest) rather than a
// static host_permissions list — so a calendar or feed URL only unlocks the
// one origin the user actually pasted, asked for at the moment they paste it.
export const originOf = (url) => `${new URL(url).origin}/*`;

export function hasOrigin(origin) {
  if (!origin) return Promise.resolve(false);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.contains({ origins: [origin] }, (granted) => resolve(!!granted));
  });
}

// Must be called synchronously from a click.
export function requestOrigin(origin) {
  if (!origin) return Promise.resolve(false);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.request({ origins: [origin] }, (granted) => resolve(!!granted));
  });
}

// Several origins behind one prompt and one gesture. Asking for them one at a
// time only works for the first: `chrome.permissions.request` needs a user
// gesture, and awaiting the first prompt spends it, so every later call is
// rejected for want of one.
export function requestOrigins(origins = []) {
  const list = origins.filter(Boolean);
  if (!list.length) return Promise.resolve(false);
  if (!hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.request({ origins: list }, (granted) => resolve(!!granted));
  });
}

export function dropOrigin(origin) {
  if (!origin || !hasPermissionsApi()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.permissions.remove({ origins: [origin] }, (removed) => resolve(!!removed));
  });
}
