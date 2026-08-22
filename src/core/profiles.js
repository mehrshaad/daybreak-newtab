// Profiles: up to three separate boards on one install.
//
// One person, more than one context — work and home is the obvious pair, and a
// board tuned for one is the wrong board for the other. A profile owns
// everything in `settings`: appearance, the board layout, and every widget's
// options and config. It does not own Chrome permissions, and cannot: those are
// granted to the extension, not to a board, so history suggestions switched on
// in one profile stay granted in all of them. Pretending otherwise would mean
// showing a permission as off while it was still held.
//
// The roster below is only the list — who exists, and what they are called. The
// settings themselves live one sync item per profile, so switching profiles
// reads a different key rather than slicing one big object, and a profile can
// never push another profile's board over sync's per-item limit.
export const MAX_PROFILES = 3;

// The first profile keeps the storage key the extension has always used, so an
// existing install is a one-profile install with nothing migrated and nothing
// at risk. Only a second profile ever writes anywhere new.
export const PRIMARY_PROFILE = "1";

export const PROFILE_EMOJI = ["🏠", "💼", "📚", "🎧", "🌱", "⚡", "🎯", "🌙"];

const NAME_LIMIT = 24;

export function defaultProfiles() {
  return { list: [{ id: PRIMARY_PROFILE, name: "Main", emoji: "🏠" }] };
}

// A stored roster is the only thing standing between a person and the wrong
// board, so it is rebuilt rather than trusted: anything unrecognisable falls
// back to the single primary profile pointing at the original key.
export function hydrateProfiles(stored) {
  const list = Array.isArray(stored?.list) ? stored.list : null;
  if (!list) return defaultProfiles();
  const seen = new Set();
  const clean = [];
  for (const entry of list) {
    const id = String(entry?.id ?? "").trim();
    if (!id || seen.has(id) || clean.length >= MAX_PROFILES) continue;
    seen.add(id);
    clean.push({
      id,
      name: cleanName(entry?.name) || `Profile ${clean.length + 1}`,
      emoji: typeof entry?.emoji === "string" && entry.emoji ? entry.emoji : PROFILE_EMOJI[0],
    });
  }
  // The primary must exist and must be first: it is the profile whose settings
  // live under the original key, and a roster without it would orphan them.
  if (!clean.some((p) => p.id === PRIMARY_PROFILE)) {
    clean.unshift(defaultProfiles().list[0]);
    if (clean.length > MAX_PROFILES) clean.length = MAX_PROFILES;
  } else if (clean[0].id !== PRIMARY_PROFILE) {
    const at = clean.findIndex((p) => p.id === PRIMARY_PROFILE);
    clean.unshift(clean.splice(at, 1)[0]);
  }
  return { list: clean };
}

export function cleanName(name) {
  return String(name ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_LIMIT);
}

// Ids are never reused. A recycled id would inherit the settings left behind at
// that key by the profile that was deleted, which is the one thing a delete has
// to be trusted about.
export function nextProfileId(list) {
  const used = new Set((list || []).map((p) => String(p.id)));
  for (let n = 1; n <= 64; n += 1) {
    const id = String(n);
    if (!used.has(id)) return id;
  }
  return String(Date.now());
}

export function addProfile(profiles, { name, emoji } = {}) {
  const list = profiles.list || [];
  if (list.length >= MAX_PROFILES) return profiles;
  const id = nextProfileId(list);
  const taken = new Set(list.map((p) => p.emoji));
  return {
    list: [
      ...list,
      {
        id,
        name: cleanName(name) || `Profile ${list.length + 1}`,
        emoji: emoji || PROFILE_EMOJI.find((e) => !taken.has(e)) || PROFILE_EMOJI[0],
      },
    ],
  };
}

export function renameProfile(profiles, id, patch) {
  return {
    list: (profiles.list || []).map((p) =>
      p.id === id
        ? {
            ...p,
            ...(patch.name !== undefined ? { name: cleanName(patch.name) || p.name } : null),
            ...(patch.emoji ? { emoji: patch.emoji } : null),
          }
        : p
    ),
  };
}

// The primary cannot be removed: its settings are the ones under the original
// key, and removing it would leave the install with no profile owning them.
export function canRemoveProfile(profiles, id) {
  return id !== PRIMARY_PROFILE && (profiles.list || []).some((p) => p.id === id);
}

export function removeProfile(profiles, id) {
  if (!canRemoveProfile(profiles, id)) return profiles;
  return { list: (profiles.list || []).filter((p) => p.id !== id) };
}

// Which profile a device is actually on. Stored per device rather than synced,
// so a work laptop can sit on the work profile while the home machine sits on
// the home one — syncing this would have every device follow the last one to
// switch. Falls back to the primary whenever the stored id names a profile that
// no longer exists, which is what happens on the device that did not delete it.
export function resolveActive(profiles, storedId) {
  const list = profiles.list || [];
  return list.some((p) => p.id === storedId) ? storedId : PRIMARY_PROFILE;
}

export function profileById(profiles, id) {
  return (profiles.list || []).find((p) => p.id === id) || null;
}

// What a brand-new profile starts from.
//
// Not a copy of the board it was created from — a new board is the entire point
// — and not the bare defaults either. The bare defaults made a new profile look
// like a fresh install: it opened the first-run card and asked "what should we
// call you?" and explained what right-clicking a tile does, to somebody who had
// just used the settings drawer to create it.
//
// So the split is between what belongs to the board and what belongs to the
// person. The board, its appearance and its widgets start clean. The name and
// having already been shown around are the person's, and carry over. Nothing
// else does: a profile that inherited the accent and wallpaper would be the
// same board twice, which is not a second profile.
export function seedForNewProfile(defaults, from) {
  return {
    ...defaults,
    profile: { ...defaults.profile, name: from?.profile?.name || defaults.profile.name },
    behavior: { ...defaults.behavior, tourDone: !!from?.behavior?.tourDone },
  };
}
