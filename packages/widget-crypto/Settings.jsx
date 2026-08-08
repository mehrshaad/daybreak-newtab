import { COINS, FIATS } from "./coins";

const MAX_COINS = 5;

function Pill({ active, disabled, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      style={{
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        cursor: disabled ? "default" : "pointer",
        background: active ? "var(--accent)" : "var(--panel2)",
        color: active ? "var(--onAccent)" : disabled ? "var(--faint)" : "var(--fg)",
        border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
        opacity: disabled && !active ? 0.5 : 1,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function CryptoSettings({ config, setConfig }) {
  const fiat = FIATS.includes(config.fiat) ? config.fiat : "usd";
  const coins = Array.isArray(config.coins) ? config.coins : ["bitcoin", "ethereum"];

  const toggleCoin = (id) => {
    if (coins.includes(id)) {
      setConfig({ coins: coins.filter((c) => c !== id) });
    } else if (coins.length < MAX_COINS) {
      setConfig({ coins: [...coins, id] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>Priced in</div>
        <div style={{ display: "flex", gap: 6 }}>
          {FIATS.map((code) => (
            <Pill key={code} active={code === fiat} onClick={() => setConfig({ fiat: code })}>
              {code.toUpperCase()}
            </Pill>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>
          Watchlist ({coins.length}/{MAX_COINS})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COINS.map(([id, symbol, name]) => (
            <Pill
              key={id}
              active={coins.includes(id)}
              disabled={!coins.includes(id) && coins.length >= MAX_COINS}
              onClick={() => toggleCoin(id)}
              title={name}
            >
              {symbol}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CryptoSettings;
