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
// This file used to argue against flags on the grounds that a currency is not a
// country, which is true — the euro is the obvious case, and the dollar sign is
// shared by six of the entries above. It reads better anyway: a column of
// three-letter codes is a column of things to decode, and a flag is recognised
// before it is read. The code stays right next to it, so nothing is lost for
// the currencies where the flag is only an approximation.
//
// Derived rather than tabled. ISO 4217 builds a currency code from the ISO 3166
// country code plus a letter for the unit, so the first two letters already are
// the country — USD is US, JPY is JP, IRR is IR. Every one of the currencies
// above resolves correctly that way, which the tests check one by one, because
// the day someone adds a code where it does not (XAU, XDR) a table would have
// been the safer choice and this comment is where they will look.
const FLAG_BASE = 0x1f1e6; // regional indicator A
const LETTER_A = 65;

// Whether this machine can actually draw a flag.
//
// Windows ships no flag glyphs at all, and Chrome on Windows renders a pair of
// regional indicators as the two letters instead, so a US flag comes out as the
// text "US" and the row reads "US USD" -- the code twice, looking like a bug.
// Reported exactly that way, and Windows is the majority platform, so this is
// not an edge case to wave through.
//
// Detected by measurement rather than by sniffing the user agent: a supported
// pair ligatures into one glyph and is about as wide as a single emoji, while an
// unsupported one is two letter boxes and close to twice that. Comparing the
// pair against one of its own halves needs no reference glyph.
let flagsWork = null;

const US_FLAG = [0x1f1fa, 0x1f1f8];

export function flagsRender() {
  if (flagsWork !== null) return flagsWork;
  if (typeof document === "undefined") return false;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return false;
    ctx.font = "16px sans-serif";
    const pair = ctx.measureText(String.fromCodePoint(...US_FLAG)).width;
    const half = ctx.measureText(String.fromCodePoint(US_FLAG[0])).width;
    flagsWork = pair > 0 && half > 0 && pair < half * 1.6;
  } catch {
    flagsWork = false;
  }
  return flagsWork;
}

// Lets a test ask for either answer, and the widget nothing at all.
export function setFlagSupport(value) {
  flagsWork = value;
}

export function flagFor(code) {
  if (!flagsRender()) return "";
  const country = String(code || "").slice(0, 2).toUpperCase();
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

// The flag a code maps to, whether or not this machine can draw it. The mapping
// and "what should be shown here" are different questions, and only the second
// one depends on the platform.
export function flagGlyph(code) {
  const was = flagsWork;
  flagsWork = true;
  try {
    return flagFor(code);
  } finally {
    flagsWork = was;
  }
}
