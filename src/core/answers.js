// Inline answers for the search box: a sum, a percentage or a unit conversion
// typed into the box is answered on the spot instead of being handed to a
// search engine. Pure logic — no React, no DOM — so it is directly unit
// testable and can be called from anywhere in the suggestion pipeline.
//
// The evaluator is hand written: tokenise, then precedence climbing. eval and
// new Function are both out of the question here — the string comes straight
// from whatever the user typed, and the new tab page runs with the extension's
// own privileges, so there is no version of that which is acceptable. A
// tokeniser is also the thing that keeps us honest about the "is this even a
// calculation?" question, because an unknown word simply fails to tokenise.
//
// Currency is deliberately not handled: "100 usd in eur" needs live rates,
// which means a fetch and a cache, neither of which belongs in a pure module.
// A caller that has rates can build its own row and put it ahead of these.
//
// Every path is biased towards returning null. A false positive is far worse
// than a miss, because it takes the top suggestion slot away from the search
// the user actually wanted.

// ---------------------------------------------------------------------------
// Shared number and unit shapes
// ---------------------------------------------------------------------------

// Thousands separators are only accepted in properly grouped form. "1,5" (a
// European decimal comma) must NOT quietly become 15, so it is left to fail.
const NUM = String.raw`(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)`;

// A unit token: letters, an optional degree sign, and an optional "/x" tail so
// "km/h" and "m/s" can be written the way they are pronounced.
const UNIT = "[a-z°]+(?:/[a-z]+)?";

const NUM_RE = new RegExp(`^${NUM}`);
const UNIT_RE = new RegExp(String.raw`^${UNIT}$`, "i");
const PART_RE = new RegExp(String.raw`(-?${NUM})\s*(${UNIT})`, "gi");
const NAME_RE = /^[a-z]+/i;

const toNumber = (text) => Number(String(text).replace(/,/g, ""));

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

const CONSTANTS = { pi: Math.PI, e: Math.E };

// prec/right drive the precedence-climbing loop below. "%" is modulo here;
// percentages are their own patterns further down, matched before this ever
// runs, so the two readings of "%" never compete.
const BINARY = {
  "+": { prec: 1, right: false, apply: (a, b) => a + b },
  "-": { prec: 1, right: false, apply: (a, b) => a - b },
  "*": { prec: 2, right: false, apply: (a, b) => a * b },
  "/": { prec: 2, right: false, apply: (a, b) => a / b },
  "%": { prec: 2, right: false, apply: (a, b) => a % b },
  "^": { prec: 3, right: true, apply: (a, b) => a ** b },
};

const POWER_PREC = BINARY["^"].prec;
const PARENS = new Set(["(", ")"]);
const isOperator = (type) => Object.hasOwn(BINARY, type);

// Thrown and caught inside this module only. A sentinel rather than an Error
// subclass so the catch cannot accidentally swallow a real bug.
const FAIL = Symbol("not an expression");

// Collapses the input to one canonical form: unicode operators become ASCII,
// "**" becomes "^", and a leading "=" (a spreadsheet habit) or a trailing
// "=" / "?" is dropped, because "2+2=" and "2+2?" are still sums.
export function normalise(query) {
  return String(query ?? "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/\*\*/g, "^")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^=+/, "")
    .replace(/[=?]+$/, "")
    .trim();
}

// Returns null — not a partial list — the moment anything unrecognised turns
// up. That single rule is what keeps "e2e tests" and "3 idiots" out of the
// calculator: an unknown word is the ordinary case for a search box.
export function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === " ") {
      i += 1;
      continue;
    }
    const rest = text.slice(i);
    const num = NUM_RE.exec(rest);
    if (num) {
      tokens.push({ type: "num", value: toNumber(num[0]), text: num[0] });
      i += num[0].length;
      continue;
    }
    if (ch === "π") {
      tokens.push({ type: "num", value: Math.PI, text: "π" });
      i += 1;
      continue;
    }
    const name = NAME_RE.exec(rest);
    if (name) {
      const key = name[0].toLowerCase();
      if (!Object.hasOwn(CONSTANTS, key)) return null;
      tokens.push({ type: "num", value: CONSTANTS[key], text: key === "pi" ? "π" : key });
      i += name[0].length;
      continue;
    }
    if (isOperator(ch) || PARENS.has(ch)) {
      tokens.push({ type: ch, text: ch });
      i += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

// An operator is binary only if something has already been produced for it to
// act on; otherwise it is a prefix sign. Used both by the parser's caller and
// by the "is this a calculation at all?" guard.
const isBinaryAt = (tokens, index) => {
  const prev = tokens[index - 1];
  return !!prev && (prev.type === "num" || prev.type === ")");
};

const hasBinaryOperator = (tokens) =>
  tokens.some((t, i) => isOperator(t.type) && isBinaryAt(tokens, i));

function parseExpression(state, minPrec) {
  let left = parseUnary(state);
  for (;;) {
    const token = state.tokens[state.i];
    const op = token && isOperator(token.type) ? BINARY[token.type] : null;
    if (!op || op.prec < minPrec || !isBinaryAt(state.tokens, state.i)) return left;
    state.i += 1;
    // Right-associative operators recurse at their own precedence, so
    // 2^3^2 is 2^(3^2); left-associative ones recurse one level up.
    left = op.apply(left, parseExpression(state, op.right ? op.prec : op.prec + 1));
  }
}

function parseUnary(state) {
  const token = state.tokens[state.i];
  if (!token) throw FAIL;
  if (token.type === "-" || token.type === "+") {
    state.i += 1;
    // The operand is parsed at power precedence so -2^2 is -(2^2) = -4, which
    // is what a calculator, a spreadsheet and Python all agree on.
    const value = parseExpression(state, POWER_PREC);
    return token.type === "-" ? -value : value;
  }
  return parsePrimary(state);
}

function parsePrimary(state) {
  const token = state.tokens[state.i];
  if (!token) throw FAIL;
  if (token.type === "num") {
    state.i += 1;
    return token.value;
  }
  if (token.type === "(") {
    state.i += 1;
    const value = parseExpression(state, 1);
    if (state.tokens[state.i]?.type !== ")") throw FAIL;
    state.i += 1;
    return value;
  }
  // No implicit multiplication: "2 3" and "3 idiots" are not products.
  throw FAIL;
}

function run(tokens) {
  const state = { tokens, i: 0 };
  try {
    const value = parseExpression(state, 1);
    if (state.i !== tokens.length) return null;
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    if (error !== FAIL) throw error;
    return null;
  }
}

// Parse + evaluate, keeping the tokens so the caller can echo the input back
// in canonical form.
function readExpression(text) {
  const tokens = tokenize(normalise(text));
  if (!tokens || !tokens.length) return null;
  const value = run(tokens);
  return value === null ? null : { value, tokens };
}

// Evaluates an expression, or returns null if the text is not one. Note that
// this has no "looks like a search" guard — "5" evaluates to 5 — because it is
// also used for the sub-expressions of the percentage forms. answerFor is the
// one that decides whether a string deserves an answer at all.
export function evaluate(input) {
  const read = readExpression(input);
  return read ? read.value : null;
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

function group(text) {
  const [whole, fraction] = text.split(".");
  const sign = whole.startsWith("-") ? "-" : "";
  const digits = sign ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${grouped}${fraction ? `.${fraction}` : ""}`;
}

// Returns null for anything not finite, which is how 1/0 and 0/0 stop being
// answers at all rather than showing up as "Infinity".
export function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value === 0) return "0";
  const abs = Math.abs(value);
  // Below 2^53 an integer is exact, so print it in full — "1 tb in b" reading
  // "1,000,000,000,000" is better than an exponent.
  if (Number.isInteger(value) && abs < 1e15) return group(String(value));
  // Outside this window fixed point is either unreadably long or all zeros.
  if (abs >= 1e12 || abs < 1e-6) return value.toExponential(4).replace(/\.?0+e/, "e");
  // Significant figures rather than a fixed six decimals. Six decimals is the
  // right amount of precision for 0.000123 and far too much for 33.888889,
  // which is a temperature nobody wants to six places. Six significant figures
  // reads correctly at both ends, and trimming the padding keeps 0.5 from
  // showing as 0.500000 while absorbing float dust like 0.30000000000000004.
  const digits = Math.max(0, 6 - Math.floor(Math.log10(abs)) - 1);
  return group(value.toFixed(Math.min(digits, 8)).replace(/0+$/, "").replace(/\.$/, ""));
}

const formatQuantity = (value, symbol) => {
  const text = formatNumber(value);
  return text === null ? null : `${text} ${symbol}`;
};

// The detail line: the input, echoed back with canonical spacing so the user
// can see how it was read. × and ÷ because that is what an answer row wants
// to look like; a prefix sign stays glued to its number.
const GLYPH = { "*": "×", "/": "÷" };

function renderTokens(tokens) {
  return tokens
    .map((token, i) => {
      if (!isOperator(token.type)) return token.text;
      const glyph = GLYPH[token.type] || token.type;
      return isBinaryAt(tokens, i) ? ` ${glyph} ` : glyph;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Units
//
// Each family is [symbol, factor-to-base, aliases]. One alias can belong to
// more than one family ("ms" is both a millisecond and a metre per second),
// which is resolved against the other side of the conversion rather than
// guessed.
// ---------------------------------------------------------------------------

const LENGTH = [
  ["mm", 0.001, ["mm", "millimeter", "millimeters", "millimetre", "millimetres"]],
  ["cm", 0.01, ["cm", "centimeter", "centimeters", "centimetre", "centimetres"]],
  ["m", 1, ["m", "meter", "meters", "metre", "metres"]],
  ["km", 1000, ["km", "kilometer", "kilometers", "kilometre", "kilometres"]],
  ["in", 0.0254, ["in", "inch", "inches"]],
  ["ft", 0.3048, ["ft", "foot", "feet"]],
  ["yd", 0.9144, ["yd", "yard", "yards"]],
  ["mi", 1609.344, ["mi", "mile", "miles"]],
];

const MASS = [
  ["mg", 0.001, ["mg", "milligram", "milligrams"]],
  ["g", 1, ["g", "gram", "grams"]],
  ["kg", 1000, ["kg", "kilo", "kilos", "kilogram", "kilograms"]],
  ["oz", 28.349523125, ["oz", "ounce", "ounces"]],
  ["lb", 453.59237, ["lb", "lbs", "pound", "pounds"]],
  ["st", 6350.29318, ["st", "stone", "stones"]],
];

// "b" is a byte, not a bit: in a new tab search box the number being converted
// came off a file listing. Bits are left out rather than guessed at.
const DATA = [
  ["B", 1, ["b", "byte", "bytes"]],
  ["KB", 1e3, ["kb", "kilobyte", "kilobytes"]],
  ["MB", 1e6, ["mb", "megabyte", "megabytes"]],
  ["GB", 1e9, ["gb", "gigabyte", "gigabytes"]],
  ["TB", 1e12, ["tb", "terabyte", "terabytes"]],
  ["KiB", 1024, ["kib", "kibibyte", "kibibytes"]],
  ["MiB", 1024 ** 2, ["mib", "mebibyte", "mebibytes"]],
  ["GiB", 1024 ** 3, ["gib", "gibibyte", "gibibytes"]],
];

const TIME = [
  ["ms", 0.001, ["ms", "millisecond", "milliseconds"]],
  ["s", 1, ["s", "sec", "secs", "second", "seconds"]],
  ["min", 60, ["min", "mins", "minute", "minutes"]],
  ["h", 3600, ["h", "hr", "hrs", "hour", "hours"]],
  ["d", 86400, ["d", "day", "days"]],
  ["wk", 604800, ["wk", "wks", "week", "weeks"]],
];

// Factors are written as the exact definitions (1852 m per nautical mile, an
// hour of 3600 s) rather than rounded decimals.
const SPEED = [
  ["km/h", 1000 / 3600, ["kmh", "kph", "kmph", "km/h"]],
  ["mph", 1609.344 / 3600, ["mph", "mi/h"]],
  ["m/s", 1, ["ms", "mps", "m/s"]],
  ["kn", 1852 / 3600, ["kn", "kt", "knot", "knots"]],
];

// Temperature is the one family with an offset, so it carries functions rather
// than a factor. The base is kelvin.
const TEMPERATURE = [
  {
    symbol: "°C",
    aliases: ["c", "°c", "celsius", "centigrade"],
    toBase: (v) => v + 273.15,
    fromBase: (v) => v - 273.15,
  },
  {
    symbol: "°F",
    aliases: ["f", "°f", "fahrenheit"],
    toBase: (v) => (v - 32) * (5 / 9) + 273.15,
    fromBase: (v) => (v - 273.15) * (9 / 5) + 32,
  },
  {
    symbol: "K",
    aliases: ["k", "kelvin", "kelvins"],
    toBase: (v) => v,
    fromBase: (v) => v,
  },
];

const UNITS = new Map();

function addUnit(family, entry) {
  for (const alias of entry.aliases) {
    const key = alias.toLowerCase();
    if (!UNITS.has(key)) UNITS.set(key, []);
    UNITS.get(key).push({ ...entry, family });
  }
}

for (const [family, table] of Object.entries({
  length: LENGTH,
  mass: MASS,
  data: DATA,
  time: TIME,
  speed: SPEED,
})) {
  for (const [symbol, factor, aliases] of table) addUnit(family, { symbol, factor, aliases });
}
for (const entry of TEMPERATURE) addUnit("temperature", entry);

const toBase = (entry, value) => (entry.toBase ? entry.toBase(value) : value * entry.factor);
const fromBase = (entry, value) => (entry.fromBase ? entry.fromBase(value) : value / entry.factor);

// "5ft 7in" -> [{ value: 5, unit: "ft" }, { value: 7, unit: "in" }].
// Returns null unless the whole string is nothing but number+unit pairs, so
// prose that happens to contain a unit ("how many cm", "1 day in the life")
// cannot slip through as a quantity.
export function parseQuantity(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;
  const parts = [];
  let cursor = 0;
  for (const match of trimmed.matchAll(PART_RE)) {
    if (trimmed.slice(cursor, match.index).trim()) return null;
    parts.push({ value: toNumber(match[1]), unit: match[2].toLowerCase() });
    cursor = match.index + match[0].length;
  }
  if (!parts.length || trimmed.slice(cursor).trim()) return null;
  // A sign inside a compound quantity ("5ft -7in") is a typo, not a
  // measurement, and adding the parts would silently produce nonsense.
  if (parts.length > 1 && parts.some((p) => p.value < 0)) return null;
  return parts;
}

// Picks the one family in which every part AND the target make sense, which is
// how "100 ms in s" is milliseconds while "10 ms in kmh" is metres per second.
function resolveConversion(parts, targetAlias) {
  for (const target of UNITS.get(targetAlias) || []) {
    // Two temperatures cannot be added, so a compound one is never valid.
    if (target.family === "temperature" && parts.length > 1) continue;
    const chosen = parts.map((p) =>
      (UNITS.get(p.unit) || []).find((entry) => entry.family === target.family)
    );
    if (chosen.some((entry) => !entry)) continue;
    const base = parts.reduce((sum, p, i) => sum + toBase(chosen[i], p.value), 0);
    return { target, chosen, base };
  }
  return null;
}

// Single-unit conversion, exposed for tests and for any caller that already
// knows both units. Returns null when the two are not the same kind of thing.
export function convert(value, from, to) {
  const resolved = resolveConversion(
    [{ value, unit: String(from).toLowerCase() }],
    String(to).toLowerCase()
  );
  return resolved ? fromBase(resolved.target, resolved.base) : null;
}

// ---------------------------------------------------------------------------
// The patterns
// ---------------------------------------------------------------------------

// Conversion needs an explicit separator — a bare "5 kg" is not a question.
// "in" is both a separator and a unit, so every candidate is collected and
// tried from the right: in "5ft 7in in cm" only the last "in" can be the
// separator. The word form is matched with lookarounds rather than by
// consuming the spaces around it, because a consumed space would leave the
// scan unable to see the second "in" of "12 in in mm" at all.
const SEPARATOR_RE = new RegExp(
  String.raw`(?<=\s)(?:in|to|into|as)(?=\s)|\s*(?:->|=>|→|>)\s*`,
  "gi"
);

function conversion(text) {
  const splits = [...text.matchAll(SEPARATOR_RE)].map((m) => ({
    left: text.slice(0, m.index).trim(),
    right: text.slice(m.index + m[0].length).trim(),
  }));
  for (let i = splits.length - 1; i >= 0; i -= 1) {
    const { left, right } = splits[i];
    if (!UNIT_RE.test(right)) continue;
    const parts = parseQuantity(left);
    if (!parts) continue;
    const resolved = resolveConversion(parts, right.toLowerCase());
    if (!resolved) continue;
    const value = fromBase(resolved.target, resolved.base);
    const display = formatQuantity(value, resolved.target.symbol);
    if (!display) continue;
    return {
      kind: "convert",
      value,
      display,
      detail: parts.map((p, n) => formatQuantity(p.value, resolved.chosen[n].symbol)).join(" "),
    };
  }
  return null;
}

const PERCENT_OF_RE = new RegExp(String.raw`^(-?${NUM})\s*%\s*of\s+(.+)$`, "i");
const PERCENT_DELTA_RE = new RegExp(String.raw`^(.+?)\s*([+-])\s*(${NUM})\s*%$`);

function percentOf(text) {
  const match = PERCENT_OF_RE.exec(text);
  if (!match) return null;
  const read = readExpression(match[2]);
  if (!read) return null;
  const value = (toNumber(match[1]) / 100) * read.value;
  const display = formatNumber(value);
  if (!display) return null;
  return {
    kind: "percent",
    value,
    display,
    detail: `${match[1]}% of ${renderTokens(read.tokens)}`,
  };
}

function percentDelta(text) {
  const match = PERCENT_DELTA_RE.exec(text);
  if (!match) return null;
  const read = readExpression(match[1]);
  if (!read) return null;
  const delta = read.value * (toNumber(match[3]) / 100);
  const value = match[2] === "+" ? read.value + delta : read.value - delta;
  const display = formatNumber(value);
  if (!display) return null;
  return {
    kind: "percent",
    value,
    display,
    detail: `${renderTokens(read.tokens)} ${match[2]} ${match[3]}%`,
  };
}

// Three slash-separated numbers are a date, never a division.
const DATE_LIKE = /^\d{1,4}\/\d{1,2}\/\d{1,4}$/;

// Two-number slash forms are usually a genuine division ("100/8", "22/7"), so
// they are answered — except for the handful that are overwhelmingly searches.
// Anyone who does want the division can space it out: "24 / 7".
const NOT_DIVISION = new Set(["9/11", "24/7"]);

function calculation(text) {
  if (DATE_LIKE.test(text) || NOT_DIVISION.has(text)) return null;
  const tokens = tokenize(text);
  // No binary operator means there is nothing to work out: a bare number, a
  // lone constant, "(42)". Those are searches.
  if (!tokens || !hasBinaryOperator(tokens)) return null;
  const value = run(tokens);
  if (value === null) return null;
  const display = formatNumber(value);
  if (!display) return null;
  return { kind: "calc", value, display, detail: renderTokens(tokens) };
}

// The entry point. Returns null unless the query is unambiguously a question
// with an arithmetic answer, otherwise:
//
//   { kind: "calc" | "percent" | "convert",
//     value:   the number,
//     display: the string to show as the answer,
//     detail:  the input echoed back in canonical form, for the right-hand
//              side of the row }
//
// The order below matters: percentages are matched before arithmetic so the
// "%" in "240 + 15%" is read as a percentage rather than a modulo, and
// conversion is matched before arithmetic so a "/" inside "m/s" is not read as
// a division.
export function answerFor(query) {
  const text = normalise(query);
  if (!text) return null;
  // Anything this long is prose. It also keeps the tokeniser away from
  // pathological input.
  if (text.length > 120) return null;
  return percentOf(text) || percentDelta(text) || conversion(text) || calculation(text);
}
