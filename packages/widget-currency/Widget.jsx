import { useEffect, useState } from "react";
import { hasOrigin, MONO, useWidgetLocal } from "@daybreak/sdk";
import { symbolFor } from "./currencies";
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
  const { decimals, showSymbols } = options;
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
          fontSize: 12,
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
        1 {data.base}
      </div>
      {data.pairs.map((p) => (
        <div key={p.code} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: "var(--dim)" }}>
              {showSymbols ? `${symbolFor(p.code)} ` : ""}
              {p.code}
            </span>
            <span style={{ fontSize: 16, color: "var(--fg)", fontWeight: 500 }}>
              {formatRate(p.rate, decimals)}
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
