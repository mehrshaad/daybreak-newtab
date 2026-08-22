export default {
  id: "prayer",
  name: "Prayer times",
  glyph: "prayer",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "Today's times, worked out here.",
  description:
    "Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha for a city you pick, with the " +
    "next one counting down. Computed from the date and the coordinates on " +
    "this device — nothing is fetched and it needs no key, so it works offline " +
    "and on a plane. Ten calculation methods, both Asr reckonings, and " +
    "per-prayer adjustments, because the conventions genuinely disagree.",
  sizes: [
    [3, 2],
    [3, 3],
    [4, 2],
    [4, 3],
  ],
  defaultSize: [3, 3],
  options: [
    {
      key: "method",
      label: "Method",
      type: "enum",
      of: [
        "tehran",
        "jafari",
        "mwl",
        "isna",
        "egypt",
        "karachi",
        "makkah",
        "dubai",
        "qatar",
        "singapore",
      ],
      labels: {
        tehran: "Tehran",
        jafari: "Jafari",
        mwl: "MWL",
        isna: "ISNA",
        egypt: "Egypt",
        karachi: "Karachi",
        makkah: "Umm al-Qura",
        dubai: "Dubai",
        qatar: "Qatar",
        singapore: "Singapore",
      },
      default: "tehran",
    },
    {
      key: "asr",
      label: "Asr",
      type: "enum",
      of: ["standard", "hanafi"],
      labels: { standard: "Standard", hanafi: "Hanafi" },
      default: "standard",
    },
    { key: "hour24", label: "24-hour time", type: "boolean", default: true },
    { key: "hideSunrise", label: "Hide sunrise", type: "boolean", default: false },
    {
      key: "script",
      label: "Names in",
      type: "enum",
      of: ["latin", "farsi"],
      labels: { latin: "English", farsi: "فارسی" },
      default: "latin",
    },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: [] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Place and adjustments",
    load: () => import("./Settings.jsx"),
  },
};
