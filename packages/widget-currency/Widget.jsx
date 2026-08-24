import { useEffect, useState } from "react";
import { hasOrigin, MONO, useWidgetLocal } from "@daybreak/sdk";
import { emojiFor, symbolFor } from "./currencies";
import { crossToBase, ERAPI_URL, parseErApi, parseTgju, TGJU_ORIGIN, TGJU_URL } from "./irr";
import { formatRate, parseRates, ratesUrl } from "./rates";

const DEFAULT_TARGETS = ["EUR", "GBP"];

// IRR isn't a Frankfurter currency, so it needs its own fetch — tried against
// tgju first (only if the permission for it is already granted; Settings is
// what asks, synchronously from the toggle), falling back to the official
// rate on a missing permission or any fetch/parse failure. Returns null if
// both sources come up empty, same as any other unreachable rate.
async function fetchIrrPerUsd() {
  if (await hasOrigin(TGJU_ORIGIN)) {
    try {
      const tgju = await fetch(TGJU_URL).then((r) => r.json());
      const rate = parseTgju(tgju);
      if (rate) return { rate, source: "tgju" };
    } catch {
      /* falls through to the official rate below */
    }
  }
  try {
    const erApi = await fetch(ERAPI_URL).then((r) => r.json());
    const rate = parseErApi(erApi);
    if (rate) return { rate, source: "erapi" };
  } catch {
    /* both sources failed — caller falls back to the cached reading */
  }
  return null;
}

// No refresh control in the manifest (rates barely move within a day), so
// this fetches once per mount rather than keying off refreshKey.
function Currency({ id, options, config }) {
  const { decimals, showSymbols, textSize } = options;

  // Two sizes, regular being exactly what was here, matching World Clocks.
  // Everything in a row moves together: the flag, the code, the sign and the
  // figure are one line of information, and a row with only its number
  // enlarged reads as unbalanced.
  const big = textSize === "large";
  const type = {
    code: big ? 16 : 13,
    rate: big ? 20 : 16,
    sign: big ? 15 : 12,
    base: big ? 14 : 12,
  };

  // On the spans, never on a row: nothing here is FLIP-animated today, but
  // World Clocks' rows are, and the two widgets should not disagree about
  // where a transition belongs.
  const TYPE_TRANSITION = "font-size .2s cubic-bezier(.2,.8,.2,1)";
  const base = config.base || "USD";
  const targets =
    Array.isArray(config.targets) && config.targets.length ? config.targets : DEFAULT_TARGETS;
  const targetsKey = targets.join(",");
  const wantsIrr = targets.includes("IRR");
  // Cache the last good reading so a refresh (or being offline) shows the
  // previous numbers instead of a spinner — rates barely move hour to hour.
  const [cached, setCached] = useWidgetLocal(id, "last", null);
  const [status, setStatus] = useState("loading");
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    const frankfurterTargets = targets.filter((c) => c !== "IRR");
    // IRR crosses through Frankfurter's own USD rate, so that rate has to be
    // fetched even when the user didn't ask to see USD itself.
    const needsUsdCross = wantsIrr && base !== "USD" && !frankfurterTargets.includes("USD");
    if (needsUsdCross) frankfurterTargets.push("USD");

    const frankfurter = frankfurterTargets.length
      ? fetch(ratesUrl(base, frankfurterTargets))
          .then((r) => r.json())
          .then((data) => parseRates(data, frankfurterTargets))
          .catch(() => null)
      : Promise.resolve({ base, date: null, pairs: [] });

    const irr = wantsIrr ? fetchIrrPerUsd() : Promise.resolve(null);

    Promise.all([frankfurter, irr]).then(([fx, irrResult]) => {
      if (!active) return;
      if (!fx && !irrResult) {
        setStatus("error");
        return;
      }
      const rateFor = (code) => fx?.pairs.find((p) => p.code === code)?.rate ?? null;
      const usdPerBase = base === "USD" ? 1 : rateFor("USD");
      const irrRate = irrResult ? crossToBase(irrResult.rate, usdPerBase) : null;

      const pairs = targets
        .map((code) => {
          if (code === "IRR") {
            return irrRate ? { code, rate: irrRate, irrSource: irrResult.source } : null;
          }
          const rate = rateFor(code);
          return rate != null ? { code, rate } : null;
        })
        .filter(Boolean);

      if (!pairs.length) {
        setStatus("error");
        return;
      }
      const parsed = { base, date: fx?.date ?? null, pairs };
      setLive(parsed);
      setCached(parsed);
      setStatus("ok");
    });

    return () => {
      active = false;
    };
    // setCached is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, targetsKey, wantsIrr]);

  const usableCache = cached && cached.base === base ? cached : null;
  const data = live || usableCache;

  if (!data) {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: type.base,
          transition: TYPE_TRANSITION,
          color: "var(--faint)",
        }}
      >
        {status === "error" ? "Rates unavailable" : "Loading…"}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--faint)",
        }}
      >
        1 {emojiFor(data.base) ? `${emojiFor(data.base)} ` : ""}
        {data.base}
      </div>
      {data.pairs.map((p) => (
        <div key={p.code} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span
              style={{ display: "flex", alignItems: "baseline", gap: 6, color: "var(--dim)" }}
            >
              {/* Not aria-hidden: with six currencies sharing a dollar sign this
                  is often the only thing telling two rows apart, and a reader
                  that skipped it would hear the code alone. */}
              {emojiFor(p.code) ? (
                <span
                  style={{ fontSize: type.code, lineHeight: 1, transition: TYPE_TRANSITION }}
                >
                  {emojiFor(p.code)}
                </span>
              ) : null}
              <span style={{ fontSize: type.code, transition: TYPE_TRANSITION }}>
                {p.code}
              </span>
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                color: "var(--fg)",
                fontWeight: 500,
              }}
            >
              {/* The sign leads the number and is set quieter than it, the way
                  a price is written: the figure is what is being read and the
                  sign only says what it is denominated in. */}
              {showSymbols ? (
                <span
                  style={{
                    fontSize: type.sign,
                    color: "var(--dim)",
                    fontWeight: 400,
                    transition: TYPE_TRANSITION,
                  }}
                >
                  {symbolFor(p.code)}
                </span>
              ) : null}
              <span style={{ fontSize: type.rate, transition: TYPE_TRANSITION }}>
                {formatRate(p.rate, decimals)}
              </span>
            </span>
          </div>
          {p.irrSource === "erapi" ? (
            <div
              style={{
                alignSelf: "flex-end",
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "var(--faint)",
              }}
            >
              official rate
            </div>
          ) : null}
        </div>
      ))}
      {status === "error" ? (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          Showing the last rates — refresh failed.
        </div>
      ) : null}
    </div>
  );
}

export default Currency;
