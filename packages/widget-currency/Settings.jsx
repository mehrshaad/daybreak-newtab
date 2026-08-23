import { Button, Tooltip, requestOrigin, useTooltip } from "@daybreak/sdk";
import { CURRENCIES } from "./currencies";
import { TGJU_ORIGIN } from "./irr";

const MAX_TARGETS = 5;

function Pill({ active, disabled, children, title, ...props }) {
  const tip = useTooltip(title);
  return (
    <>
      <Button
        ref={tip.anchorRef}
        disabled={disabled}
        aria-pressed={active}
        // Nothing but the tick told you a chip was pressable; the row of them
        // read as labels. Not while it is off-limits, though: a chip that
        // lights under the pointer and then refuses the click is worse than
        // one that never lit.
        hover={disabled ? null : active ? { opacity: 0.9 } : { background: "var(--sheetHover)" }}
        style={{
          padding: "5px 10px",
          borderRadius: 999,
          fontSize: 12,
          cursor: disabled ? "default" : "pointer",
          background: active ? "var(--accent)" : "var(--panel2)",
          color: active ? "var(--onAccent)" : disabled ? "var(--faint)" : "var(--fg)",
          border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
          opacity: disabled && !active ? 0.5 : 1,
          transition: "background .15s ease, border-color .15s ease, color .15s ease",
        }}
        {...tip.anchorProps}
        {...props}
      >
        {children}
      </Button>
      <Tooltip {...tip} />
    </>
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
      return;
    }
    if (targets.length >= MAX_TARGETS) return;
    // Best-effort: tgju's own rate needs this permission, but the official
    // rate needs none at all, so IRR still turns on either way — it just
    // shows whichever source it actually got.
    if (code === "IRR") requestOrigin(TGJU_ORIGIN);
    setConfig({ targets: [...targets, code] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>Base currency</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {/* IRR is never a base — Frankfurter doesn't quote against it, so
              there is nothing to cross the other direction through. */}
          {CURRENCIES.filter(([code]) => code !== "IRR").map(([code, name]) => (
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
