// CoinGecko's free tier — keyless, CORS-open, aggressively rate-limited,
// which is why the widget defaults to a 5-minute refresh and never offers
// "Live" (§ manifest). One call to /coins/markets carries price, 24h change,
// logo and a 7-day sparkline together, rather than the three separate
// requests that would take.
const ENDPOINT = "https://api.coingecko.com/api/v3/coins/markets";

export function priceUrl(coins, fiat) {
  const ids = (coins || []).filter(Boolean).join(",");
  return (
    `${ENDPOINT}?vs_currency=${encodeURIComponent(fiat)}&ids=${encodeURIComponent(ids)}` +
    `&sparkline=true&price_change_percentage=24h`
  );
}

// Kept in the caller's watchlist order rather than the response's — CoinGecko
// sorts by market cap, and the user chose their own order on purpose.
export function parsePrices(data, coins) {
  if (!Array.isArray(data)) return null;
  const byId = new Map(data.map((c) => [c.id, c]));
  return (coins || [])
    .filter((id) => byId.get(id)?.current_price != null)
    .map((id) => {
      const c = byId.get(id);
      return {
        id,
        price: c.current_price,
        change: c.price_change_percentage_24h ?? null,
        image: c.image || null,
        sparkline: Array.isArray(c.sparkline_in_7d?.price) ? c.sparkline_in_7d.price : null,
      };
    });
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
