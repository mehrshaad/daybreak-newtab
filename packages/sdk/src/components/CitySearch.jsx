import { useEffect, useRef, useState } from "react";
import { searchCities } from "../utils";
import Popover from "./Popover";

// Type-ahead city picker over Open-Meteo's geocoder (keyless). Shared by the
// Weather and World Clocks widgets and their settings panels — the geocoder
// also returns the IANA timezone, which is what World Clocks stores.
function CitySearch({ onPick, placeholder = "Search a city…", autoFocus = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | empty
  const timer = useRef(null);
  const seq = useRef(0);
  const wrapRef = useRef(null);

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
      ref={wrapRef}
      style={{
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
      <Popover
        open={results.length > 0}
        anchorRef={wrapRef}
        onClose={() => setResults([])}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: 210,
            overflow: "auto",
            padding: 4,
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
      </Popover>
    </div>
  );
}

export default CitySearch;
