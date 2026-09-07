import { beforeEach, describe, expect, it } from "vitest";
import {
  BASE_TITLE,
  claimTitle,
  releaseTitle,
  resetTitleOwner,
  titleFor,
  writeTitle,
} from "./tabTitle";

beforeEach(() => {
  resetTitleOwner();
  document.title = BASE_TITLE;
});

describe("titleFor", () => {
  it("puts the clock and the phase in the tab", () => {
    expect(titleFor({ running: true, clock: "24:59", phase: "Focus" })).toBe("24:59 · Focus");
  });

  it("names the phase, because a bare number has no subject", () => {
    expect(titleFor({ running: true, clock: "04:12", phase: "Break" })).toBe("04:12 · Break");
  });

  it("is the plain title when nothing is running", () => {
    expect(titleFor({ running: false, clock: "24:59", phase: "Focus" })).toBe(BASE_TITLE);
  });

  it("is the plain title with no clock to show", () => {
    // A paused run with nothing written down yet, and the first render before
    // the phase length has resolved.
    expect(titleFor({ running: true, clock: "", phase: "Focus" })).toBe(BASE_TITLE);
    expect(titleFor({ running: true, clock: null, phase: "Focus" })).toBe(BASE_TITLE);
  });
});

describe("the one owner", () => {
  it("gives the title to the first timer that asks", () => {
    expect(claimTitle("timer")).toBe(true);
  });

  it("refuses a second timer, which Duplicate is one click from making", () => {
    // Two timers writing document.title every 250ms would fight over it. The
    // second one's own tile still shows its own countdown, so nothing is lost.
    expect(claimTitle("timer")).toBe(true);
    expect(claimTitle("timer#2")).toBe(false);
  });

  it("lets the claim be re-made by whoever holds it", () => {
    // An effect can re-run — a re-render, StrictMode's double invocation —
    // and must not lose the title it already has.
    expect(claimTitle("timer")).toBe(true);
    expect(claimTitle("timer")).toBe(true);
  });

  it("hands it on once the holder lets go", () => {
    claimTitle("timer");
    releaseTitle("timer");
    expect(claimTitle("timer#2")).toBe(true);
  });

  it("ignores a release from anyone else", () => {
    // Or the second timer stopping would take the title off the first.
    claimTitle("timer");
    releaseTitle("timer#2");
    expect(claimTitle("timer#2")).toBe(false);
  });
});

describe("writing it", () => {
  it("writes only for the holder", () => {
    claimTitle("timer");
    writeTitle("timer#2", "09:99 · Nonsense");
    expect(document.title).toBe(BASE_TITLE);
    writeTitle("timer", "12:00 · Focus");
    expect(document.title).toBe("12:00 · Focus");
  });

  it("puts the plain title back on release", () => {
    // The part that matters: a paused timer, a removed tile or a closed tab
    // must not leave a stale countdown in the tab strip.
    claimTitle("timer");
    writeTitle("timer", "12:00 · Focus");
    releaseTitle("timer");
    expect(document.title).toBe(BASE_TITLE);
  });

  it("writes nothing before anyone has claimed it", () => {
    writeTitle("timer", "12:00 · Focus");
    expect(document.title).toBe(BASE_TITLE);
  });
});
