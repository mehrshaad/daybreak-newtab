// What version is running, and when it was built.
//
// Nothing read the manifest before this, so there was no way for a user to say
// which version they were on — which matters the moment someone reports a bug
// against a store listing that updates itself silently.

// Written in at build time by vite.config.js. Outside a build (tests, dev) it
// is undefined and the date is simply not shown.
export const BUILD_DATE = typeof __BUILD_DATE__ === "string" ? __BUILD_DATE__ : "";

// Imported rather than stamped in, and that is the point.
//
// The version used to come only from a `define`, which is a build-time text
// substitution — so anything that did not apply it left `__APP_VERSION__` as a
// bare identifier, `typeof` answered "undefined", and appVersion() returned an
// empty string. That is not a cosmetic failure: the About row falls back to a
// dash, and every bug report and feedback mail composed from that state
// arrives with no version on it, which is the one fact those paths exist to
// carry. A stale dev server is enough to cause it, and it did.
//
// An import cannot go missing the way a substitution can, and the named export
// means the bundler takes the one field rather than the whole file. Held to
// public/manifest.json by a test, so the two cannot drift.
import { version as PACKAGE_VERSION } from "../../package.json";

export function appVersion() {
  // The packaged extension is authoritative about its own version; the import
  // is what the dev server and the tests have instead.
  if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version || "";
  }
  return PACKAGE_VERSION || "";
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
