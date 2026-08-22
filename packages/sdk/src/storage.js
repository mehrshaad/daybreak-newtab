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
// The roster of profiles: who exists, what they are called. Synced, because
// which boards you have is part of your setup. Tiny by design — the settings
// themselves live one item per profile, so this never grows with them.
export const PROFILES_KEY = "daybreak2profiles";
// Which profile this device is on. Local on purpose: syncing it would make
// every device follow whichever one switched last, so a work laptop could not
// stay on the work board while the home machine stayed on the home one.
export const ACTIVE_PROFILE_KEY = "daybreak2active";

// The first profile keeps the original key, so an existing install is a
// one-profile install: nothing is migrated, nothing moves, and the only code
// path that writes anywhere new is the one that creates a second profile.
// Deliberately duplicated from core/profiles.js rather than imported — the SDK
// does not depend on the app — and held in place by a test in both files.
const PRIMARY_PROFILE = "1";

function keyFor(base, profileId) {
  return !profileId || profileId === PRIMARY_PROFILE ? base : `${base}:${profileId}`;
}

export function syncKeyFor(profileId) {
  return keyFor(SYNC_KEY, profileId);
}

export function syncMirrorKeyFor(profileId) {
  return keyFor(SYNC_MIRROR_KEY, profileId);
}

// Widget content is per profile too, and for a more obvious reason than the
// settings are: this is where a scratchpad's note text lives. Shared, a second
// profile opened showing the first one's notes — its own board, with somebody
// else's writing in it.
export function localKeyFor(profileId) {
  return keyFor(LOCAL_KEY, profileId);
}

// A sync write that fails is not a nothing: settings quietly stop following the
// profile from that moment on, and until now nobody was told. The SDK cannot
// show a notification itself — it has no idea what the app's UI looks like — so
// it reports and lets the app decide.
const quotaListeners = new Set();

export function onSyncQuotaError(listener) {
  quotaListeners.add(listener);
  return () => quotaListeners.delete(listener);
}

function reportQuotaError(message) {
  for (const listener of quotaListeners) {
    try {
      listener(message);
    } catch {
      /* a broken listener must not take the write down with it */
    }
  }
}

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
            const failure = typeof chrome !== "undefined" ? chrome.runtime?.lastError : null;
            if (failure) {
              writeLocalStorage(key, value);
              // Only for sync. A local write failing is a different problem and
              // does not mean anything about following the profile around.
              // startsWith, not equality: every profile past the first writes
              // to "daybreak2:<id>", and a quota failure there matters just as
              // much as one on the primary's item.
              if (key.startsWith(SYNC_KEY)) reportQuotaError(failure.message || "");
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

// One settings item per profile rather than one object holding all three. Sync
// caps an item at 8KB: three boards in one item would hit that at a third of
// the size a single board can be today, and one profile growing would start
// failing writes for the others.
export function syncAreaFor(profileId) {
  return makeArea(syncKeyFor(profileId), hasChromeSync, () => chrome.storage.sync);
}

export function localAreaFor(profileId) {
  return makeArea(localKeyFor(profileId), hasChromeLocal, () => chrome.storage.local);
}

// The roster and the active id. The roster is synced; the active id is not.
export const profilesArea = makeArea(PROFILES_KEY, hasChromeSync, () => chrome.storage.sync);

// Read synchronously, because the active profile decides which mirror seeds the
// first frame — an async read here would mean painting one profile's board and
// then replacing it with another's.
export function readActiveProfile() {
  return readLocalStorage(ACTIVE_PROFILE_KEY);
}

export function writeActiveProfile(profileId) {
  writeLocalStorage(ACTIVE_PROFILE_KEY, profileId);
  // Mirrored into chrome.storage.local as well when there is one, so anything
  // outside the page (a future service worker, another surface) can see which
  // profile is current without reaching into localStorage.
  if (hasChromeLocal()) chrome.storage.local.set({ [ACTIVE_PROFILE_KEY]: profileId });
}

// chrome.storage.sync's read is always async, which leaves the very first
// frame with nothing to paint. This mirror is a synchronous localStorage
// copy of the last-written settings, read once for that first frame and then
// immediately superseded by the real syncArea read. One-way: written on every
// settings change, never read back into chrome.storage.
export function readSyncMirror(profileId) {
  return readLocalStorage(syncMirrorKeyFor(profileId));
}

export function writeSyncMirror(value, profileId) {
  writeLocalStorage(syncMirrorKeyFor(profileId), value);
}

// Everything a removed profile left behind. Called when a profile is deleted so
// its board does not sit in sync forever, taking up part of a 100KB allowance
// that the profiles still in use have to share.
export function forgetProfileStorage(profileId) {
  if (!profileId || profileId === PRIMARY_PROFILE) return Promise.resolve();
  const syncKey = syncKeyFor(profileId);
  const localKey = localKeyFor(profileId);
  try {
    localStorage.removeItem(syncMirrorKeyFor(profileId));
    localStorage.removeItem(syncKey);
    localStorage.removeItem(localKey);
  } catch {
    /* disabled storage - nothing to clean up */
  }
  const done = [];
  // The content bucket as well as the settings. Leaving it behind would mean a
  // later profile that happened to reuse the id inheriting its notes, which is
  // exactly what nextProfileId refuses to allow.
  if (hasChromeSync()) {
    done.push(new Promise((resolve) => chrome.storage.sync.remove(syncKey, resolve)));
  }
  if (hasChromeLocal()) {
    done.push(new Promise((resolve) => chrome.storage.local.remove(localKey, resolve)));
  }
  return Promise.all(done);
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
