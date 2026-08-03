import { useEffect, useRef, useState } from "react";
import { searchCities } from "../utils";

// Type-ahead city picker over Open-Meteo's geocoder (keyless). Shared by the
// Weather and World Clocks widgets and their settings panels — the geocoder
// also returns the IANA timezone, which is what World Clocks stores.
function CitySearch({ onPick, placeholder = "Search a city…", autoFocus = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | empty
  const timer = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus("idle");
      return undefined;
    }
    setStatus("loading");
    // Debounced so typing does not fire a request per keystroke.
    timer.current = setTimeout(async () => {
      const mine = ++seq.current;
      const found = await searchCities(q);
      // Ignore a slow response that lost the race to a newer query.
      if (mine !== seq.current) return;
      setResults(found);
      setStatus(found.length ? "idle" : "empty");
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  return (
    <div
      style={{
        // Positioning context for the floating result list below.
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <input
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          background: "var(--panel2)",
          border: "1px solid var(--line)",
          outline: "none",
          fontSize: 13,
          color: "var(--fg)",
          width: "100%",
        }}
      />
      {status === "loading" ? (
        <div style={{ fontSize: 12, color: "var(--faint)" }}>Searching…</div>
      ) : null}
      {status === "empty" ? (
        <div style={{ fontSize: 12, color: "var(--faint)" }}>No match.</div>
      ) : null}
      {results.length ? (
        <div
          // Floats above the tile instead of being squeezed inside it: a small
          // widget has no room for a result list, and the tile's own overflow
          // clip would cut it off. `data-dragging` reuses the rule in base.scss
          // that lifts that clip, so the list can extend past the tile edge.
          data-dragging="true"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: 210,
            overflow: "auto",
            padding: 4,
            borderRadius: 12,
            background: "var(--sheet)",
            border: "1px solid var(--line)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 18px 44px rgba(0,0,0,.34)",
            animation: "db-rise-in .16s ease both",
          }}
        >
          {results.map((c) => (
            <button
              key={`${c.name}-${c.latitude}-${c.longitude}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                setResults([]);
                onPick(c);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--fg)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--panel2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </span>
              <span style={{ color: "var(--faint)", fontSize: 11, flex: "none" }}>
                {[c.admin1, c.country].filter(Boolean).join(", ")}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default CitySearch;
