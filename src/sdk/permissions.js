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
