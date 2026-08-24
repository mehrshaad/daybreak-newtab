import { describe, expect, it } from "vitest";
import { defaultSettings } from "./schema";
import { migrateV1, migrateV1Local, needsMigration } from "./migrate";

// Shaped like a real v1 `daybreakSettings` blob, including the Tehran +
// Toronto city list v1 shipped as its default.
const v1 = {
  wallpaper: "wp-7",
  tour: false,
  leftbar: "todo",
  general: { name: "Mehrshad", searchEngine: "duckduckgo" },
  notes: { text: "remember the milk" },
  cities: {
    unit: "f",
    showClock: true,
    showWeather: true,
    cityList: [
      {
        name: "Tehran",
        country: "Iran",
        latitude: 35.6944,
        longitude: 51.4215,
        timezone: "Asia/Tehran",
      },
      {
        name: "Toronto",
        country: "Canada",
        latitude: 43.7001,
        longitude: -79.4163,
        timezone: "America/Toronto",
      },
    ],
  },
  todo: {
    todoList: [
      { id: "a", task: "Visit my github page!", completed: false, date: "2026-07-01" },
      { id: "b", task: "Install this extension!", completed: true, date: "2026-07-02" },
    ],
  },
  bookmarks: {
    bookmarksList: [
      { name: "ChatGPT", url: "https://chat.openai.com", color: "x", icon: "y" },
      { name: "Github", url: "https://github.com", color: "x", icon: "y" },
    ],
  },
};

describe("needsMigration", () => {
  it("is true only for a non-empty v1 object", () => {
    expect(needsMigration(v1)).toBe(true);
    expect(needsMigration({})).toBe(false);
    expect(needsMigration(null)).toBe(false);
    expect(needsMigration(undefined)).toBe(false);
  });
});

describe("migrateV1", () => {
  const out = migrateV1(v1);

  it("carries the name and search engine over", () => {
    expect(out.profile.name).toBe("Mehrshad");
    expect(out.behavior.searchEngine).toBe("duckduckgo");
  });

  it("ignores a search engine v2 does not offer", () => {
    const odd = migrateV1({ general: { searchEngine: "askjeeves" } });
    expect(odd.behavior.searchEngine).toBe(defaultSettings().behavior.searchEngine);
  });

  // A v1 install is an existing user; v2's welcome card is for a genuinely
  // fresh install and should never resurface for someone upgrading.
  it("marks the v2 welcome tour as already done", () => {
    expect(out.behavior.tourDone).toBe(true);
    expect(migrateV1({}).behavior.tourDone).toBe(true);
  });

  it("uses the first city for Weather, preserving the unit", () => {
    expect(out.widgets.weather.config.city.name).toBe("Tehran");
    expect(out.widgets.weather.config.city.latitude).toBe(35.6944);
    expect(out.widgets.weather.options.fahrenheit).toBe(true);
  });

  // The point of the World Clocks widget: a v1 user tracking two cities
  // should come out the other side still tracking both.
  it("turns every v1 city into a world clock", () => {
    expect(out.widgets.worldclocks.config.zones).toEqual([
      { city: "Tehran", tz: "Asia/Tehran" },
      { city: "Toronto", tz: "America/Toronto" },
    ]);
  });

  it("caps world clocks at four zones", () => {
    const many = migrateV1({
      cities: {
        cityList: Array.from({ length: 7 }, (_, i) => ({
          name: `City${i}`,
          timezone: "UTC",
        })),
      },
    });
    expect(many.widgets.worldclocks.config.zones).toHaveLength(4);
  });

  it("skips cities with no timezone", () => {
    const partial = migrateV1({
      cities: { cityList: [{ name: "Nowhere" }, { name: "Tehran", timezone: "Asia/Tehran" }] },
    });
    expect(partial.widgets.worldclocks.config.zones).toEqual([
      { city: "Tehran", tz: "Asia/Tehran" },
    ]);
  });

  it("renames todo fields to the v2 shape", () => {
    expect(out.widgets.tasks.config.items).toEqual([
      { id: "a", text: "Visit my github page!", done: false, due: "2026-07-01" },
      { id: "b", text: "Install this extension!", done: true, due: "2026-07-02" },
    ]);
  });

  it("keeps bookmarks as quick links, dropping v1 icon and colour", () => {
    expect(out.widgets.links.config.items).toEqual([
      { id: "v1-0", name: "ChatGPT", url: "https://chat.openai.com" },
      { id: "v1-1", name: "Github", url: "https://github.com" },
    ]);
  });

  it("labels a nameless bookmark with its host, not the whole url", () => {
    const out = migrateV1({
      bookmarks: {
        bookmarksList: [
          { url: "https://www.example.com/some/path?q=1" },
          { url: "not a url" },
        ],
      },
    });
    expect(out.widgets.links.config.items.map((l) => l.name)).toEqual([
      "example.com",
      "not a url",
    ]);
  });

  it("drops bookmark entries with no url", () => {
    const partial = migrateV1({
      bookmarks: { bookmarksList: [{ name: "Broken" }, { name: "OK", url: "https://ok.dev" }] },
    });
    expect(partial.widgets.links.config.items).toHaveLength(1);
  });

  it("produces a valid v2 settings object", () => {
    expect(out.v).toBe(2);
    expect(Array.isArray(out.board.ids)).toBe(true);
    expect(out.appearance.theme).toBeTruthy();
  });

  it("returns clean defaults for junk input", () => {
    // The default name, not an empty one: junk in means this is effectively a
    // fresh install, and a fresh install is greeted by name like any other.
    // A real v1 name still wins — the case below covers that.
    const { profile } = defaultSettings();
    for (const junk of [null, undefined, "nope", 42, []]) {
      const result = migrateV1(junk);
      expect(result.v).toBe(2);
      expect(result.profile.name).toBe(profile.name);
    }
  });

  it("keeps a real v1 name rather than the default", () => {
    expect(migrateV1({ general: { name: "Sam" } }).profile.name).toBe("Sam");
  });

  it("does not invent widget records for absent v1 features", () => {
    const bare = migrateV1({ general: { name: "Sam" } });
    expect(bare.widgets.weather).toBeUndefined();
    expect(bare.widgets.tasks).toBeUndefined();
    expect(bare.widgets.links).toBeUndefined();
    expect(bare.widgets.worldclocks).toBeUndefined();
  });
});

describe("migrateV1Local", () => {
  // Note text is too big for the shared 8KB sync item, so it is seeded into
  // the local bucket the Scratchpad widget reads.
  it("seeds the scratchpad bucket", () => {
    expect(migrateV1Local(v1)).toEqual({ "scratchpad:text": "remember the milk" });
  });

  it("is null when there is no note", () => {
    expect(migrateV1Local({ notes: { text: "" } })).toBeNull();
    expect(migrateV1Local({})).toBeNull();
    expect(migrateV1Local(null)).toBeNull();
  });
});
