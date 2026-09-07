export default {
  id: "currency",
  name: "Currency",
  glyph: "currency",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.7.0",
  tagline: "Exchange rates, no key required.",
  description:
    "Rates from Frankfurter, built on European Central Bank data — no API " +
    "key, no account, updated once a day. Pick a base currency and up to " +
    "five others to track; the last successful reading is cached so the " +
    "tile still shows something offline. Iranian Rial is priced from " +
    "tgju.org's open-market rate (a one-time permission for that single " +
    "address, asked for when you turn it on) and falls back to the " +
    "official rate everyone else quotes when that isn't available.",
  actions: [{ id: "add", label: "Add a currency", panel: true }],
  sizes: [
    [2, 2],
    [3, 2],
    [3, 3],
  ],
  defaultSize: [3, 2],
  options: [
    {
      key: "decimals",
      label: "Decimals",
      type: "enum",
      of: ["auto", "2", "4"],
      labels: { auto: "Auto", "2": "2", "4": "4" },
      // Auto picks by magnitude, which is right for a mixed list and wrong for
      // anyone watching one pair move in the fourth place.
      default: "auto",
    },
    {
      key: "textSize",
      label: "Text size",
      type: "enum",
      of: ["regular", "large"],
      labels: { regular: "Regular", large: "Large" },
      default: "regular",
    },
    { key: "showSymbols", label: "Show currency symbols", type: "boolean", default: true },
  ],
  refresh: null,
  permissions: { chrome: [], hosts: ["api.frankfurter.dev"] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Currencies",
    load: () => import("./Settings.jsx"),
  },
};
