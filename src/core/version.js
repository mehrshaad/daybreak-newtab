// What version is running, and when it was built.
//
// Nothing read the manifest before this, so there was no way for a user to say
// which version they were on — which matters the moment someone reports a bug
// against a store listing that updates itself silently.

// Written in at build time by vite.config.js. Outside a build (tests, dev) it
// is undefined and the date is simply not shown.
export const BUILD_DATE = typeof __BUILD_DATE__ === "string" ? __BUILD_DATE__ : "";

export function appVersion() {
  // No chrome.runtime on the dev server; package.json's version is injected the
  // same way as the date so the two agree.
  if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version || "";
  }
  return typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "";
}

// "2.1.0 · 21 Aug 2026", or just the version where there is no build stamp.
export function versionLabel(locale) {
  const version = appVersion();
  if (!version) return "";
  if (!BUILD_DATE) return version;
  const date = new Date(BUILD_DATE);
  if (Number.isNaN(date.getTime())) return version;
  return `${version} · ${date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}
