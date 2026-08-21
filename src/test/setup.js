import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// The app must run both as a packaged extension and as a plain page
// (`npm run dev`), so `chrome` is intentionally absent by default in tests.
// Individual tests opt in with `installChromeMock()`.
afterEach(() => {
  // Unmount anything a component test rendered. Without this every render in a
  // file stacks up in the same document and queries start finding two of
  // everything.
  cleanup();
  delete globalThis.chrome;
  localStorage.clear();
  vi.restoreAllMocks();
});

// Minimal in-memory stand-in for the slice of the chrome.* API we use.
export function installChromeMock({ sync = {}, local = {}, permissions = [] } = {}) {
  const syncStore = { ...sync };
  const localStore = { ...local };
  const granted = new Set(permissions);

  const area = (store) => ({
    get: vi.fn((key, cb) => cb({ [key]: store[key] })),
    set: vi.fn((obj, cb) => {
      Object.assign(store, obj);
      if (cb) cb();
    }),
    remove: vi.fn((key, cb) => {
      delete store[key];
      if (cb) cb();
    }),
  });

  globalThis.chrome = {
    storage: { sync: area(syncStore), local: area(localStore) },
    runtime: { lastError: null },
    permissions: {
      contains: vi.fn((req, cb) =>
        cb((req.permissions || []).every((p) => granted.has(p)))
      ),
      request: vi.fn((req, cb) => {
        (req.permissions || []).forEach((p) => granted.add(p));
        cb(true);
      }),
      remove: vi.fn((req, cb) => {
        (req.permissions || []).forEach((p) => granted.delete(p));
        cb(true);
      }),
    },
  };

  return { syncStore, localStore, granted };
}
