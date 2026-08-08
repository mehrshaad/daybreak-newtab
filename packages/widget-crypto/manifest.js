export default {
  id: "crypto",
  name: "Crypto",
  glyph: "crypto",
  category: "Lifestyle",
  author: "Daybreak",
  version: "2.0.0",
  tagline: "A short watchlist, no key required.",
  description:
    "Prices and 24-hour change from CoinGecko's free tier — no API key, no " +
    "account. Pick up to five coins and a fiat to price them in. The free " +
    "tier is easy to exhaust, which is why this refreshes at most every 5 " +
    "minutes and caches the last reading rather than going blank.",
  sizes: [
    [3, 2],
    [3, 3],
    [4, 3],
  ],
  defaultSize: [3, 2],
  options: [],
  // Never "Live": the free tier rate-limits aggressively.
  refresh: ["5 min", "1 hr"],
  permissions: { chrome: [], hosts: ["api.coingecko.com"] },
  load: () => import("./Widget.jsx"),
  settingsPanel: {
    title: "Watchlist",
    load: () => import("./Settings.jsx"),
  },
};
