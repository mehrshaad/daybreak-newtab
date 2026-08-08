import { useEffect, useState } from "react";
import { MONO, useWidgetLocal } from "@daybreak/sdk";
import { formatRate, parseRates, ratesUrl } from "./rates";

const DEFAULT_TARGETS = ["EUR", "GBP"];

// No refresh control in the manifest (rates barely move within a day), so
// this fetches once per mount rather than keying off refreshKey.
function Currency({ id, config }) {
  const base = config.base || "USD";
  const targets =
    Array.isArray(config.targets) && config.targets.length ? config.targets : DEFAULT_TARGETS;
  const targetsKey = targets.join(",");
  // Cache the last good reading so a refresh (or being offline) shows the
  // previous numbers instead of a spinner — rates barely move hour to hour.
  const [cached, setCached] = useWidgetLocal(id, "last", null);
  const [status, setStatus] = useState("loading");
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    fetch(ratesUrl(base, targets))
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const parsed = parseRates(data, targets);
        if (!parsed) {
          setStatus("error");
          return;
        }
        setLive(parsed);
        setCached(parsed);
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
    // setCached is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, targetsKey]);

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
        <div
          key={p.code}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
        >
          <span style={{ fontSize: 13, color: "var(--dim)" }}>{p.code}</span>
          <span style={{ fontSize: 16, color: "var(--fg)", fontWeight: 500 }}>
            {formatRate(p.rate)}
          </span>
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
