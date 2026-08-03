import { useCallback, useEffect, useState } from "react";
import { debounceWriter, localArea } from "../core/storage";

// Per-widget storage in chrome.storage.local, namespaced as "<widgetId>:<key>".
//
// Widget *settings* (options, refresh rate, small config) live in the synced
// settings object. Widget *content* — note text, habit history, cached fetches
// — lives here instead, because the whole synced object shares one 8KB
// chrome.storage.sync item and content would blow through it.
//
// One shared cache backs every hook so two widgets reading the same area never
// race each other's writes.

let cache = null;
let loading = null;
const listeners = new Set();
const writer = debounceWriter(localArea, 300);

function notify() {
  for (const fn of listeners) fn();
}

async function ensureLoaded() {
  if (cache) return cache;
  if (!loading) {
    loading = localArea.get().then((data) => {
      cache = data && typeof data === "object" ? data : {};
      loading = null;
      notify();
      return cache;
    });
  }
  return loading;
}

export function readBucket(widgetId, key, fallback) {
  if (!cache) return fallback;
  const v = cache[`${widgetId}:${key}`];
  return v === undefined ? fallback : v;
}

export function writeBucket(widgetId, key, value) {
  if (!cache) cache = {};
  cache[`${widgetId}:${key}`] = value;
  writer.write(cache);
  notify();
}

// Drop everything a widget stored — used when it is removed from the board.
export function clearBucket(widgetId) {
  if (!cache) return;
  const prefix = `${widgetId}:`;
  let changed = false;
  for (const k of Object.keys(cache)) {
    if (k.startsWith(prefix)) {
      delete cache[k];
      changed = true;
    }
  }
  if (changed) {
    writer.write(cache);
    notify();
  }
}

export const flushBucket = () => writer.flush();

// `ready` is false until the first read resolves, so widgets can avoid
// flashing their empty state over content that is about to load.
export function useWidgetLocal(widgetId, key, initial) {
  const [, force] = useState(0);
  const [ready, setReady] = useState(!!cache);

  useEffect(() => {
    let active = true;
    const listener = () => active && force((n) => n + 1);
    listeners.add(listener);
    ensureLoaded().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  const value = readBucket(widgetId, key, initial);

  const set = useCallback(
    (next) =>
      writeBucket(
        widgetId,
        key,
        typeof next === "function" ? next(readBucket(widgetId, key, initial)) : next
      ),
    [widgetId, key, initial]
  );

  return [value, set, ready];
}
