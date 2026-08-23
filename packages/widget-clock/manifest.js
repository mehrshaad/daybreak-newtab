export default {
  id: "clock",
  name: "Clock",
  glyph: "clock",
  category: "Essentials",
  author: "Daybreak",
  version: "2.3.0",
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
      showIf: { analog: true },
    },
    {
      key: "dialDate",
      label: "Date in the dial",
      type: "boolean",
      default: false,
      showIf: { analog: true },
    },
    {
      key: "accentFace",
      label: "Accent dial edge",
      type: "boolean",
      default: false,
      showIf: { analog: true },
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
    { key: "hideDate", label: "Hide the date", type: "boolean", default: false },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
