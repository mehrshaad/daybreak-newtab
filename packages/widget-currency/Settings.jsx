import { CURRENCIES } from "./currencies";

const MAX_TARGETS = 5;

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

// Base is one currency, radio-style; targets are up to five, toggled
// independently. Both draw from the same fixed Frankfurter list — a search
// box would be overkill for thirty options laid out as wrapping pills.
function CurrencySettings({ config, setConfig }) {
  const base = config.base || "USD";
  const targets = Array.isArray(config.targets) ? config.targets : ["EUR", "GBP"];

  const setBase = (code) => {
    if (code === base) return;
    setConfig({ base: code, targets: targets.filter((t) => t !== code) });
  };

  const toggleTarget = (code) => {
    if (code === base) return;
    if (targets.includes(code)) {
      setConfig({ targets: targets.filter((t) => t !== code) });
    } else if (targets.length < MAX_TARGETS) {
      setConfig({ targets: [...targets, code] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>Base currency</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CURRENCIES.map(([code, name]) => (
            <Pill key={code} active={code === base} onClick={() => setBase(code)} title={name}>
              {code}
            </Pill>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>
          Show ({targets.length}/{MAX_TARGETS})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CURRENCIES.filter(([code]) => code !== base).map(([code, name]) => (
            <Pill
              key={code}
              active={targets.includes(code)}
              disabled={!targets.includes(code) && targets.length >= MAX_TARGETS}
              onClick={() => toggleTarget(code)}
              title={name}
            >
              {code}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CurrencySettings;
