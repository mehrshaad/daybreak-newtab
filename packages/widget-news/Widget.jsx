import { useEffect, useState } from "react";
import { LuMessageSquare } from "react-icons/lu";
import { hasOrigin, MONO, originOf, useWidgetLocal } from "@daybreak/sdk";
import { parseFeed } from "./feed";
import { HN_TOP_STORIES, hnItemUrl, parseHnItem } from "./hn";

const LIMIT = 10;

async function loadHackerNews() {
  const ids = await fetch(HN_TOP_STORIES).then((r) => r.json());
  const items = await Promise.all(
    (ids || []).slice(0, LIMIT).map((id) => fetch(hnItemUrl(id)).then((r) => r.json()))
  );
  return items.map(parseHnItem).filter(Boolean);
}

async function loadCustomFeed(feedUrl) {
  const granted = await hasOrigin(originOf(feedUrl));
  if (!granted) return { status: "nopermission" };
  const xml = await fetch(feedUrl).then((r) => r.text());
  const items = parseFeed(xml).slice(0, LIMIT);
  if (!items.length) return { status: "blocked" };
  return { status: "ok", items };
}

function News({ id, config, refreshKey, size }) {
  const source = config.source || "hn";
  const feedUrl = config.feedUrl;
  const tall = (size?.[1] ?? 2) >= 3;
  const limit = tall ? 8 : 4;
  // Cache the last good list so a refresh (or being offline) shows the
  // previous headlines instead of a spinner.
  const [cached, setCached] = useWidgetLocal(id, "last", null);
  const [status, setStatus] = useState("loading");
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    const run = async () => {
      try {
        if (source === "custom") {
          if (!feedUrl) {
            if (active) setStatus("nofeed");
            return;
          }
          const result = await loadCustomFeed(feedUrl);
          if (!active) return;
          if (result.status !== "ok") {
            setStatus(result.status);
            return;
          }
          setLive({ source, items: result.items });
          setCached({ source, items: result.items });
          setStatus("ok");
          return;
        }
        const items = await loadHackerNews();
        if (!active) return;
        if (!items.length) {
          setStatus("error");
          return;
        }
        setLive({ source, items });
        setCached({ source, items });
        setStatus("ok");
      } catch {
        if (active) setStatus(source === "custom" ? "blocked" : "error");
      }
    };
    run();

    return () => {
      active = false;
    };
    // setCached is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, feedUrl, refreshKey]);

  const usableCache = cached && cached.source === source ? cached : null;
  const data = live || usableCache;

  if (!data) {
    const message =
      {
        nofeed: "No feed configured yet.",
        nopermission: "This feed needs permission — open settings to grant it.",
        blocked: "This feed does not allow browser access.",
        error: "News unavailable",
      }[status] || "Loading…";
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          color: "var(--faint)",
          textAlign: "center",
          padding: "0 10px",
        }}
      >
        {message}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {data.items.slice(0, limit).map((item, i) => (
        <a
          key={item.id ?? item.url ?? i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--fg)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.title}
          </span>
          {item.points != null || item.comments != null ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: MONO,
                fontSize: 10,
                color: "var(--faint)",
              }}
            >
              {item.points != null ? <span>{item.points} pts</span> : null}
              {item.comments != null ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <LuMessageSquare size={10} />
                  {item.comments}
                </span>
              ) : null}
            </span>
          ) : null}
        </a>
      ))}
      {status === "error" || status === "blocked" ? (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          {status === "blocked"
            ? "This feed does not allow browser access — showing the last headlines."
            : "Showing the last headlines — refresh failed."}
        </div>
      ) : null}
    </div>
  );
}

export default News;
