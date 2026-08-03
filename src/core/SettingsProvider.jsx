import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { migrateV1, migrateV1Local } from "./migrate";
import { defaultSettings, hydrate, widgetState } from "./schema";
import { SettingsContext } from "./settingsContext";
import { debounceWriter, localArea, readV1Settings, syncArea } from "./storage";

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const writer = useRef(null);
  if (!writer.current) writer.current = debounceWriter(syncArea);

  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await syncArea.get();
      if (saved) {
        if (active) setSettings(hydrate(saved));
        return;
      }
      // No v2 settings yet: pull anything the v1 layout left behind so an
      // upgrading user keeps their name, city, tasks and links.
      const v1 = await readV1Settings();
      const seeded = v1 ? migrateV1(v1) : defaultSettings();
      if (!active) return;
      setSettings(seeded);
      syncArea.set(seeded);
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
    const flush = () => writer.current.flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
      flush();
    };
  }, []);

  const commit = useCallback((next) => {
    setSettings(next);
    writer.current.write(next);
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
        writer.current.write(next);
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
        writer.current.write(next);
        return next;
      }),
    []
  );

  const replaceSettings = useCallback(
    (incoming) => commit(hydrate(incoming)),
    [commit]
  );

  const resetSettings = useCallback(() => commit(defaultSettings()), [commit]);

  const value = useMemo(
    () => ({
      settings,
      update,
      updateWidget,
      commit,
      replaceSettings,
      resetSettings,
      widgetState: (id) => widgetState(settings, id),
    }),
    [settings, update, updateWidget, commit, replaceSettings, resetSettings]
  );

  // Nothing renders until stored settings resolve, so the page never flashes
  // the default theme before switching to the user's.
  if (!settings) return null;

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}
