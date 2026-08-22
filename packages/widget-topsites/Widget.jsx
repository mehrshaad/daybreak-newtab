import { useCallback, useEffect, useState } from "react";
import {
  hasPermission,
  IconGrid,
  iconGridSize,
  requestPermission,
} from "@daybreak/sdk";

// Chrome's own most-visited list — the tiles its default new tab page shows,
// which replacing that page otherwise silently takes away. Every Daybreak user
// loses a feature they had until this exists.
//
// chrome.topSites returns [{ url, title }] and nothing else: no counts, no
// timestamps, no history. It stays on the device and is never sent anywhere.

const hasTopSites = () => typeof chrome !== "undefined" && !!chrome.topSites;

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// A name worth showing. Chrome's titles are page titles, which for a home page
// is often the whole tagline — "GitHub: Let's build from here" — and that is
// far too long for a label under an icon. The host is what identifies the
// place, and the full title is still on the hover card.
const shortName = (site) => {
  const host = hostOf(site.url);
  const bare = host.split(".")[0];
  return bare.charAt(0).toUpperCase() + bare.slice(1);
};

function TopSites({ config, setConfig, options, refreshKey, size, columns, editing, toast }) {
  const { hideLabels, count } = options;
  const hidden = Array.isArray(config.hidden) ? config.hidden : [];
  const [granted, setGranted] = useState(null);
  const [sites, setSites] = useState([]);

  const load = useCallback(() => {
    if (!hasTopSites()) return;
    chrome.topSites.get((list) => {
      setSites(Array.isArray(list) ? list : []);
    });
  }, []);

  useEffect(() => {
    let active = true;
    hasPermission("topSites").then((ok) => {
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
    requestPermission("topSites").then((ok) => {
      setGranted(ok);
      if (ok) load();
      else toast?.("Most visited needs the topSites permission");
    });
  };

  if (!hasTopSites()) {
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
        Available in the installed extension — Chrome&apos;s most-visited list is
        not reachable from a plain page.
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
          Daybreak needs Chrome&apos;s <strong>topSites</strong> permission to
          show the places you visit most. The list stays on this device.
        </div>
        <button
          type="button"
          onClick={grant}
          style={{
            alignSelf: "flex-start",
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid var(--accentLine)",
            background: "var(--accentSoft)",
            color: "var(--accentText)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Allow
        </button>
      </div>
    );
  }

  const visible = sites.filter((s) => !hidden.includes(s.url)).slice(0, count || 10);

  if (granted && !visible.length) {
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
        {sites.length
          ? "Every site here is hidden."
          : "Chrome has nothing to show yet — browse a little and this fills in."}
      </div>
    );
  }

  const cols = Math.max(3, Math.min(size?.[0] ?? 4, columns ?? 12));
  // Height, not width: see iconGridSize.
  const iconSize = iconGridSize(size, { hideLabels });

  return (
    <IconGrid
      items={visible.map((site) => ({
        key: site.url,
        name: shortName(site),
        title: site.title || site.url,
        // The real favicon where Chrome has one, and a brand mark or monogram
        // otherwise — the same resolution quick links use.
        iconUrl: site.url,
        iconName: shortName(site),
      }))}
      cols={cols}
      iconSize={iconSize}
      gap={Math.max(4, Math.round(iconSize * 0.16))}
      showLabels={!hideLabels}
      onOpen={(item) => {
        window.location.href = item.key;
      }}
      editing={editing}
      // Removing here means "stop showing me this", not "delete history": the
      // url goes on a hide list this widget owns. Chrome's own list is never
      // written to, and nothing about the user's history is changed.
      onRemove={(item) => setConfig({ hidden: [...hidden, item.key] })}
      onRemoveByDrag={(item) => setConfig({ hidden: [...hidden, item.key] })}
      hoverCard={(item) => {
        const site = visible.find((s) => s.url === item.key);
        if (!site) return null;
        return (
          <div style={{ padding: "10px 12px", maxWidth: 240, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.3 }}>
              {site.title || shortName(site)}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--faint)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {hostOf(site.url)}
            </div>
          </div>
        );
      }}
    />
  );
}

export default TopSites;
