// A fixed shortlist of CoinGecko's own id slugs (not ticker symbols — the API
// keys prices by id) rather than fetching the full multi-thousand-coin list
// just to populate a picker.
export const COINS = [
  ["bitcoin", "BTC", "Bitcoin"],
  ["ethereum", "ETH", "Ethereum"],
  ["tether", "USDT", "Tether"],
  ["binancecoin", "BNB", "BNB"],
  ["solana", "SOL", "Solana"],
  ["ripple", "XRP", "XRP"],
  ["usd-coin", "USDC", "USD Coin"],
  ["dogecoin", "DOGE", "Dogecoin"],
  ["cardano", "ADA", "Cardano"],
  ["tron", "TRX", "TRON"],
  ["avalanche-2", "AVAX", "Avalanche"],
  ["chainlink", "LINK", "Chainlink"],
  ["polkadot", "DOT", "Polkadot"],
  ["litecoin", "LTC", "Litecoin"],
  ["shiba-inu", "SHIB", "Shiba Inu"],
];

export const FIATS = ["usd", "eur", "gbp"];

const byId = new Map(COINS.map(([id, symbol, name]) => [id, { symbol, name }]));

export const symbolFor = (id) => byId.get(id)?.symbol || id.toUpperCase();
