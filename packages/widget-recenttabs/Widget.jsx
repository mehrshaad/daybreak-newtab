import { useCallback, useEffect, useState } from "react";
import { LuExternalLink, LuLayers } from "react-icons/lu";
import { hasPermission, requestPermission } from "@daybreak/sdk";

const hasSessions = () => typeof chrome !== "undefined" && !!chrome.sessions;

function faviconHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function RecentTabs({ options, refreshKey, focused, toast }) {
  const [granted, setGranted] = useState(null); // null = checking
  const [entries, setEntries] = useState([]);

  const load = useCallback(() => {
    if (!hasSessions()) return;
    const max = focused ? 18 : 6;
    chrome.sessions.getRecentlyClosed({ maxResults: 25 }, (sessions) => {
      const out = [];
      for (const s of sessions || []) {
        if (s.tab) {
          out.push({
            key: s.tab.sessionId,
            id: s.tab.sessionId,
            title: s.tab.title || s.tab.url,
            host: faviconHost(s.tab.url),
            window: false,
          });
        } else if (s.window && options.showWindows) {
          const count = s.window.tabs?.length || 0;
          out.push({
            key: s.window.sessionId,
            id: s.window.sessionId,
            title: `${count} tab${count === 1 ? "" : "s"}`,
            host: s.window.tabs?.[0] ? faviconHost(s.window.tabs[0].url) : "",
            window: true,
          });
        }
        if (out.length >= max) break;
      }
      setEntries(out);
    });
  }, [options.showWindows, focused]);

  useEffect(() => {
    let active = true;
    hasPermission("sessions").then((ok) => {
      if (!active) return;
      setGranted(ok);
      if (ok) load();
    });
    return () => {
      active = false;
    };
  }, [load, refreshKey]);

  // Must run straight off the click: Chrome rejects a permission request that
  // is not tied to a user gesture.
  const grant = (e) => {
    e.stopPropagation();
    requestPermission("sessions").then((ok) => {
      setGranted(ok);
      if (ok) load();
      else toast?.("Recent Tabs needs the sessions permission");
    });
  };

  if (!hasSessions()) {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          fontSize: 12,
          color: "var(--faint)",
          padding: "0 8px",
        }}
      >
        Available in the installed extension — Chrome&apos;s session list is not
        reachable from a plain page.
      </div>
    );
  }

  if (granted === false) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
          Daybreak needs Chrome&apos;s <strong>sessions</strong> permission to
          list recently closed tabs. It stays on this device.
        </div>
        <button
          type="button"
          onClick={grant}
          style={{
            alignSelf: "flex-start",
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            border: 0,
            background: "var(--accent)",
            color: "var(--onAccent)",
          }}
        >
          Grant access
        </button>
      </div>
    );
  }

  if (granted === null) return <div style={{ flex: 1 }} />;

  if (!entries.length) {
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
        Nothing closed recently.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        flex: 1,
        overflow: "auto",
        minHeight: 0,
      }}
    >
      {entries.map((entry) => (
        <button
          key={entry.key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            chrome.sessions.restore(entry.id);
          }}
          title={entry.host}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
            padding: "6px 8px",
            margin: "0 -8px",
            borderRadius: 8,
            cursor: "pointer",
            border: 0,
            background: "transparent",
            color: "var(--dim)",
            textAlign: "left",
            minWidth: 0,
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
              width: 16,
              height: 16,
              borderRadius: 4,
              background: "var(--panel2)",
              flex: "none",
              display: "grid",
              placeItems: "center",
              color: "var(--faint)",
            }}
          >
            {entry.window ? <LuLayers size={10} /> : <LuExternalLink size={10} />}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {entry.title}
          </span>
        </button>
      ))}
    </div>
  );
}

export default RecentTabs;
