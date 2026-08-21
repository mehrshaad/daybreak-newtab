import { CitySearch, MONO } from "@daybreak/sdk";
import { METHODS, PRAYER_LABELS, PRAYERS } from "./prayers";

// Place and per-prayer adjustments. The method and Asr reckoning are plain
// options in the manifest, so they appear in the drawer's own Options section
// alongside every other widget's — only the things a list of pills cannot
// express live here.
function PrayerSettings({ config, setConfig, options }) {
  const city = config.city;
  const adjustments = config.adjustments || {};
  const method = METHODS[options.method] || METHODS.tehran;

  const setAdjustment = (name, minutes) =>
    setConfig({ adjustments: { ...adjustments, [name]: minutes } });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 13, marginBottom: 6 }}>City</div>
        {city ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
              fontSize: 12,
              color: "var(--dim)",
            }}
          >
            <span>{city.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
              {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
            </span>
          </div>
        ) : null}
        <CitySearch
          onPick={(picked) => setConfig({ city: picked })}
          placeholder={city ? "Change city…" : "Search for a city…"}
        />
      </div>

      <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.6 }}>
        Using <strong style={{ color: "var(--dim)" }}>{method.label}</strong>. The
        conventions genuinely disagree — Fajr can differ by twenty minutes between
        them — so if these do not match the times your own mosque keeps, change
        the method above before adjusting anything below.
      </div>

      <div>
        <div style={{ fontSize: 13, marginBottom: 2 }}>Adjustments</div>
        <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 8 }}>
          Minutes added to each time, for matching a local timetable exactly.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PRAYERS.map((name) => {
            const value = Number(adjustments[name]) || 0;
            return (
              <div
                key={name}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
              >
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{PRAYER_LABELS[name]}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                  <button
                    type="button"
                    aria-label={`${PRAYER_LABELS[name]} one minute earlier`}
                    onClick={() => setAdjustment(name, value - 1)}
                    style={STEP}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      minWidth: 34,
                      textAlign: "center",
                      color: value ? "var(--fg)" : "var(--faint)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {value > 0 ? `+${value}` : value}
                  </span>
                  <button
                    type="button"
                    aria-label={`${PRAYER_LABELS[name]} one minute later`}
                    onClick={() => setAdjustment(name, value + 1)}
                    style={STEP}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const STEP = {
  width: 24,
  height: 24,
  display: "grid",
  placeItems: "center",
  padding: 0,
  borderRadius: 7,
  cursor: "pointer",
  background: "transparent",
  border: "1px solid var(--line)",
  color: "var(--fg)",
  fontSize: 13,
  lineHeight: 1,
};

export default PrayerSettings;
