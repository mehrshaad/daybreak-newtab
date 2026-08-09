// Storage abstraction shared by settings and per-widget buckets.
//
// In the packaged extension `chrome.storage.sync` carries settings across the
// user's signed-in Chrome profiles; `chrome.storage.local` holds anything too
// big or too chatty for sync. Running as a plain web page (`npm run dev`,
// tests) both fall back to localStorage so every screen still works.
//
// chrome.storage.sync limits that shape this file:
//   QUOTA_BYTES              102,400 total
//   QUOTA_BYTES_PER_ITEM       8,192  <- why widget content goes to local
//   MAX_WRITE_OPERATIONS_PER_MINUTE 120 <- why writes are debounced

export const SYNC_KEY = "daybreak2";
export const LOCAL_KEY = "daybreak2local";
export const V1_KEY = "daybreakSettings";
export const SYNC_MIRROR_KEY = "daybreak2mirror";

export const hasChromeSync = () =>
  typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.sync;

export const hasChromeLocal = () =>
  typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.local;

function readLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or disabled storage - nothing we can do here */
  }
}

function makeArea(key, isChromeAvailable, chromeArea) {
  return {
    get() {
      if (isChromeAvailable()) {
        return new Promise((resolve) => {
          chromeArea().get(key, (data) => {
            resolve((data && data[key]) || null);
          });
        });
      }
      return Promise.resolve(readLocalStorage(key));
    },
    set(value) {
      if (isChromeAvailable()) {
        return new Promise((resolve) => {
          chromeArea().set({ [key]: value }, () => {
            // Quota errors must not lose data: keep a local copy as a backstop.
            if (typeof chrome !== "undefined" && chrome.runtime?.lastError) {
              writeLocalStorage(key, value);
            }
            resolve();
          });
        });
      }
      writeLocalStorage(key, value);
      return Promise.resolve();
    },
  };
}

export const syncArea = makeArea(SYNC_KEY, hasChromeSync, () => chrome.storage.sync);
export const localArea = makeArea(LOCAL_KEY, hasChromeLocal, () => chrome.storage.local);

// chrome.storage.sync's read is always async, which leaves the very first
// frame with nothing to paint. This mirror is a synchronous localStorage
// copy of the last-written settings, read once for that first frame and then
// immediately superseded by the real syncArea read. One-way: written on every
// settings change, never read back into chrome.storage.
export function readSyncMirror() {
  return readLocalStorage(SYNC_MIRROR_KEY);
}

export function writeSyncMirror(value) {
  writeLocalStorage(SYNC_MIRROR_KEY, value);
}

// Reads the v1 settings blob so it can be migrated. Checks chrome.storage.sync
// first (where v1 kept it) and falls back to localStorage (v1's dev fallback,
// and where pre-Phase-2 installs left it).
export function readV1Settings() {
  if (hasChromeSync()) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(V1_KEY, (data) => {
        resolve((data && data[V1_KEY]) || readLocalStorage(V1_KEY));
      });
    });
  }
  return Promise.resolve(readLocalStorage(V1_KEY));
}

// Coalesces bursts of writes (slider drags, rapid toggles) into one storage
// write so we stay well under the sync write-rate limit.
export function debounceWriter(area, wait = 400) {
  let timer = null;
  let pending = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending !== null) {
      const value = pending;
      pending = null;
      return area.set(value);
    }
    return Promise.resolve();
  };

  return {
    write(value) {
      pending = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, wait);
    },
    flush,
  };
}
