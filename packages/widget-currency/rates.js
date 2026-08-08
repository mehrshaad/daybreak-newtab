// Frankfurter (ECB reference rates) — keyless, CORS-open, updates once a
// day. Renamed host/path from the plan's original api.frankfurter.app/latest:
// that address now 301s to api.frankfurter.dev/v1/latest, so this targets the
// current one directly rather than paying for a redirect on every fetch.
const ENDPOINT = "https://api.frankfurter.dev/v1/latest";

export function ratesUrl(base, targets) {
  const to = (targets || []).filter(Boolean).join(",");
  return `${ENDPOINT}?from=${encodeURIComponent(base)}${to ? `&to=${encodeURIComponent(to)}` : ""}`;
}

// More decimal places for a rate under 1 ("0.0067") and fewer above it, so
// every pair reads at a sensible precision without a per-currency table.
export function formatRate(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  const digits = rate >= 100 ? 0 : rate >= 1 ? 2 : 4;
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Kept in the caller's target order rather than the response's — a plain
// object has no guaranteed key order across engines, and the user chose that
// order on purpose.
export function parseRates(data, targets) {
  if (!data?.rates || !data.base) return null;
  const order = targets?.length ? targets : Object.keys(data.rates);
  return {
    base: data.base,
    date: data.date,
    pairs: order
      .filter((code) => data.rates[code] != null)
      .map((code) => ({ code, rate: data.rates[code] })),
  };
}
