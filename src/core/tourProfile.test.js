import { beforeEach, describe, expect, it } from "vitest";
import {
  TOUR_BOARD,
  TOUR_PROFILE,
  endTourSession,
  isTourProfile,
  seedForTour,
  startTourSession,
  strandedInTour,
  tourReturnTo,
} from "./tourProfile";
import { MAX_PROFILES, PRIMARY_PROFILE, addProfile, hydrateProfiles, nextProfileId, resolveActive } from "./profiles";
import { defaultSettings } from "./schema";

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // no-op
  }
});

describe("the tour's own profile", () => {
  it("has an id no real profile can ever take", () => {
    // Load-bearing. nextProfileId only mints numbers, so a word can never
    // collide with a profile somebody created.
    const full = { list: Array.from({ length: 9 }, (_, i) => ({ id: String(i + 1) })) };
    expect(nextProfileId(full.list)).not.toBe(TOUR_PROFILE);
    expect(Number.isNaN(Number(TOUR_PROFILE))).toBe(true);
  });

  it("does not cost anybody one of their three", () => {
    // It is never added to the roster, so the limit is untouched by a replay.
    let profiles = hydrateProfiles(null);
    while (profiles.list.length < MAX_PROFILES) profiles = addProfile(profiles, {});
    expect(profiles.list).toHaveLength(MAX_PROFILES);
    expect(profiles.list.some((p) => p.id === TOUR_PROFILE)).toBe(false);
  });

  it("is still accepted as the active profile", () => {
    // It is not in the roster, so the ordinary answer would be to bounce back
    // to primary — and the replay would never start.
    const roster = hydrateProfiles(null);
    expect(resolveActive(roster, TOUR_PROFILE)).toBe(PRIMARY_PROFILE);
    expect(resolveActive(roster, TOUR_PROFILE, { allow: [TOUR_PROFILE] })).toBe(TOUR_PROFILE);
  });

  it("does not let any other unknown id through", () => {
    const roster = hydrateProfiles(null);
    expect(resolveActive(roster, "99", { allow: [TOUR_PROFILE] })).toBe(PRIMARY_PROFILE);
  });
});

describe("the session marker", () => {
  it("remembers where to go back to, across the reload that starts the tour", () => {
    // Switching profiles reloads the page, so this cannot be React state.
    startTourSession("2");
    expect(tourReturnTo()).toBe("2");
  });

  it("is gone once the tour ends", () => {
    startTourSession("2");
    endTourSession();
    expect(tourReturnTo()).toBeNull();
  });

  it("defaults to the primary profile rather than nothing", () => {
    startTourSession(undefined);
    expect(tourReturnTo()).toBe(PRIMARY_PROFILE);
  });
});

describe("being stranded", () => {
  it("is the tour profile active with no tour running", () => {
    // A reload after the marker cleared, or a crash mid-tour. Without noticing
    // this, somebody is left on a board that is not theirs with no way back
    // they would think to look for.
    expect(strandedInTour(TOUR_PROFILE)).toBe(true);
  });

  it("is not a tour that is actually running", () => {
    startTourSession(PRIMARY_PROFILE);
    expect(strandedInTour(TOUR_PROFILE)).toBe(false);
  });

  it("is not any ordinary profile", () => {
    expect(strandedInTour(PRIMARY_PROFILE)).toBe(false);
    expect(strandedInTour("2")).toBe(false);
  });
});

describe("the board a replay runs on", () => {
  const seeded = () => seedForTour(defaultSettings(), { profile: { name: "Sam" }, behavior: { tourDone: true } });

  it("has widgets, because half the steps need one to point at", () => {
    // Five of fifteen steps carry needs: "widget". A replay on an empty board
    // skips them and explains a tile menu it cannot open.
    expect(seeded().board.ids.length).toBeGreaterThan(1);
    expect(seeded().board.ids).toEqual(TOUR_BOARD);
  });

  it("is not marked as already toured", () => {
    // It exists to run the tour. Carrying tourDone across would be the one
    // setting that stops it.
    expect(seeded().behavior.tourDone).toBe(false);
  });

  it("keeps the person's name, so the greeting is not addressed to a stranger", () => {
    expect(seeded().profile.name).toBe("Sam");
  });

  it("gives every widget on it a size", () => {
    const seed = seeded();
    for (const id of seed.board.ids) expect(seed.board.sizes[id], id).toBeTruthy();
  });

  it("marks them installed as well as placed", () => {
    const seed = seeded();
    for (const id of seed.board.ids) expect(seed.board.installed).toContain(id);
  });
});

describe("isTourProfile", () => {
  it("recognises only the tour", () => {
    expect(isTourProfile(TOUR_PROFILE)).toBe(true);
    expect(isTourProfile(PRIMARY_PROFILE)).toBe(false);
    expect(isTourProfile(undefined)).toBe(false);
  });
});
