import { useEffect, useState } from "react";
import { MONO, useWidgetLocal } from "@daybreak/sdk";
import { symbolFor } from "./coins";
import { formatChange, formatPrice, parsePrices, priceUrl } from "./prices";

const DEFAULT_COINS = ["bitcoin", "ethereum"];

function Crypto({ id, config, refreshKey }) {
  const fiat = config.fiat || "usd";
  const coins = Array.isArray(config.coins) && config.coins.length ? config.coins : DEFAULT_COINS;
  const coinsKey = coins.join(",");
  // Cached so a rate-limited or offline refresh still shows the last prices
  // rather than a blank tile — CoinGecko's free tier is easy to exhaust.
  const [cached, setCached] = useWidgetLocal(id, "last", null);
  const [status, setStatus] = useState("loading");
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    fetch(priceUrl(coins, fiat))
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const parsed = parsePrices(data, coins, fiat);
        if (!parsed?.length) {
          setStatus("error");
          return;
        }
        setLive({ fiat, coins: parsed });
        setCached({ fiat, coins: parsed });
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
  }, [fiat, coinsKey, refreshKey]);

  const usableCache = cached && cached.fiat === fiat ? cached : null;
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
        {status === "error" ? "Prices unavailable" : "Loading…"}
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
      {data.coins.map((c) => {
        const change = formatChange(c.change);
        return (
          <div
            key={c.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
          >
            <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--dim)" }}>
              {symbolFor(c.id)}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 16, color: "var(--fg)", fontWeight: 500 }}>
                {formatPrice(c.price, data.fiat)}
              </span>
              {change ? (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: c.change >= 0 ? "var(--ok)" : "var(--danger)",
                  }}
                >
                  {change}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
      {status === "error" ? (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          Showing the last prices — refresh failed.
        </div>
      ) : null}
    </div>
  );
}

export default Crypto;
