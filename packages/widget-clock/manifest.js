export default {
  id: "clock",
  name: "Clock",
  glyph: "clock",
  category: "Essentials",
  author: "Daybreak",
  version: "2.1.0",
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
    { key: "hour24", label: "24-hour time", type: "boolean", default: false },
    { key: "seconds", label: "Show seconds", type: "boolean", default: false },
    { key: "hideDate", label: "Hide the date", type: "boolean", default: false },
    {
      key: "align",
      label: "Align",
      type: "enum",
      of: ["left", "center", "right"],
      labels: { left: "Left", center: "Centre", right: "Right" },
      default: "left",
    },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
};
