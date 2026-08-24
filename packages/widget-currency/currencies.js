// Frankfurter's own currency set (ECB reference rates) — fixed and small
// enough to bundle rather than fetch just to populate a picker. IRR is not
// one of Frankfurter's currencies (it comes from irr.js instead) but lives
// here too so it shares one symbol/name lookup with everything else.
export const CURRENCIES = [
  ["AUD", "Australian Dollar"],
  ["BRL", "Brazilian Real"],
  ["CAD", "Canadian Dollar"],
  ["CHF", "Swiss Franc"],
  ["CNY", "Chinese Renminbi Yuan"],
  ["CZK", "Czech Koruna"],
  ["DKK", "Danish Krone"],
  ["EUR", "Euro"],
  ["GBP", "British Pound"],
  ["HKD", "Hong Kong Dollar"],
  ["HUF", "Hungarian Forint"],
  ["IDR", "Indonesian Rupiah"],
  ["ILS", "Israeli New Shekel"],
  ["INR", "Indian Rupee"],
  ["IRR", "Iranian Rial"],
  ["ISK", "Icelandic Krona"],
  ["JPY", "Japanese Yen"],
  ["KRW", "South Korean Won"],
  ["MXN", "Mexican Peso"],
  ["MYR", "Malaysian Ringgit"],
  ["NOK", "Norwegian Krone"],
  ["NZD", "New Zealand Dollar"],
  ["PHP", "Philippine Peso"],
  ["PLN", "Polish Zloty"],
  ["RON", "Romanian Leu"],
  ["SEK", "Swedish Krona"],
  ["SGD", "Singapore Dollar"],
  ["THB", "Thai Baht"],
  ["TRY", "Turkish Lira"],
  ["USD", "United States Dollar"],
  ["ZAR", "South African Rand"],
];

// Text symbols. These now sit beside the number they belong to rather than
// beside the code, which is where a currency sign goes everywhere else money is
// written. Codes with no widely-recognised symbol fall back to the code itself
// at the call site rather than listing every one here.
const SYMBOLS = {
  AUD: "$",
  BRL: "R$",
  CAD: "$",
  CHF: "Fr",
  CNY: "¥",
  CZK: "Kč",
  DKK: "kr",
  EUR: "€",
  GBP: "£",
  HKD: "$",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  INR: "₹",
  IRR: "﷼",
  ISK: "kr",
  JPY: "¥",
  KRW: "₩",
  MXN: "$",
  MYR: "RM",
  NOK: "kr",
  NZD: "$",
  PHP: "₱",
  PLN: "zł",
  RON: "lei",
  SEK: "kr",
  SGD: "$",
  THB: "฿",
  TRY: "₺",
  USD: "$",
  ZAR: "R",
};

export const symbolFor = (code) => SYMBOLS[code] || code;

// The flag for a currency, beside its code.
//
// Derived rather than tabled. ISO 4217 builds a currency code from the ISO 3166
// country code plus a letter for the unit, so the first two letters already are
// the country: USD is US, JPY is JP, SEK is SE. Every currency this widget
// offers resolves correctly that way, which the tests check one at a time --
// the day someone adds a code where it does not (XAU, XDR) a table would have
// been the safer choice, and this comment is where they will look.
//
// Known and accepted: Windows ships no flag glyphs, so Chrome there draws a
// regional-indicator pair as its two letters -- "US USD" rather than a flag and
// a code. This was tried the other way, with a chosen emoji per place, and a
// kangaroo for Australia and a teapot for Britain are not what anyone means by
// "the emoji for that currency". Flags are what the row is asking for, on the
// platforms that can draw them.
const FLAG_BASE = 0x1f1e6; // regional indicator A
const LETTER_A = 65;

// Iran is the exception, by request: the lion rather than the flag.
const OVERRIDES = { IRR: "🦁" };

export function emojiFor(code) {
  const key = String(code || "").toUpperCase();
  if (OVERRIDES[key]) return OVERRIDES[key];
  const country = key.slice(0, 2);
  if (country.length < 2) return "";
  const points = [];
  for (const ch of country) {
    const offset = ch.charCodeAt(0) - LETTER_A;
    // Anything that is not a plain A-Z pair has no flag to make.
    if (offset < 0 || offset > 25) return "";
    points.push(FLAG_BASE + offset);
  }
  return String.fromCodePoint(...points);
}
