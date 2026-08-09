// IRR isn't one of Frankfurter's currencies, so it's sourced separately and
// crossed through Frankfurter's own USD rate. Two sources, in preference
// order: tgju.org's open-market rate (what Iranians actually mean by "the
// dollar rate"), falling back to the official rate everyone else quotes when
// the tgju permission is missing or the fetch/parse fails.

export const TGJU_ORIGIN = "https://call1.tgju.org/*";
export const TGJU_URL = "https://call1.tgju.org/ajax.json";
export const ERAPI_URL = "https://open.er-api.com/v6/latest/USD";

// tgju's own frontend feed, not a documented API — quotes IRR per USD as a
// string with thousands commas (e.g. "1,861,900"). Rejects anything that
// doesn't parse to a sane positive number, so a reshaped payload falls
// through to the official-rate fallback instead of showing garbage.
export function parseTgju(payload) {
  const raw = payload?.current?.price_dollar_rl?.p;
  if (typeof raw !== "string") return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// open.er-api.com's official IRR per USD.
export function parseErApi(payload) {
  const n = payload?.rates?.IRR;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

// irrPerUsd (IRR per 1 USD) crossed through usdPerBase (USD per 1 unit of the
// user's chosen base, i.e. Frankfurter's own rates.USD for that base) gives
// IRR per 1 unit of base.
export function crossToBase(irrPerUsd, usdPerBase) {
  if (!Number.isFinite(irrPerUsd) || !Number.isFinite(usdPerBase)) return null;
  return irrPerUsd * usdPerBase;
}
