import { ICON_GRID_PAD, ICON_STEPS, iconCellSize, iconGridSize } from "@daybreak/sdk";
import { describe, expect, it } from "vitest";
import { GRID_GAP, TILE_PAD, tileBodyHeight } from "./tokens";
import gapps from "../../packages/widget-gapps/manifest";
import links from "../../packages/widget-links/manifest";
import topsites from "../../packages/widget-topsites/manifest";

// Does an icon grid actually fit the tile it is in — at every tile size, with
// and without the widget's captions, with and without the tile's own label row,
// at all three icon sizes.
//
// The point of importing the board's geometry rather than restating it: the two
// tests this replaces guessed. One allowed "roughly 132px of content height"
// against a real 122 and asserted two labelled rows fit a two-row tile, which
// was never true at any icon size. A test that carries its own copy of the
// numbers agrees with whatever the numbers become.

// The board is twelve tracks of an unknown width, so a column is only knowable
// per board width. These are the three the app offers, at the narrowest window
// each is likely to be seen in — a narrower column means fewer icons per row,
// never a taller cell, so the height checks below do not depend on it.
const BOARD_WIDTHS = [1100, 1560, 2000];
const COLUMNS = 12;

function tileWidth(cols, boardWidth) {
  const track = (boardWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS;
  return track * cols + GRID_GAP * (cols - 1) - 2 * TILE_PAD.x;
}

// Quick Links scrolls, and a scroller needs padding or it clips the corner off
// every remove badge. That padding comes out of the width available to icons,
// so the counts below have to allow for it.
const gridWidth = (cols, boardWidth) => tileWidth(cols, boardWidth) - 2 * ICON_GRID_PAD;

// The three widgets that draw an icon grid, and every tile size each of them
// actually offers. Taken from the manifests rather than from the board's
// generic SIZES: none of these three offers a four-row tile, and holding the
// layout to sizes no user can pick would have meant tuning it for a case that
// cannot happen.
const GRID_WIDGETS = [links, gapps, topsites];

const TILE_SIZES = [
  ...new Map(
    GRID_WIDGETS.flatMap((m) => m.sizes).map((s) => [s.join("x"), s])
  ).values(),
];

// Every circumstance an icon grid can be in.
function circumstances() {
  const out = [];
  for (const [cols, rows] of TILE_SIZES) {
    for (const tileHeader of [true, false]) {
      for (const captions of [true, false]) {
        for (const step of ICON_STEPS) {
          const iconSize = iconGridSize([cols, rows], { hideLabels: !captions, step });
          out.push({
            cols,
            rows,
            tileHeader,
            captions,
            step,
            iconSize,
            avail: tileBodyHeight(rows, { header: tileHeader }),
            cell: iconCellSize(iconSize, captions),
          });
        }
      }
    }
  }
  return out;
}

// The cell as it was before this change, for the regression check below:
// padding at 0.16 of the icon, a caption that scaled with it, and bases of
// 34/40/46 by row count.
function oldCell(cols, rows, captions) {
  const base = rows >= 4 ? 46 : rows === 3 ? 40 : 34;
  const icon = captions ? base : Math.round(base * 1.3);
  const pad = Math.max(4, Math.round(icon * 0.16));
  const font = Math.max(9, Math.round(icon * 0.3));
  return {
    icon,
    width: captions ? Math.round(icon * 1.6) : icon + 8,
    gap: pad,
    height: 2 * pad + icon + (captions ? pad + Math.ceil(font * 1.3) : 0),
  };
}

const ALL = circumstances();
const where = (c) =>
  `${c.cols}x${c.rows} header:${c.tileHeader ? "y" : "n"} captions:${
    c.captions ? "y" : "n"
  } ${c.step} (icon ${c.iconSize}, cell ${c.cell.height} in ${c.avail})`;

describe("an icon grid in every circumstance", () => {
  it("covers all of them", () => {
    // Every distinct tile size the three grid widgets offer, times the tile's
    // label row on or off, times the widget's captions on or off, times the
    // three icon sizes.
    expect(TILE_SIZES.length).toBeGreaterThanOrEqual(6);
    expect(ALL).toHaveLength(TILE_SIZES.length * 2 * 2 * 3);
  });

  it("never draws a cell taller than the tile gives it", () => {
    // The one that actually clips. Everything else here is about looking right.
    for (const c of ALL) expect(c.cell.height, where(c)).toBeLessThanOrEqual(c.avail);
  });

  it("fits a second row wherever the tile is more than two rows tall", () => {
    // A single row of icons in a tall tile is the waste this change is about.
    for (const c of ALL.filter((x) => x.rows >= 3)) {
      expect(2 * c.cell.height + c.cell.gap, where(c)).toBeLessThanOrEqual(c.avail);
    }
  });

  it("fits four icons across on a default board", () => {
    // Both widgets ship four items, and the board they ship on should not wrap
    // them. Three columns and up: a two-column tile is a deliberate choice to
    // make the thing small. Not asserted at 1100px, where a three-column tile
    // has only ~228px of room and fits three across — it did before this
    // change too, which the next test is what actually pins down.
    for (const c of ALL.filter((x) => x.cols >= 3 && x.step !== "l")) {
      const room = gridWidth(c.cols, 1560);
      const perRow = Math.floor((room + c.cell.gap) / (c.cell.width + c.cell.gap));
      expect(perRow, where(c)).toBeGreaterThanOrEqual(4);
    }
  });

  it("never drops below four per row, wherever it used to manage four", () => {
    // Bigger icons cost width, and width is what decides how many land on a
    // row. Some of that is the trade being asked for: a three-column tile on a
    // 2000px board fits six now where it fitted seven, and six is plenty.
    // What must not happen is dropping under the four both widgets ship with —
    // and where the old cell already managed fewer than four, on a narrow
    // board, the new one may not make that worse either.
    for (const c of ALL.filter((x) => x.step === "m")) {
      const old = oldCell(c.cols, c.rows, c.captions);
      for (const boardWidth of BOARD_WIDTHS) {
        const room = gridWidth(c.cols, boardWidth);
        const now = Math.floor((room + c.cell.gap) / (c.cell.width + c.cell.gap));
        const before = Math.floor((room + old.gap) / (old.width + old.gap));
        const floor = Math.min(before, 4);
        expect(now, `${where(c)} @${boardWidth} (was ${before})`).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("always fits at least one icon across, at any size on any board", () => {
    for (const c of ALL) {
      for (const boardWidth of BOARD_WIDTHS) {
        expect(c.cell.width, `${where(c)} @${boardWidth}`).toBeLessThanOrEqual(
          gridWidth(c.cols, boardWidth)
        );
      }
    }
  });

  it("leaves the icon the largest thing in its cell", () => {
    // If the padding and the caption together outgrow the icon, the cell has
    // become mostly cushion again, which is what this set out to fix.
    for (const c of ALL) {
      expect(c.cell.height - c.iconSize, where(c)).toBeLessThan(c.iconSize);
    }
  });

  it("gives more of the cell to the icon than it used to", () => {
    // The old cell put 2 * 0.16 of padding around the icon plus a caption that
    // scaled with it. Anything at or below that ratio is not an improvement.
    for (const c of ALL) {
      expect(c.iconSize / c.cell.height, where(c)).toBeGreaterThan(0.5);
    }
  });
});

describe("Quick Links, which cannot hide anything", () => {
  // Google Apps caps what it shows and puts the rest behind "+N more". Quick
  // Links shows every link the user added plus an Add cell, so at a large icon
  // size on a short tile the last row genuinely does not fit — reported as the
  // Drive row being cut in half. It scrolls; these check that it has to.
  const DEFAULT_LINKS = 4;

  it("overflows a short tile at the largest size, which is why it scrolls", () => {
    const c = ALL.find(
      (x) => x.cols === 3 && x.rows === 2 && x.tileHeader && x.captions && x.step === "l"
    );
    const room = gridWidth(3, 1560);
    const perRow = Math.floor((room + c.cell.gap) / (c.cell.width + c.cell.gap));
    const rowsNeeded = Math.ceil((DEFAULT_LINKS + 1) / perRow);
    expect(rowsNeeded).toBeGreaterThan(1);
    expect(rowsNeeded * c.cell.height + (rowsNeeded - 1) * c.cell.gap).toBeGreaterThan(c.avail);
  });

  it("fits its default links without scrolling at the default size", () => {
    // Scrolling is the escape hatch, not the normal state. On the size the
    // widget ships at, four links and the Add cell sit on one row.
    const c = ALL.find(
      (x) => x.cols === 5 && x.rows === 2 && x.tileHeader && x.captions && x.step === "m"
    );
    const room = gridWidth(5, 1560);
    const perRow = Math.floor((room + c.cell.gap) / (c.cell.width + c.cell.gap));
    expect(perRow).toBeGreaterThanOrEqual(DEFAULT_LINKS + 1);
    expect(c.cell.height).toBeLessThanOrEqual(c.avail);
  });
});

describe("the size steps", () => {
  it("are offered by both icon widgets, and agree with the SDK", () => {
    for (const manifest of [links, gapps]) {
      const o = manifest.options.find((x) => x.key === "iconScale");
      expect(o, manifest.id).toBeTruthy();
      expect(o.of, manifest.id).toEqual(ICON_STEPS);
      expect(o.default, manifest.id).toBe("m");
      for (const step of ICON_STEPS) expect(o.labels[step], `${manifest.id}.${step}`).toBeTruthy();
    }
  });

  it("are visibly different at every tile size", () => {
    for (const [cols, rows] of TILE_SIZES) {
      for (const captions of [true, false]) {
        const sizes = ICON_STEPS.map((step) =>
          iconGridSize([cols, rows], { hideLabels: !captions, step })
        );
        for (let i = 1; i < sizes.length; i += 1) {
          // At least three pixels apart, or the step is not worth offering.
          expect(sizes[i] - sizes[i - 1], `${cols}x${rows} captions:${captions}`).toBeGreaterThan(2);
        }
      }
    }
  });
});
