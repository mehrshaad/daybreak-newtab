export default {
  id: "clock",
  name: "Clock",
  glyph: "clock",
  category: "Essentials",
  author: "Daybreak",
  version: "2.6.0",
  tagline: "The time and today's date, digital or analog.",
  description:
    "A large, quiet clock with the full date underneath, or an analog face " +
    "with a sweeping second hand. Reads your system clock, so it works " +
    "offline and sends nothing anywhere.",
  // Two sizes: the wide ones only stretched the same content across more of the
  // board. The taller size is the one that earns its space, with a much bigger
  // readout and a full analog face.
  sizes: [
    // 2x2 for anyone who wants the time small and out of the way. The digits
    // and the date step down with it rather than being clipped.
    [2, 2],
    [3, 2],
    [3, 3],
  ],
  defaultSize: [3, 2],
  options: [
    { key: "analog", label: "Analog face", type: "boolean", default: false },
    // Analog only. Without showIf these sat beside the digital settings doing
    // nothing in whichever mode was not selected.
    {
      key: "face",
      label: "Face",
      type: "enum",
      // Squared first, and the default. It is the face that fills a tile —
      // a circle in a rounded rectangle leaves four corners of dead space —
      // and it is the one that makes the widget read as a clock rather than as
      // a clock drawn inside a card.
      of: ["squared", "round"],
      labels: { squared: "Squared", round: "Round" },
      default: "squared",
      // Only while the tile has a header. Without one the dial becomes the tile
      // itself and is drawn to the tile's own rectangle rather than to a shape
      // inscribed in it, so both choices render exactly the same thing and the
      // setting is a control that does nothing.
      showIf: { analog: true, tileHeader: true },
    },
    // One control for the date, in both modes, and it absorbs what used to be
    // a separate "Hide the date" switch. How much of the date to show and
    // whether to show it at all are one decision, and splitting them left a
    // toggle sitting three rows below the choice it overrode.
    //
    // Not "in the dial or under it" any more either: on a dial the date belongs
    // on the dial, and the line underneath was stealing height from the face
    // that is the whole point of the mode. A new key rather than the old
    // boolean, so a stored true/false cannot arrive where an enum is expected.
    {
      key: "dateForm",
      label: "Date",
      type: "enum",
      of: ["full", "day", "none"],
      labels: { full: "Complete date", day: "Just the date", none: "Hidden" },
      default: "full",
    },
    {
      key: "accentFace",
      label: "Accent dial edge",
      type: "boolean",
      default: false,
      showIf: { analog: true },
    },
    // Digital only: the dial already fills whatever tile it is given, so it
    // has nothing to scale.
    {
      key: "textSize",
      label: "Size",
      type: "enum",
      of: ["s", "m", "l", "xl", "xxl"],
      labels: { s: "S", m: "M", l: "L", xl: "XL", xxl: "XXL" },
      // A share of the space the tile actually has, not a fixed point size, so
      // every step still adapts when the tile is resized. M is where the
      // measured fit already sat, so nobody's clock changes size by upgrading.
      default: "m",
      showIf: { analog: false },
    },
    // Digital only: there is nothing to align on a dial.
    {
      key: "align",
      label: "Align",
      type: "enum",
      of: ["left", "center", "right"],
      labels: { left: "Left", center: "Centre", right: "Right" },
      default: "left",
      showIf: { analog: false },
    },
    // Both modes.
    // Digital only: a dial has twelve hours on it whatever this says.
    {
      key: "hour24",
      label: "24-hour time",
      type: "boolean",
      default: false,
      showIf: { analog: false },
    },
    { key: "seconds", label: "Show seconds", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
