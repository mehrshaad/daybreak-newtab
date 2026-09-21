// What each size shows.
//
// The rule has always been that extra room carries extra information rather
// than the same information larger. What it was missing is anything to put in
// that room: at 4x3 the widget drew a temperature, a line of text and a strip
// of five hours, and left most of the tile empty. A weather widget with space
// should be spending it on the day ahead and the numbers people actually check
// — which is what every good one does, and what the daily strip and the stat
// row are here for.
//
// 2x2 is the other end. Two columns is about 210px of usable width, where five
// hours of a mono strip wants nearly 190 before its gaps, so it wrapped onto a
// second line and pushed itself out of a two-row tile. A narrow tile shows
// three hours and a smaller readout.
//
// `want` is what the settings ask for; this decides what the tile can honour.
// A setting that is on and has nowhere to go is not a broken setting — the
// tile is simply too small for it — so the drawer keeps offering it.
export function layoutFor(size, want = {}) {
  const cols = size?.[0] ?? 3;
  const rows = size?.[1] ?? 2;
  const tall = rows >= 3;
  const narrow = cols <= 2;
  const roomy = rows >= 3 && cols >= 4;

  // One forecast strip, never two.
  //
  // They occupy the same band and drawing both filled the tile edge to edge
  // with numbers — which is what a pair of independent switches allowed and an
  // enum cannot express. Day by day also needs the height for an icon and two
  // temperatures per column, so asking for it on a short tile falls back to
  // the hours rather than showing nothing.
  const asked = want.forecast ?? "hourly";
  const daily = asked === "daily" && tall;
  const hourly = asked === "hourly" || (asked === "daily" && !tall);
  const stats = !!want.stats && !narrow;

  return {
    tall,
    narrow,
    roomy,
    stats,
    // The high/low/feels line, or the labelled grid on a tile with the height
    // for it. The grid replaces the one-line version rather than joining it,
    // and gives its band up to the day strip where that is showing.
    summary: cols >= 4 || tall,
    details: tall && !narrow && !daily,
    hourly,
    hours: narrow ? 3 : tall ? 6 : 5,
    hourIcons: tall && !narrow,
    daily,
    // Seven only where there is genuinely width for seven columns of icon and
    // two temperatures; five otherwise.
    days: cols >= 6 ? 7 : roomy ? 5 : 4,
    dailyIcons: !narrow,
  };
}

// Which extras a person has switched on, in the order they are shown.
//
// A fixed order, not the order they were enabled: the row is read at a glance
// and a set of chips that rearranges as you toggle them is harder to scan than
// one that does not.
export const STAT_KEYS = ["rain", "wind", "humidity", "uv"];

export function statsToShow(want, data) {
  return STAT_KEYS.filter((key) => want[key] && data?.[key] != null);
}

// How big the temperature is drawn.
//
// It used to branch on the tile's shape alone, which meant a 2x2 with the
// forecast and the stats both switched off drew a 32px number in the middle of
// an empty card — the readout had the whole tile to itself and was still
// sized for sharing it with a strip of five hours.
//
// So the tile's shape is only half the question. The other half is how many
// bands are actually below the readout, which is what decides how much room it
// has. Nothing below means the number is the widget, and it should look like
// it.
//
// `bands` is counted from what renders, not from what is switched on: a stat
// row with no data in it and an hourly strip on a reading that has no hours
// both take no room, and the readout should get it.
const HEADLINE = {
  // [bands >= 2, bands === 1, bands === 0]
  wide: {
    short: [
      { temp: "clamp(30px, 3.4vw, 40px)", icon: 30 },
      { temp: "clamp(36px, 4.2vw, 50px)", icon: 36 },
      { temp: "clamp(44px, 5.4vw, 66px)", icon: 44 },
    ],
    tall: [
      { temp: "clamp(38px, 4.4vw, 54px)", icon: 38 },
      { temp: "clamp(46px, 5.6vw, 72px)", icon: 46 },
      { temp: "clamp(58px, 7.4vw, 96px)", icon: 56 },
    ],
  },
  // Two columns is about 210px of usable width, so this scale is held back by
  // the width rather than by the height — a number that fits a three-row tile
  // vertically can still run off the side of a narrow one.
  narrow: {
    short: [
      { temp: "clamp(26px, 2.4vw, 32px)", icon: 24 },
      { temp: "clamp(30px, 3vw, 40px)", icon: 28 },
      { temp: "clamp(36px, 4vw, 50px)", icon: 34 },
    ],
    tall: [
      { temp: "clamp(26px, 2.4vw, 32px)", icon: 24 },
      { temp: "clamp(34px, 3.6vw, 46px)", icon: 32 },
      { temp: "clamp(42px, 5vw, 60px)", icon: 40 },
    ],
  },
};

export function headlineFor(size, { bands = 2 } = {}) {
  const cols = size?.[0] ?? 3;
  const rows = size?.[1] ?? 2;
  const column = cols <= 2 ? HEADLINE.narrow : HEADLINE.wide;
  const row = rows >= 3 ? column.tall : column.short;
  // Clamped rather than indexed blindly: `bands` is counted by the caller from
  // live data, and a surprising count should land on a sane size rather than
  // on undefined. NaN is checked rather than clamped — every comparison with
  // it is false, so Math.max and Math.min both pass it straight through and it
  // would index the array with NaN.
  const count = Number.isFinite(bands) ? Math.max(0, Math.round(bands)) : 2;
  return row[Math.max(0, Math.min(2, 2 - count))];
}
