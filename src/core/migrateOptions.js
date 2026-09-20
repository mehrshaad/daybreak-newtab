// Widget options whose shape changed between releases.
//
// A widget's options are stored sparsely: only the keys somebody actually
// changed are written, and the manifest fills the rest. That is what makes
// adding an option free — but it also means *removing* one silently discards
// whatever the person had chosen, because the replacement key is simply absent
// and takes its default.
//
// The focus timer is the first case. It offered "50-minute rounds" as a switch
// and now takes the round length in minutes, so a stored `longFocus: true`
// means fifty and has to be said in the new vocabulary or the person's timer
// quietly halves.
//
// Deliberately a plain list rather than a versioned migration chain: these are
// per-widget and independent, they run on every hydrate, and each one has to
// be a no-op the second time it runs. `longFocus` is dropped as it is
// translated, so it is.
const MIGRATIONS = {
  timer: (options) => {
    if (!("longFocus" in options)) return null;
    const { longFocus, ...rest } = options;
    // Only when it was actually on. Off already means the default.
    return longFocus ? { ...rest, focusMinutes: 50 } : rest;
  },
};

// Returns a new widgets map, or the same one when nothing needed saying
// differently — so hydrate does not hand React a fresh object every load.
export function migrateWidgetOptions(widgets) {
  if (!widgets || typeof widgets !== "object") return widgets;
  let out = null;
  for (const [id, migrate] of Object.entries(MIGRATIONS)) {
    // Instances share their widget's options shape: `timer#2` is a timer.
    for (const key of Object.keys(widgets)) {
      if (key !== id && !key.startsWith(`${id}#`)) continue;
      const record = widgets[key];
      const options = record?.options;
      if (!options || typeof options !== "object") continue;
      const migrated = migrate(options);
      if (!migrated) continue;
      out = out || { ...widgets };
      out[key] = { ...record, options: migrated };
    }
  }
  return out || widgets;
}
