import { describe, expect, it } from "vitest";
import {
  MAX_CITIES,
  addCity,
  cityKey,
  citiesOf,
  removeCity,
  shownCities,
  slotsFor,
  toggleShown,
} from "./cities";

const city = (name, latitude, longitude) => ({ name, latitude, longitude });
const LISBON = city("Lisbon", 38.71667, -9.13333);
const KYOTO = city("Kyoto", 35.0211, 135.7538);
const KYOTO_TZ = city("Kyoto", -1.6, 31.0);
const OSLO = city("Oslo", 59.91273, 10.74609);

describe("a city's identity", () => {
  it("is its coordinates, not its name", () => {
    // Open-Meteo returns several places called Kyoto. Keyed by name, two of
    // them on one board would share a cache entry and overwrite each other's
    // readings.
    expect(cityKey(KYOTO)).not.toBe(cityKey(KYOTO_TZ));
  });

  it("survives the same place being searched twice", () => {
    // The same search can come back differing in the sixth decimal.
    expect(cityKey({ ...LISBON, latitude: 38.716671 })).toBe(cityKey(LISBON));
  });

  it("falls back to the name rather than throwing on a half-formed city", () => {
    expect(cityKey({ name: "Nowhere" })).toBe("Nowhere");
    expect(cityKey(null)).toBe("");
  });
});

describe("a board written before this existed", () => {
  it("comes back as a one-city widget", () => {
    // The regression that matters. Reading `cities` and ignoring `city` would
    // show everybody who already had weather an empty tile asking them to pick
    // a place they had already picked.
    expect(citiesOf({ city: LISBON })).toEqual([LISBON]);
  });

  it("is still shown once migrated", () => {
    // One city fills one slot however many there are room for.
    expect(shownCities({ city: LISBON }, [4, 2]).map((c) => c.name)).toEqual(["Lisbon"]);
  });

  it("is empty when it never had a city either", () => {
    expect(citiesOf({})).toEqual([]);
    expect(citiesOf(undefined)).toEqual([]);
  });

  it("prefers the new shape once there is one", () => {
    expect(citiesOf({ city: LISBON, cities: [KYOTO] })).toEqual([KYOTO]);
  });
});

describe("how many fit", () => {
  it("is two only once there is width for two", () => {
    // Four columns is 511px, so each half is about 245 — measured on the
    // board at 4x2 and 4x3 with two cities and neither overflows. Three is
    // 379px, where a half would be under 190 and the temperature alone runs
    // most of that.
    expect(slotsFor([2, 2])).toBe(1);
    expect(slotsFor([3, 2])).toBe(1);
    expect(slotsFor([3, 3])).toBe(1);
    expect(slotsFor([4, 2])).toBe(2);
    expect(slotsFor([4, 3])).toBe(2);
    expect(slotsFor([6, 3])).toBe(2);
  });

  it("does not count height as room across", () => {
    // Two readouts need width. A tall narrow tile has no more of it.
    expect(slotsFor([3, 4])).toBe(slotsFor([3, 2]));
  });
});

describe("which cities are on screen", () => {
  const config = { cities: [LISBON, KYOTO, OSLO] };

  it("is the first ones when nothing has been ticked", () => {
    expect(shownCities(config, [6, 2]).map((c) => c.name)).toEqual(["Lisbon", "Kyoto"]);
  });

  it("is never more than fit", () => {
    expect(shownCities({ ...config, shown: [cityKey(LISBON), cityKey(KYOTO)] }, [3, 2])).toHaveLength(1);
  });

  it("honours the ticks", () => {
    const shown = [cityKey(OSLO), cityKey(KYOTO)];
    expect(shownCities({ ...config, shown }, [6, 2]).map((c) => c.name)).toEqual(["Oslo", "Kyoto"]);
  });

  it("ignores a tick for a city that has been removed", () => {
    // Removing a city must not leave a tick pointing at nothing, and must not
    // leave the widget blank because the only tick is now dead.
    const shown = [cityKey(OSLO)];
    const left = { cities: [LISBON, KYOTO], shown };
    expect(shownCities(left, [3, 2]).map((c) => c.name)).toEqual(["Lisbon"]);
  });

  it("is empty only when there are no cities at all", () => {
    expect(shownCities({ cities: [] }, [6, 2])).toEqual([]);
  });
});

describe("ticking a city", () => {
  const config = { cities: [LISBON, KYOTO, OSLO] };

  it("drops the one shown longest rather than refusing", () => {
    // A checkbox that can refuse is a checkbox that feels broken.
    const next = toggleShown({ ...config, shown: [cityKey(LISBON), cityKey(KYOTO)] }, [6, 2], cityKey(OSLO));
    expect(next).toEqual([cityKey(KYOTO), cityKey(OSLO)]);
  });

  it("unticks one when there is another left", () => {
    const next = toggleShown({ ...config, shown: [cityKey(LISBON), cityKey(KYOTO)] }, [6, 2], cityKey(LISBON));
    expect(next).toEqual([cityKey(KYOTO)]);
  });

  it("refuses to untick the last one", () => {
    // An empty weather widget is not a state anybody is asking for.
    const one = { cities: [LISBON, KYOTO], shown: [cityKey(LISBON)] };
    expect(toggleShown(one, [3, 2], cityKey(LISBON))).toEqual([cityKey(LISBON)]);
  });
});

describe("the list itself", () => {
  it("adds up to five and no more", () => {
    let config = { cities: [] };
    for (let i = 0; i < 8; i += 1) {
      config = { cities: addCity(config, city(`P${i}`, i, i)) };
    }
    expect(config.cities).toHaveLength(MAX_CITIES);
  });

  it("will not add the same place twice", () => {
    const config = { cities: [LISBON] };
    expect(addCity(config, { ...LISBON })).toHaveLength(1);
  });

  it("removes by key", () => {
    const config = { cities: [LISBON, KYOTO] };
    expect(removeCity(config, cityKey(LISBON)).map((c) => c.name)).toEqual(["Kyoto"]);
  });
});
