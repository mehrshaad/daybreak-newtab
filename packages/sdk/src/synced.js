import { useCallback, useEffect, useRef, useState } from "react";
import { useWidgetLocal } from "./bucket";
import { hasChromeSync } from "./storage";

// Widget content that should follow the user across signed-in Chrome
// profiles — habit history, scratchpad text — but varies too much in size to
// trust blindly against chrome.storage.sync's 8KB-per-item cap. Each widget
// gets its own sync item ("daybreak2sync:<id>:<key>") rather than sharing the
// one blob settings already use, so one long note cannot crowd out the board.
//
// The per-widget local bucket stays the durable, unbounded copy on this
// device; sync is a best-effort mirror written alongside it and consulted
// only at cold start, so a trimmed or stale sync item can never shadow newer
// data this device already has.
const PREFIX = "daybreak2sync:";
const storageKeyFor = (id, key) => `${PREFIX}${id}:${key}`;

function byteSize(value) {
  return new Blob([JSON.stringify(value)]).size;
}

// What actually gets written to sync: as-is if it fits, trimmed if that then
// fits, otherwise not at all — the caller keeps the untrimmed value on this
// device and reports the overflow rather than losing any of it.
export function fitForSync(value, maxBytes, trim) {
  if (byteSize(value) <= maxBytes) return { value, overflowed: false };
  if (trim) {
    const trimmed = trim(value);
    if (byteSize(trimmed) <= maxBytes) return { value: trimmed, overflowed: false };
  }
  return { value, overflowed: true };
}

// Cold-start reconciliation between a widget's local and synced copies.
// Local wins when both exist — it is always the complete value, sync may be
// trimmed or behind — so this only ever needs to push up (local exists, sync
// does not: content that lived locally before this existed) or pull down
// (sync exists, local does not: a freshly signed-in device with nothing
// local yet).
export function resolveSynced(local, synced, initial) {
  if (local !== undefined && synced === undefined) {
    return { value: local, writeLocal: false, writeSync: true };
  }
  if (local === undefined && synced !== undefined) {
    return { value: synced, writeLocal: true, writeSync: false };
  }
  if (local !== undefined) {
    return { value: local, writeLocal: false, writeSync: false };
  }
  return { value: initial, writeLocal: false, writeSync: false };
}

function readSync(storageKey) {
  if (!hasChromeSync()) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    chrome.storage.sync.get(storageKey, (data) => resolve(data ? data[storageKey] : undefined));
  });
}

function writeSync(storageKey, value) {
  if (!hasChromeSync()) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [storageKey]: value }, () => resolve(!chrome.runtime?.lastError));
  });
}

// Mirrors useWidgetLocal's shape, plus `overflowed` for content that could
// not fit in sync even trimmed and is therefore only on this device.
export function useWidgetSynced(id, key, initial, { maxBytes = 8000, trim } = {}) {
  const storageKey = storageKeyFor(id, key);
  const [local, setLocal, localReady] = useWidgetLocal(id, key, undefined);
  const [synced, setSynced] = useState(undefined);
  const [syncedReady, setSyncedReady] = useState(false);
  const [overflowed, setOverflowed] = useState(false);
  const reconciled = useRef(false);

  useEffect(() => {
    let active = true;
    readSync(storageKey).then((v) => {
      if (!active) return;
      setSynced(v);
      setSyncedReady(true);
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!localReady || !syncedReady || reconciled.current) return;
    reconciled.current = true;
    const plan = resolveSynced(local, synced, initial);
    if (plan.writeLocal) setLocal(plan.value);
    if (plan.writeSync) {
      const fit = fitForSync(plan.value, maxBytes, trim);
      setOverflowed(fit.overflowed);
      if (!fit.overflowed) writeSync(storageKey, fit.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localReady, syncedReady]);

  const value = local !== undefined ? local : initial;
  const ready = localReady && syncedReady;

  const set = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(value) : next;
      setLocal(resolved);
      const fit = fitForSync(resolved, maxBytes, trim);
      setOverflowed(fit.overflowed);
      if (!fit.overflowed) writeSync(storageKey, fit.value);
    },
    [value, setLocal, maxBytes, trim, storageKey]
  );

  return [value, set, ready, overflowed];
}
