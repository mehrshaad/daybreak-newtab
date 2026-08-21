export default {
  id: "currency",
  name: "Currency",
  glyph: "currency",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.2.0",
  tagline: "Exchange rates, no key required.",
  description:
    "Rates from Frankfurter, built on European Central Bank data — no API " +
    "key, no account, updated once a day. Pick a base currency and up to " +
    "five others to track; the last successful reading is cached so the " +
    "tile still shows something offline. Iranian Rial is priced from " +
    "tgju.org's open-market rate (a one-time permission for that single " +
    "address, asked for when you turn it on) and falls back to the " +
    "official rate everyone else quotes when that isn't available.",
  sizes: [[2, 2], [3, 2]],
  defaultSize: [3, 2],
  options: [],
  refresh: null,
  permissions: { chrome: [], hosts: ["api.frankfurter.dev"] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Currencies",
    load: () => import("./Settings.jsx"),
  },
};
