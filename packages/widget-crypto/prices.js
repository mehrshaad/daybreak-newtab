// CoinGecko's free tier — keyless, CORS-open, aggressively rate-limited,
// which is why the widget defaults to a 5-minute refresh and never offers
// "Live" (§ manifest). The plan's original query string used
// include_24h_change; the API only honours include_24hr_change (note the
// "hr") and otherwise silently omits the change field, so that is corrected
// here.
const ENDPOINT = "https://api.coingecko.com/api/v3/simple/price";

export function priceUrl(coins, fiat) {
  const ids = (coins || []).filter(Boolean).join(",");
  return (
    `${ENDPOINT}?ids=${encodeURIComponent(ids)}` +
    `&vs_currencies=${encodeURIComponent(fiat)}&include_24hr_change=true`
  );
}

// The change field is keyed "<fiat>_24h_change" — read dynamically rather
// than assuming "usd", since the base currency is user-configurable.
export function parsePrices(data, coins, fiat) {
  if (!data) return null;
  const changeKey = `${fiat}_24h_change`;
  return (coins || [])
    .filter((id) => data[id]?.[fiat] != null)
    .map((id) => ({
      id,
      price: data[id][fiat],
      change: data[id][changeKey] ?? null,
    }));
}

export function formatPrice(price, fiat) {
  if (price == null || Number.isNaN(price)) return "—";
  const digits = price >= 100 ? 0 : price >= 1 ? 2 : 6;
  const amount = price.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const symbol = { usd: "$", eur: "€", gbp: "£" }[fiat] || "";
  return `${symbol}${amount}`;
}

export function formatChange(change) {
  if (change == null || Number.isNaN(change)) return null;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
