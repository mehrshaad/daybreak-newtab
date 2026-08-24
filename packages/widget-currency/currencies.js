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

// An emoji for each currency, beside its code.
//
// Flags were the obvious choice and the wrong one. Windows ships no flag glyphs
// at all, so Chrome there paints a pair of regional indicators as the two
// letters instead: a US flag came out as the text "US" and the row read
// "US USD" -- the code twice, looking like a bug. That is the majority platform.
//
// Ordinary emoji render everywhere, so each currency gets one thing associated
// with the place instead. Not a code, not a letterform and not a flag: a lion
// for Iran, a maple leaf for Canada, Liberty for the dollar. It is more use
// than a flag was, too, because it does not need reading -- the point of a mark
// beside the code is that it is recognised before the code is.
//
// A table rather than anything derived. No rule produces a kangaroo from "AUD",
// and each of these is a judgement about what a place is known for, which is
// the kind of thing that should be written where it can be argued with.
//
// One rule inside it: nothing appears twice. India's elephant is why Thailand
// gets a tuk-tuk, and Iran having the lion is why Singapore -- the Lion City --
// gets its skyline instead. A repeated emoji is worse than none, since two rows
// would carry the same mark.
const EMOJI = {
  AUD: "🦘", // kangaroo
  BRL: "🦜", // macaw
  CAD: "🍁", // maple leaf
  CHF: "🏔️", // snow-capped mountain
  CNY: "🐼", // panda
  CZK: "🏰", // castle
  DKK: "🧱", // brick
  EUR: "🏛️", // classical building
  GBP: "🫖", // teapot
  HKD: "🏙️", // cityscape
  HUF: "🌶️", // hot pepper
  IDR: "🦎", // lizard
  ILS: "🕎", // menorah
  INR: "🐘", // elephant
  IRR: "🦁", // lion
  ISK: "🌋", // volcano
  JPY: "🗻", // mount fuji
  KRW: "🐯", // tiger face
  MXN: "🌮", // taco
  MYR: "🌺", // hibiscus
  NOK: "⛷️", // skier
  NZD: "🥝", // kiwi fruit
  PHP: "🏝️", // desert island
  PLN: "🥟", // dumpling
  RON: "🧛", // vampire
  SEK: "🦌", // deer
  SGD: "🌇", // sunset over buildings
  THB: "🛺", // auto rickshaw
  TRY: "🧿", // nazar amulet
  USD: "🗽", // statue of liberty
  ZAR: "🦓", // zebra
};

export const emojiFor = (code) => EMOJI[String(code || "").toUpperCase()] || "";
