// Bundled wallpapers, keyed by a stable id (the filename without extension) so
// the stored setting survives rebuilds. Full images and small thumbnails are
// imported eagerly as URLs.
const full = import.meta.glob("../assets/backgrounds/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const thumbs = import.meta.glob("../assets/backgrounds/thumbs/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

const keyOf = (p) => p.split("/").pop().replace(/\.webp$/, "");

const fullMap = {};
for (const [p, url] of Object.entries(full)) fullMap[keyOf(p)] = url;
const thumbMap = {};
for (const [p, url] of Object.entries(thumbs)) thumbMap[keyOf(p)] = url;

export const DEFAULT_WALLPAPER_KEY = "1";

export const WALLPAPERS = Object.keys(fullMap)
  .sort((a, b) => Number(a) - Number(b))
  .map((key) => ({
    key,
    url: fullMap[key],
    thumb: thumbMap[key] || fullMap[key],
  }));

// Resolve a stored `wallpaper` value to a usable image URL.
// - a built-in key -> that image
// - "custom" -> the user's uploaded image (passed in)
// - a legacy data:/http(s) URL -> used as-is
// - anything else (e.g. a stale build path) -> the default
export function resolveWallpaper(wallpaper, customUrl) {
  if (wallpaper === "custom") return customUrl || fullMap[DEFAULT_WALLPAPER_KEY];
  if (fullMap[wallpaper]) return fullMap[wallpaper];
  if (typeof wallpaper === "string" && /^(data:|https?:)/.test(wallpaper)) {
    return wallpaper;
  }
  return fullMap[DEFAULT_WALLPAPER_KEY];
}

// The custom wallpaper image is large, so it lives in chrome.storage.local
// (not the synced settings), falling back to localStorage in dev.
const WP_KEY = "daybreakWallpaper";
const hasChromeLocal = () =>
  typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

export function getCustomWallpaper() {
  if (hasChromeLocal()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(WP_KEY, (d) => resolve((d && d[WP_KEY]) || null));
    });
  }
  try {
    return Promise.resolve(localStorage.getItem(WP_KEY));
  } catch {
    return Promise.resolve(null);
  }
}

export function setCustomWallpaper(dataUrl) {
  if (hasChromeLocal()) {
    chrome.storage.local.set({ [WP_KEY]: dataUrl });
    return;
  }
  try {
    localStorage.setItem(WP_KEY, dataUrl);
  } catch {
    /* ignore */
  }
}
