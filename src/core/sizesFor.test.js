import { describe, expect, it } from "vitest";
import { sizesFor } from "../widgets/registry";

// Which sizes a widget offers, and the two bugs this narrowing produced.
//
// `sizesFor` exists so a widget can stop offering a size its own layout cannot
// use — Bookmarks showing every folder in one card has no business being 2x2.
// Both widgets that use it first keyed off an *option*, and both got it wrong
// in the same way:
//
//   1. Quick Links narrowed whenever `separate` was off, which is the state a
//      board that has never heard of folders is in — so plain Quick Links lost
//      2x2 for no reason at all.
//
//   2. A card split out of another is created and given its config in the same
//      tick that the original flips `separate`. React has not updated the store
//      by then, so the copies inherited the old value and came out with a
//      different set of sizes from the card they were split from. Measured on
//      the board: the first card offered 2x2 and the second did not.
//
// Both are fixed by reading the config, which is written at the moment of the
// split and is the same value for every card involved.

const size = (list) => list.map((s) => s.join("x"));

describe("Quick Links' sizes", () => {
  const all = size(sizesFor("links", {}, {}));

  it("offers everything to a board with no folders", () => {
    // The regression. A widget nobody has filed anything in is the common
    // case, and it kept every size it ever had.
    expect(all).toContain("2x2");
  });

  it("offers everything when one folder holds every link", () => {
    // One group needs no more room than no groups.
    const config = {
      items: [
        { id: "a", folder: "Dev" },
        { id: "b", folder: "Dev" },
      ],
    };
    expect(size(sizesFor("links", {}, config))).toContain("2x2");
  });

  it("wants room once there is more than one group to stack", () => {
    // Two headings and their links do not fit two columns by two rows.
    const config = {
      items: [
        { id: "a", folder: "Dev" },
        { id: "b" },
      ],
    };
    expect(size(sizesFor("links", {}, config))).not.toContain("2x2");
  });

  it("offers everything to a card pinned to one folder", () => {
    // A split card holds one group however many the board has, so it is back
    // to the single-group case.
    const config = {
      folder: "Dev",
      items: [
        { id: "a", folder: "Dev" },
        { id: "b", folder: "Dev" },
      ],
    };
    expect(size(sizesFor("links", {}, config))).toContain("2x2");
  });

  it("gives a split card the same sizes whatever its options say", () => {
    // The stale-read bug, stated directly: the copies' `separate` was false
    // while the original's was true, and nothing about the sizes may depend
    // on that.
    const config = { folder: "Dev", items: [{ id: "a", folder: "Dev" }] };
    const asCopy = size(sizesFor("links", { separate: false }, config));
    const asOriginal = size(sizesFor("links", { separate: true }, config));
    expect(asCopy).toEqual(asOriginal);
  });
});

describe("Bookmarks' sizes", () => {
  it("wants room while it is showing every folder", () => {
    expect(size(sizesFor("bookmarks", {}, {}))).not.toContain("2x2");
  });

  it("offers everything to a card pinned to one folder", () => {
    expect(size(sizesFor("bookmarks", {}, { folderId: "20" }))).toContain("2x2");
  });

  it("does not depend on the option a split sets in the same tick", () => {
    const pinned = { folderId: "20" };
    expect(size(sizesFor("bookmarks", { separate: false }, pinned))).toEqual(
      size(sizesFor("bookmarks", { separate: true }, pinned))
    );
  });
});

describe("every other widget", () => {
  it("offers exactly what its manifest declares", () => {
    // Only two widgets narrow. If a third starts, this says so rather than
    // leaving it to be noticed on the board.
    const narrowing = [];
    for (const id of ["clock", "weather", "tasks", "habits", "gapps", "topsites", "quote"]) {
      const withConfig = size(sizesFor(id, {}, {}));
      const withOther = size(sizesFor(id, { separate: true }, { folder: "x" }));
      if (withConfig.join() !== withOther.join()) narrowing.push(id);
    }
    expect(narrowing).toEqual([]);
  });
});

describe("Weather's sizes", () => {
  const CITY = (name, latitude, longitude) => ({ name, latitude, longitude });
  const LISBON = CITY("Lisbon", 38.7, -9.1);
  const KYOTO = CITY("Kyoto", 35.0, 135.8);

  it("withholds the six-wide size from a single city", () => {
    // It is the two-city size, and on one city it is a lot of empty width.
    expect(size(sizesFor("weather", {}, { cities: [LISBON] }))).not.toContain("6x3");
  });

  it("offers it once there are two", () => {
    expect(size(sizesFor("weather", {}, { cities: [LISBON, KYOTO] }))).toContain("6x3");
  });

  it("offers it to one city showing the week", () => {
    // The exception that has to survive: seven columns of icon and two
    // temperatures need six board columns, and layoutFor only widens to a
    // full week there — so withholding this would take away the only size
    // that can show the thing the person asked for.
    const week = { forecast: "daily" };
    expect(size(sizesFor("weather", week, { cities: [LISBON] }))).toContain("6x3");
  });

  it("still offers every smaller size to a single city", () => {
    const one = size(sizesFor("weather", {}, { cities: [LISBON] }));
    expect(one).toEqual(["2x2", "3x2", "4x2", "3x3", "4x3"]);
  });

  it("reads a board written before cities were a list", () => {
    // config.city, not config.cities. One city either way, so no 6x3.
    expect(size(sizesFor("weather", {}, { city: LISBON }))).not.toContain("6x3");
  });
});

describe("the size a widget is already on", () => {
  // A tile keeps its size when the shortlist changes: adding a folder to
  // Quick Links, or taking a city off Weather, narrows what is offered but
  // resizes nothing. Dropping the current size from the list left a picker
  // with nothing highlighted, which reads as the widget having lost its size
  // rather than as a size no longer being recommended.

  it("is offered even once it would be withdrawn", () => {
    const one = { cities: [{ name: "Lisbon", latitude: 38.7, longitude: -9.1 }] };
    expect(size(sizesFor("weather", {}, one))).not.toContain("6x3");
    expect(size(sizesFor("weather", {}, one, [6, 3]))).toContain("6x3");
  });

  it("keeps the declared order rather than tacking it on the end", () => {
    const one = { cities: [{ name: "Lisbon", latitude: 38.7, longitude: -9.1 }] };
    expect(size(sizesFor("weather", {}, one, [6, 3])).at(-1)).toBe("6x3");
    const links = { items: [{ id: "a", folder: "A" }, { id: "b" }] };
    expect(size(sizesFor("links", {}, links, [2, 2]))[0]).toBe("2x2");
  });

  it("does the same for Quick Links, which had the identical problem", () => {
    // A 2x2 card that gains a second folder would have lost 2x2 from its
    // picker while sitting at it.
    const twoGroups = { items: [{ id: "a", folder: "A" }, { id: "b" }] };
    expect(size(sizesFor("links", {}, twoGroups))).not.toContain("2x2");
    expect(size(sizesFor("links", {}, twoGroups, [2, 2]))).toContain("2x2");
  });

  it("does not invent a size the widget never declared", () => {
    // The current size comes from stored board data, which can name anything.
    expect(size(sizesFor("weather", {}, {}, [11, 9]))).not.toContain("11x9");
  });

  it("changes nothing when the current size was offered anyway", () => {
    const two = { cities: [{ name: "a", latitude: 1, longitude: 1 }, { name: "b", latitude: 2, longitude: 2 }] };
    expect(size(sizesFor("weather", {}, two, [4, 2]))).toEqual(size(sizesFor("weather", {}, two)));
  });
});
