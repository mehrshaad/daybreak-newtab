import { useEffect, useRef, useState } from "react";
import { LuMessageSquare } from "react-icons/lu";
import {
  Appear,
  hasOrigin,
  LIST_BLEED,
  LIST_ROW_HIGHLIGHT,
  MONO,
  originOf,
  Popover,
  useWidgetLocal,
} from "@daybreak/sdk";
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

// How long a pointer has to rest on a story before its preview opens.
//
// A second, and deliberately much longer than a tooltip's 400ms. A tooltip
// names the thing under the cursor; this is a paragraph that covers the rows
// below it, so it has to be something you asked for by stopping rather than
// something that happens on the way past.
const PREVIEW_DELAY = 1000;

// The domain a story came from, for the preview's byline.
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// One story: a row, and the preview it opens when the pointer stays on it.
function Story({ item, showMeta, preview, thumbnails, newTab }) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  // The timer is cleared on leave *and* on unmount: a refresh replaces the
  // list while a pointer is resting on it, and a preview that opened for a row
  // that no longer exists would be anchored to nothing.
  useEffect(() => () => clearTimeout(timer.current), []);

  const enter = () => {
    setHovered(true);
    if (!preview) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), PREVIEW_DELAY);
  };
  const leave = () => {
    setHovered(false);
    clearTimeout(timer.current);
    setOpen(false);
  };

  const host = hostOf(item.url);
  const picture = thumbnails && item.image ? item.image : "";

  return (
    <>
      <a
        ref={ref}
        href={item.url}
        target={newTab ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={enter}
        onMouseLeave={leave}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 9,
          textDecoration: "none",
          color: "inherit",
          // A story is a link you are about to click, and nothing said so.
          // Same highlight every other list in the app uses.
          padding: `5px ${LIST_BLEED}px`,
          margin: `0 -${LIST_BLEED}px`,
          borderRadius: 8,
          background: hovered ? LIST_ROW_HIGHLIGHT : "transparent",
          transition: "background .15s ease",
        }}
      >
        {picture ? (
          <img
            src={picture}
            alt=""
            loading="lazy"
            // A publisher's image is a request to their server, so it is told
            // as little as possible about where it came from.
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: 44,
              height: 44,
              flex: "none",
              objectFit: "cover",
              borderRadius: 7,
              background: "var(--panel2)",
            }}
          />
        ) : null}
        <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
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
          {/* Appear, so the meta row eases in and out with the setting. */}
          <Appear open={!!(showMeta && (item.points != null || item.comments != null))}>
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
          </Appear>
        </span>
      </a>

      {/* Nothing is fetched to show this: the summary came with the feed. A
          story with neither a summary nor a recognisable host has nothing to
          preview, so it does not open one. */}
      <Popover
        open={open && !!(item.summary || host)}
        anchorRef={ref}
        onClose={() => setOpen(false)}
        placement="bottom-start"
        width={260}
      >
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {host ? (
            <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--faint)" }}>{host}</span>
          ) : null}
          <span style={{ fontSize: 12.5, color: "var(--fg)", lineHeight: 1.35 }}>
            {item.title}
          </span>
          {item.summary ? (
            <span style={{ fontSize: 11.5, color: "var(--dim)", lineHeight: 1.5 }}>
              {item.summary}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--faint)" }}>
              This feed gives no summary. Click to read it.
            </span>
          )}
        </div>
      </Popover>
    </>
  );
}

function News({ id, options, config, refreshKey, size }) {
  const { count, showMeta, newTab, preview, thumbnails } = options;
  const source = config.source || "hn";
  const feedUrl = config.feedUrl;
  // The count is the user's, not the tile height's. The list already scrolls,
  // so a short tile showing eight headlines is a scroll rather than a crop —
  // where guessing from height meant a tall tile silently dropped four of them
  // with nothing to say so. Height only lowers the ceiling on the default.
  const tall = (size?.[1] ?? 2) >= 3;
  const limit = Math.max(1, count ?? (tall ? 8 : 4));
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
        // Room for each row's highlight to bleed past the text column, taken
        // inside the scroller so the extra width is not scrollable. See
        // LIST_BLEED.
        padding: `0 ${LIST_BLEED}px`,
        margin: `0 -${LIST_BLEED}px`,
      }}
    >
      {data.items.slice(0, limit).map((item, i) => (
        <Story
          key={item.id ?? item.url ?? i}
          item={item}
          showMeta={showMeta}
          preview={preview}
          thumbnails={thumbnails}
          newTab={newTab}
        />
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
