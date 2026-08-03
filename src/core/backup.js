import { SCHEMA_VERSION } from "./schema";
import { localArea, syncArea } from "./storage";

export const BACKUP_KIND = "daybreak-backup";

// A backup carries both halves of storage: synced settings and the local
// buckets that hold widget content (notes, habit history, cached readings).
// Restoring only the settings would silently drop the content.
export async function exportBackup() {
  const [settings, buckets] = await Promise.all([syncArea.get(), localArea.get()]);
  return {
    kind: BACKUP_KIND,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: settings || null,
    buckets: buckets || {},
  };
}

export function backupFilename(date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  return `daybreak-backup-${iso}.json`;
}

export function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has definitely been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Validate before touching storage: a half-applied restore is worse than a
// rejected one.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: "That file isn't valid JSON." };
  }
  if (!data || typeof data !== "object") {
    return { error: "That file isn't a Daybreak backup." };
  }
  if (data.kind !== BACKUP_KIND) {
    return { error: "That file isn't a Daybreak backup." };
  }
  if (!data.settings || typeof data.settings !== "object") {
    return { error: "That backup has no settings in it." };
  }
  return { data };
}

export async function restoreBuckets(buckets) {
  if (buckets && typeof buckets === "object") await localArea.set(buckets);
}
