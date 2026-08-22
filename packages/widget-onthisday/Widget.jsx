import { useEffect, useState } from "react";
import { MONO, useWidgetLocal } from "@daybreak/sdk";
import { onThisDayUrl, parseEvents, todayKey } from "./onthisday";

function OnThisDay({ id, options, size }) {
  const { count, showYear, newTab } = options;
  const key = todayKey();
  // One payload cached per day, so re-opening a tab later the same day never
  // fetches again.
  const [cache, setCache] = useWidgetLocal(id, "day", null);
  const [status, setStatus] = useState(cache?.key === key ? "ok" : "loading");
  // The list scrolls, so the count is the user's rather than the tile
  // height's. A short tile showing four events is a scroll; guessing from
  // height meant it showed one and threw the rest away silently.
  const tall = (size?.[1] ?? 2) >= 3;
  const limit = Math.max(1, count ?? (tall ? 4 : 1));

  useEffect(() => {
    if (cache?.key === key) {
      setStatus("ok");
      return undefined;
    }
    let active = true;
    setStatus("loading");

    fetch(onThisDayUrl())
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const events = parseEvents(data, 10);
        if (!events.length) {
          setStatus("error");
          return;
        }
        setCache({ key, events });
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
    // setCache is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const events = cache?.key === key ? cache.events : null;

  if (!events) {
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
        {status === "error" ? "Unavailable" : "Loading…"}
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
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {events.slice(0, limit).map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 8, minWidth: 0 }}>
          {showYear ? (
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--faint)", flex: "none" }}>
              {e.year}
            </span>
          ) : null}
          <span
            style={{
              fontSize: 13,
              color: "var(--fg)",
              lineHeight: 1.4,
              minWidth: 0,
            }}
          >
            {e.url ? (
              <a
                href={e.url}
                target={newTab ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(ev) => ev.stopPropagation()}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {e.text}
              </a>
            ) : (
              e.text
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default OnThisDay;
