import { useEffect, useState } from "react";
import { MONO, useWidgetLocal } from "@daybreak/sdk";
import { symbolFor } from "./coins";
import { formatChange, formatPrice, parsePrices, priceUrl } from "./prices";
import { sparkPath } from "./spark";

const DEFAULT_COINS = ["bitcoin", "ethereum"];
const SPARK_W = 56;
const SPARK_H = 20;

function CoinLogo({ src, symbol }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        style={{
          width: 18,
          height: 18,
          flex: "none",
          display: "grid",
          placeItems: "center",
          borderRadius: 999,
          background: "var(--panel2)",
          fontFamily: MONO,
          fontSize: 8,
          color: "var(--dim)",
        }}
      >
        {symbol.slice(0, 3)}
      </span>
    );
  }
  // Remote images are fine under the extension's CSP — they aren't remote
  // code, just pixels.
  return (
    <img
      src={src}
      alt=""
      width={18}
      height={18}
      style={{ borderRadius: 999, flex: "none" }}
      onError={() => setFailed(true)}
    />
  );
}

function Sparkline({ points, up }) {
  if (!points || points.length < 2) return <span style={{ width: SPARK_W, flex: "none" }} />;
  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      style={{ flex: "none" }}
      aria-hidden="true"
    >
      <polyline
        points={sparkPath(points, SPARK_W, SPARK_H)}
        fill="none"
        stroke={up ? "var(--ok)" : "var(--danger)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoinRow({ coin, fiat, showSparkline, showChange, showLogos }) {
  const change = formatChange(coin.change);
  const sparkUp = coin.sparkline
    ? coin.sparkline[coin.sparkline.length - 1] >= coin.sparkline[0]
    : coin.change >= 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      {showLogos ? <CoinLogo src={coin.image} symbol={symbolFor(coin.id)} /> : null}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: "var(--dim)",
          flex: "none",
          width: 34,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {symbolFor(coin.id)}
      </span>
      {showSparkline ? <Sparkline points={coin.sparkline} up={sparkUp} /> : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 14,
            color: "var(--fg)",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatPrice(coin.price, fiat)}
        </span>
        {showChange && change ? (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: coin.change >= 0 ? "var(--ok)" : "var(--danger)",
            }}
          >
            {change}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Crypto({ id, options, config, refreshKey }) {
  const { showSparkline, showChange, showLogos } = options;
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
        const parsed = parsePrices(data, coins);
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
      {data.coins.map((c) => (
        <CoinRow
          key={c.id}
          coin={c}
          fiat={data.fiat}
          showSparkline={showSparkline}
          showChange={showChange}
          showLogos={showLogos}
        />
      ))}
      {status === "error" ? (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          Showing the last prices — refresh failed.
        </div>
      ) : null}
    </div>
  );
}

export default Crypto;
