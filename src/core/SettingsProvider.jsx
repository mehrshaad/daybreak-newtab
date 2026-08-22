import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { migrateV1, migrateV1Local } from "./migrate";
import {
  hydrateProfiles,
  PRIMARY_PROFILE,
  addProfile as addToRoster,
  removeProfile as removeFromRoster,
  renameProfile as renameInRoster,
  resolveActive,
  seedForNewProfile,
} from "./profiles";
import { defaultSettings, hydrate, widgetState } from "./schema";
import { SettingsContext } from "./settingsContext";
import {
  debounceWriter,
  forgetProfileStorage,
  localArea,
  profilesArea,
  readActiveProfile,
  readSyncMirror,
  readV1Settings,
  syncAreaFor,
  writeActiveProfile,
  writeSyncMirror,
} from "@daybreak/sdk";

// Which profile this page is for, decided once, synchronously, before the first
// paint — it selects which mirror seeds that paint, so an async answer would
// mean painting one board and then replacing it with another.
//
// The roster is not available this early, so the stored id is taken on trust.
// That is safe on the device that set it, which is the only device that has it:
// the one case where it can be wrong is a profile deleted on another machine,
// and the effect below catches that and lands back on the primary.
const bootProfile = () => readActiveProfile() || PRIMARY_PROFILE;

export function SettingsProvider({ children }) {
  const profileId = useRef(bootProfile());
  // Seeded synchronously from the last-written mirror so a returning user's
  // first frame already shows their real board, instead of a blank page
  // while syncArea's async read is in flight. The effect below still runs
  // and reconciles to whatever that read actually returns.
  const [settings, setSettings] = useState(() => {
    const mirrored = readSyncMirror(profileId.current);
    return mirrored ? hydrate(mirrored) : null;
  });
  const [profiles, setProfiles] = useState(null);
  // Every read and write on this page goes through this one area, fixed to the
  // profile chosen above. Switching profiles reloads the page rather than
  // swapping it underneath a live board: the alternative is re-keying every
  // widget and trusting that none of them kept anything, and a new tab reload
  // is instant and paints the right board from its first frame anyway.
  const area = useRef(null);
  if (!area.current) area.current = syncAreaFor(profileId.current);

  const writer = useRef(null);
  if (!writer.current) writer.current = debounceWriter(area.current);
  // A slider drag fires update() continuously; writing the mirror on every
  // tick would mean a synchronous JSON.stringify + localStorage.setItem of
  // the whole settings blob per tick, so it is coalesced the same way the
  // real sync write is.
  const mirrorWriter = useRef(null);
  if (!mirrorWriter.current) {
    mirrorWriter.current = debounceWriter({
      set: (value) => Promise.resolve(writeSyncMirror(value, profileId.current)),
    });
  }
  // Set the moment the user changes anything. Painting from the mirror means
  // the board is live *before* the authoritative read resolves, so without
  // this a change made inside that window would be overwritten by the value
  // the read happened to start with — the edit would vanish with no error,
  // and the stale value would be written back over the mirror too.
  const touched = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const roster = hydrateProfiles(await profilesArea.get());
      if (!active) return;
      setProfiles(roster);
      // The stored id was taken on trust before the first paint. If it names a
      // profile that has since been deleted elsewhere, this page is showing a
      // board nobody owns: land on the primary and start again.
      const resolved = resolveActive(roster, profileId.current);
      if (resolved !== profileId.current) {
        writeActiveProfile(resolved);
        window.location.reload();
        return;
      }

      const saved = await area.current.get();
      if (saved) {
        if (!active || touched.current) return;
        setSettings(hydrate(saved));
        // Keeps the mirror in step with the authoritative value even when
        // this device never wrote it itself (e.g. a change synced in from
        // another device), so the next cold start seeds from the right one.
        writeSyncMirror(saved, profileId.current);
        return;
      }
      // No settings under this key yet. For a profile that was just created
      // that is expected, and it starts from the defaults. For the primary it
      // means a fresh or upgrading install, so pull anything the v1 layout left
      // behind: a name, city, tasks and links. A second profile must never
      // inherit that, or it would arrive holding a copy of the first one's
      // board instead of a clean one.
      const v1 = profileId.current === PRIMARY_PROFILE ? await readV1Settings() : null;
      const seeded = v1 ? migrateV1(v1) : defaultSettings();
      if (!active) return;
      setSettings(seeded);
      area.current.set(seeded);
      writeSyncMirror(seeded, profileId.current);
      // Note text is too big for the shared sync item, so it is seeded into
      // the local area the Scratchpad widget reads from.
      const localSeed = v1 && migrateV1Local(v1);
      if (localSeed) {
        const existing = (await localArea.get()) || {};
        localArea.set({ ...localSeed, ...existing });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist on unload so a debounced write in flight is never lost.
  useEffect(() => {
    const flush = () => {
      writer.current.flush();
      mirrorWriter.current.flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
      flush();
    };
  }, []);

  const commit = useCallback((next) => {
    touched.current = true;
    setSettings(next);
    writer.current.write(next);
    mirrorWriter.current.write(next);
    return next;
  }, []);

  // Merge a patch into one top-level section.
  const update = useCallback(
    (section, patch) =>
      setSettings((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          [section]: { ...prev[section], ...patch },
        };
        touched.current = true;
        writer.current.write(next);
        mirrorWriter.current.write(next);
        return next;
      }),
    []
  );

  // Merge a patch into one widget's record (options / rate / config).
  const updateWidget = useCallback(
    (id, patch) =>
      setSettings((prev) => {
        if (!prev) return prev;
        const current = prev.widgets?.[id] || { options: {}, rate: "Live", config: {} };
        const next = {
          ...prev,
          widgets: {
            ...prev.widgets,
            [id]: {
              ...current,
              ...patch,
              options: { ...current.options, ...(patch.options || {}) },
              config: { ...current.config, ...(patch.config || {}) },
            },
          },
        };
        touched.current = true;
        writer.current.write(next);
        mirrorWriter.current.write(next);
        return next;
      }),
    []
  );

  const replaceSettings = useCallback(
    (incoming) => commit(hydrate(incoming)),
    [commit]
  );

  const resetSettings = useCallback(() => commit(defaultSettings()), [commit]);

  // --- profiles -------------------------------------------------------------
  //
  // The roster is written straight through rather than debounced: these are
  // deliberate, infrequent acts, and a pending write to a list of three names
  // is not worth the risk of losing one to a closed tab.
  const saveRoster = useCallback((next) => {
    setProfiles(next);
    profilesArea.set(next);
    return next;
  }, []);

  // Anything in flight is flushed first. Otherwise a change made in the last
  // few hundred milliseconds before the switch would still be sitting in the
  // debouncer when the page reloaded, and would be lost.
  const switchProfile = useCallback((id) => {
    if (id === profileId.current) return;
    writer.current.flush();
    mirrorWriter.current.flush();
    writeActiveProfile(id);
    window.location.reload();
  }, []);

  const createProfile = useCallback(
    (details) => {
      const before = profiles || hydrateProfiles(null);
      const next = addToRoster(before, details);
      // At the limit addProfile returns its input untouched, so there is
      // nothing to save and nothing to switch to.
      if (next === before) return null;
      saveRoster(next);
      const created = next.list[next.list.length - 1];
      // Seeded before the switch, not left to the reload to work out. Left to
      // the defaults, a new profile opened the first-run card and asked what to
      // call somebody who had just created it from the settings drawer. The
      // board, its look and its widgets start clean; the name and having been
      // shown around already are the person's, and come with them.
      const seed = seedForNewProfile(defaultSettings(), settings);
      syncAreaFor(created.id).set(seed);
      writeSyncMirror(seed, created.id);
      // Straight into it. A profile you create but are not taken to is a
      // setting rather than an act, and a new board has to be seen to be set up.
      switchProfile(created.id);
      return created;
    },
    [profiles, saveRoster, switchProfile, settings]
  );

  const editProfile = useCallback(
    (id, patch) => saveRoster(renameInRoster(profiles || hydrateProfiles(null), id, patch)),
    [profiles, saveRoster]
  );

  const deleteProfile = useCallback(
    async (id) => {
      const before = profiles || hydrateProfiles(null);
      const next = removeFromRoster(before, id);
      if (next === before) return;
      saveRoster(next);
      // The board is dropped from storage rather than left sitting in sync,
      // where it would keep taking a share of a 100KB allowance the remaining
      // profiles have to live within.
      await forgetProfileStorage(id);
      if (id === profileId.current) switchProfile(PRIMARY_PROFILE);
    },
    [profiles, saveRoster, switchProfile]
  );

  const value = useMemo(
    () => ({
      settings,
      update,
      updateWidget,
      commit,
      replaceSettings,
      resetSettings,
      widgetState: (id) => widgetState(settings, id),
      profiles: profiles || hydrateProfiles(null),
      activeProfileId: profileId.current,
      switchProfile,
      createProfile,
      editProfile,
      deleteProfile,
    }),
    [
      settings,
      update,
      updateWidget,
      commit,
      replaceSettings,
      resetSettings,
      profiles,
      switchProfile,
      createProfile,
      editProfile,
      deleteProfile,
    ]
  );

  // Nothing renders until settings resolve — from the mirror on the very
  // first frame, or (a fresh install with no mirror yet) once the async
  // read above completes — so the page never flashes the default theme
  // before switching to the user's.
  if (!settings) return null;

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}
