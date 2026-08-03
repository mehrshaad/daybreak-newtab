// The widget catalog builds itself from the folders in this directory.
//
// Adding a widget means creating src/widgets/<id>/manifest.js (plus its
// Widget.jsx) and rebuilding — no edit to this file, no registration list to
// keep in sync. That is the whole "drop in a folder" contract, and it is the
// same contract a future runtime loader will satisfy by handing us a manifest
// fetched from another repo instead of one found by this glob.
//
// See sdk/types.md for the manifest shape.

const modules = import.meta.glob("./*/manifest.js", { eager: true });

function normalize(manifest, folder) {
  const id = manifest.id || folder;
  const sizes = manifest.sizes?.length ? manifest.sizes : [[4, 2]];
  return {
    category: "Other",
    author: "Daybreak",
    version: "2.0.0",
    tagline: "",
    description: "",
    options: [],
    actions: [],
    refresh: null,
    permissions: { chrome: [], hosts: [] },
    ...manifest,
    id,
    sizes,
    defaultSize: manifest.defaultSize || sizes[0],
  };
}

const catalog = Object.entries(modules)
  .map(([path, mod]) => {
    const manifest = mod.default || mod.manifest;
    if (!manifest) return null;
    const folder = path.split("/")[1];
    return normalize(manifest, folder);
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

const byId = new Map(catalog.map((w) => [w.id, w]));

export const WIDGETS = catalog;

// A board entry is an *instance* id: either the widget type ("clock") or a
// numbered copy ("clock#2"). The design let Duplicate push the same id twice,
// which collides as a React key and in the per-id size/config maps; numbering
// copies keeps every instance independently sized and configured.
export const typeOf = (instanceId) => String(instanceId).split("#")[0];

export const getWidget = (id) => byId.get(typeOf(id)) || null;

export const hasWidget = (id) => byId.has(typeOf(id));

// Next free instance id for a widget type.
export function nextInstanceId(ids, type) {
  if (!ids.includes(type)) return type;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${type}#${n}`;
    if (!ids.includes(candidate)) return candidate;
  }
  return `${type}#${Date.now()}`;
}

// Ids that exist in the catalog, in the order given. Used to filter presets and
// stored boards so a stale id can never render an empty tile.
export const knownIds = (ids) => (ids || []).filter((id) => byId.has(typeOf(id)));

export function categories() {
  const counts = new Map();
  for (const w of catalog) counts.set(w.category, (counts.get(w.category) || 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

// Default option values declared by a manifest, merged under whatever the user
// has set.
export function defaultOptions(id) {
  const w = getWidget(id);
  if (!w) return {};
  const out = {};
  for (const o of w.options) out[o.key] = o.default;
  return out;
}

export function resolveOptions(id, stored) {
  return { ...defaultOptions(id), ...(stored || {}) };
}

// A widget's declared size, honouring a user override only if the manifest
// still offers that size. Overrides are keyed by instance id so two copies of
// the same widget can be different sizes.
export function resolveSize(id, storedSizes) {
  const w = getWidget(id);
  if (!w) return [4, 2];
  const stored = storedSizes?.[id];
  if (
    Array.isArray(stored) &&
    w.sizes.some((s) => s[0] === stored[0] && s[1] === stored[1])
  ) {
    return stored;
  }
  return w.defaultSize;
}
