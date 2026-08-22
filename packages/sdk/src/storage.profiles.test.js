import { beforeEach, describe, expect, it } from "vitest";
import {
  ACTIVE_PROFILE_KEY,
  LOCAL_KEY,
  localKeyFor,
  forgetProfileStorage,
  readActiveProfile,
  readSyncMirror,
  SYNC_KEY,
  SYNC_MIRROR_KEY,
  syncKeyFor,
  syncMirrorKeyFor,
  writeActiveProfile,
  writeSyncMirror,
} from "./storage";

// The safety argument for profiles rests entirely on one thing: the first
// profile keeps the key the extension has always used. If that ever stops being
// true, every existing install loses its board on upgrade. These tests exist to
// make that impossible to break by accident.

describe("keys per profile", () => {
  it("leaves the primary on the original key", () => {
    expect(syncKeyFor("1")).toBe(SYNC_KEY);
    expect(syncMirrorKeyFor("1")).toBe(SYNC_MIRROR_KEY);
  });

  it("treats a missing profile id as the primary", () => {
    // Any call site that predates profiles passes nothing, and must keep
    // reading and writing exactly where it always did.
    for (const nothing of [undefined, null, ""]) {
      expect(syncKeyFor(nothing)).toBe(SYNC_KEY);
      expect(syncMirrorKeyFor(nothing)).toBe(SYNC_MIRROR_KEY);
    }
  });

  it("gives every other profile its own key, derived from the original", () => {
    expect(syncKeyFor("2")).toBe(`${SYNC_KEY}:2`);
    expect(syncKeyFor("3")).toBe(`${SYNC_KEY}:3`);
    expect(syncMirrorKeyFor("2")).toBe(`${SYNC_MIRROR_KEY}:2`);
  });

  it("keeps widget content per profile as well as settings", () => {
    // This is where a scratchpad's note text lives. Shared, a second profile
    // opened showing the first one's notes: its own board, with somebody
    // else's writing on it.
    expect(localKeyFor("1")).toBe(LOCAL_KEY);
    expect(localKeyFor(undefined)).toBe(LOCAL_KEY);
    expect(localKeyFor("2")).toBe(`${LOCAL_KEY}:2`);
  });

  it("never collides two profiles onto one key", () => {
    const keys = ["1", "2", "3", "4", undefined].map(syncKeyFor);
    // "1" and undefined are the same profile, so four distinct keys from five.
    expect(new Set(keys).size).toBe(4);
  });
});

describe("the mirror, per profile", () => {
  beforeEach(() => localStorage.clear());

  it("keeps one profile's first frame out of another's", () => {
    writeSyncMirror({ board: "primary" }, "1");
    writeSyncMirror({ board: "second" }, "2");
    expect(readSyncMirror("1")).toEqual({ board: "primary" });
    expect(readSyncMirror("2")).toEqual({ board: "second" });
  });

  it("reads back what a pre-profiles write left, with no id at all", () => {
    writeSyncMirror({ board: "old" });
    expect(readSyncMirror("1")).toEqual({ board: "old" });
    expect(readSyncMirror()).toEqual({ board: "old" });
  });
});

describe("the active profile", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips, and is nothing until something sets it", () => {
    expect(readActiveProfile()).toBeNull();
    writeActiveProfile("2");
    expect(readActiveProfile()).toBe("2");
    expect(localStorage.getItem(ACTIVE_PROFILE_KEY)).toBe('"2"');
  });
});

describe("forgetProfileStorage", () => {
  beforeEach(() => localStorage.clear());

  it("clears what a removed profile left behind, content included", async () => {
    writeSyncMirror({ board: "second" }, "2");
    localStorage.setItem(syncKeyFor("2"), '{"board":"second"}');
    localStorage.setItem(localKeyFor("2"), '{"scratchpad:note":"private"}');
    await forgetProfileStorage("2");
    expect(readSyncMirror("2")).toBeNull();
    expect(localStorage.getItem(syncKeyFor("2"))).toBeNull();
    // The bucket too. Left behind, a later profile reusing the id would
    // inherit its notes, which is the thing nextProfileId refuses to allow.
    expect(localStorage.getItem(localKeyFor("2"))).toBeNull();
  });

  it("refuses to touch the primary, whatever it is asked", async () => {
    // The primary cannot be deleted through the UI, but this is the function
    // that would do the damage if that ever changed, so it guards itself.
    writeSyncMirror({ board: "primary" }, "1");
    localStorage.setItem(localKeyFor("1"), '{"scratchpad:note":"mine"}');
    await forgetProfileStorage("1");
    await forgetProfileStorage();
    expect(readSyncMirror("1")).toEqual({ board: "primary" });
    expect(localStorage.getItem(localKeyFor("1"))).toBeTruthy();
  });
});
