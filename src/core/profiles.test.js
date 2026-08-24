import { describe, expect, it } from "vitest";
import { SYNC_KEY, syncKeyFor } from "@daybreak/sdk";
import {
  addProfile,
  canRemoveProfile,
  cleanName,
  defaultProfiles,
  hydrateProfiles,
  MAX_PROFILES,
  nextProfileId,
  PRIMARY_PROFILE,
  profileById,
  removeProfile,
  renameProfile,
  resolveActive,
  seedForNewProfile,
} from "./profiles";

describe("defaultProfiles", () => {
  it("is one profile, on the key the extension has always used", () => {
    // The whole safety argument for this feature: an existing install is a
    // one-profile install, nothing is migrated and nothing moves.
    expect(defaultProfiles().list).toHaveLength(1);
    expect(defaultProfiles().list[0].id).toBe(PRIMARY_PROFILE);
  });
});

describe("the primary's storage key", () => {
  it("is the key the extension has always used", () => {
    // PRIMARY_PROFILE is deliberately duplicated in the SDK's storage layer,
    // which cannot import from the app. This is the test that keeps the two
    // copies honest: if they ever disagree, every existing install looks for
    // its board under a key nothing wrote.
    expect(syncKeyFor(PRIMARY_PROFILE)).toBe(SYNC_KEY);
    expect(syncKeyFor(defaultProfiles().list[0].id)).toBe(SYNC_KEY);
  });
});

describe("hydrateProfiles", () => {
  it("passes a good roster through", () => {
    const stored = { list: [{ id: "1", name: "Main", emoji: "🏠" }, { id: "2", name: "Work", emoji: "💼" }] };
    expect(hydrateProfiles(stored).list).toEqual(stored.list);
  });

  it("falls back to one profile for anything unrecognisable", () => {
    for (const junk of [null, undefined, {}, { list: "nope" }, { list: [] }, 7, "x"]) {
      expect(hydrateProfiles(junk).list[0].id, JSON.stringify(junk)).toBe(PRIMARY_PROFILE);
    }
  });

  it("always keeps the primary, and keeps it first", () => {
    // Its settings are the ones under the original key. A roster without it, or
    // with it somewhere else, would orphan them.
    const missing = hydrateProfiles({ list: [{ id: "2", name: "Work" }] });
    expect(missing.list[0].id).toBe(PRIMARY_PROFILE);
    expect(missing.list.map((p) => p.id)).toContain("2");

    const reordered = hydrateProfiles({ list: [{ id: "3" }, { id: "1" }] });
    expect(reordered.list[0].id).toBe(PRIMARY_PROFILE);
  });

  it("drops duplicates and anything past the limit", () => {
    const stored = { list: [{ id: "1" }, { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }] };
    const list = hydrateProfiles(stored).list;
    expect(list).toHaveLength(MAX_PROFILES);
    expect(new Set(list.map((p) => p.id)).size).toBe(MAX_PROFILES);
  });

  it("gives every profile a name and an emoji even when the record has neither", () => {
    const list = hydrateProfiles({ list: [{ id: "1" }, { id: "2", name: "   " }] }).list;
    for (const p of list) {
      expect(p.name).toBeTruthy();
      expect(p.emoji).toBeTruthy();
    }
  });
});

describe("cleanName", () => {
  it("trims, collapses runs of space, and caps the length", () => {
    expect(cleanName("  Work    laptop  ")).toBe("Work laptop");
    expect(cleanName("x".repeat(50))).toHaveLength(24);
    expect(cleanName(undefined)).toBe("");
  });
});

describe("nextProfileId", () => {
  it("never reuses an id", () => {
    // A recycled id would inherit whatever settings the deleted profile left at
    // that storage key, which is the one thing a delete must be trusted about.
    expect(nextProfileId([{ id: "1" }])).toBe("2");
    expect(nextProfileId([{ id: "1" }, { id: "2" }])).toBe("3");
    expect(nextProfileId([{ id: "1" }, { id: "3" }])).toBe("2");
  });
});

describe("addProfile", () => {
  it("adds up to the limit and then stops", () => {
    let profiles = defaultProfiles();
    profiles = addProfile(profiles, { name: "Work" });
    profiles = addProfile(profiles, { name: "Study" });
    expect(profiles.list).toHaveLength(3);
    const full = addProfile(profiles, { name: "Fourth" });
    expect(full).toBe(profiles);
  });

  it("picks an emoji nobody is using yet", () => {
    const profiles = addProfile(defaultProfiles());
    expect(profiles.list[1].emoji).not.toBe(profiles.list[0].emoji);
  });

  it("names an unnamed profile rather than leaving it blank", () => {
    expect(addProfile(defaultProfiles(), { name: "  " }).list[1].name).toBeTruthy();
  });
});

describe("renameProfile", () => {
  it("changes the name and the emoji", () => {
    const profiles = renameProfile(defaultProfiles(), "1", { name: "Home", emoji: "🌱" });
    expect(profiles.list[0]).toMatchObject({ name: "Home", emoji: "🌱" });
  });

  it("refuses to leave a profile nameless", () => {
    const profiles = renameProfile(defaultProfiles(), "1", { name: "   " });
    expect(profiles.list[0].name).toBe("Main");
  });

  it("leaves the others alone", () => {
    const two = addProfile(defaultProfiles(), { name: "Work" });
    const renamed = renameProfile(two, "2", { name: "Job" });
    expect(renamed.list[0].name).toBe("Main");
  });
});

describe("removeProfile", () => {
  it("will not remove the primary", () => {
    const two = addProfile(defaultProfiles(), { name: "Work" });
    expect(canRemoveProfile(two, PRIMARY_PROFILE)).toBe(false);
    expect(removeProfile(two, PRIMARY_PROFILE)).toBe(two);
  });

  it("removes any other", () => {
    const two = addProfile(defaultProfiles(), { name: "Work" });
    expect(removeProfile(two, "2").list).toHaveLength(1);
  });

  it("ignores an id that is not there", () => {
    const one = defaultProfiles();
    expect(removeProfile(one, "9")).toBe(one);
  });
});

describe("resolveActive", () => {
  it("takes the stored id when it names a real profile", () => {
    const two = addProfile(defaultProfiles(), { name: "Work" });
    expect(resolveActive(two, "2")).toBe("2");
  });

  it("falls back to the primary when it does not", () => {
    // This is the device that did not do the deleting: its stored id points at
    // a profile that is gone, and it must land somewhere real rather than on an
    // empty board.
    expect(resolveActive(defaultProfiles(), "2")).toBe(PRIMARY_PROFILE);
    expect(resolveActive(defaultProfiles(), undefined)).toBe(PRIMARY_PROFILE);
  });
});

describe("profileById", () => {
  it("finds one, or says there is none", () => {
    expect(profileById(defaultProfiles(), "1").name).toBe("Main");
    expect(profileById(defaultProfiles(), "9")).toBeNull();
  });
});

describe("seedForNewProfile", () => {
  const defaults = () => ({
    board: { ids: ["clock"], layoutName: "Balanced" },
    appearance: { accent: "#6f9bff", wall: "Nebula" },
    behavior: { tourDone: false, showGreeting: true, searchEngine: "google" },
    profile: { name: "" },
    widgets: {},
  });

  const from = {
    board: { ids: ["links", "gapps"], layoutName: "Custom" },
    appearance: { accent: "#ff8f8f", wall: "Grain" },
    behavior: { tourDone: true, showGreeting: false, searchEngine: "bing" },
    profile: { name: "Mehrshad" },
    widgets: { links: { config: { items: [1, 2] } } },
  };

  it("starts the board, the look and the widgets clean", () => {
    // A profile that inherited these would be the same board twice, which is
    // not a second profile.
    const seed = seedForNewProfile(defaults(), from);
    expect(seed.board).toEqual(defaults().board);
    expect(seed.appearance).toEqual(defaults().appearance);
    expect(seed.widgets).toEqual({});
  });

  it("carries the name over, because it is the same person", () => {
    expect(seedForNewProfile(defaults(), from).profile.name).toBe("Mehrshad");
  });

  it("does not show somebody around twice", () => {
    // The bare defaults made a new profile open the first-run card and ask what
    // to call you, to somebody who had just created it from the settings drawer.
    expect(seedForNewProfile(defaults(), from).behavior.tourDone).toBe(true);
  });

  it("leaves every other behaviour at its default", () => {
    const seed = seedForNewProfile(defaults(), from);
    expect(seed.behavior.showGreeting).toBe(true);
    expect(seed.behavior.searchEngine).toBe("google");
  });

  it("works with nothing to copy from", () => {
    expect(seedForNewProfile(defaults(), null)).toEqual(defaults());
    expect(seedForNewProfile(defaults(), {}).behavior.tourDone).toBe(false);
  });
});
