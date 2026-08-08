import { useState } from "react";
import { originOf, requestOrigin } from "@daybreak/sdk";

function NewsSettings({ config, setConfig, toast }) {
  const source = config.source || "hn";
  const [draft, setDraft] = useState(config.feedUrl || "");

  const save = async (e) => {
    e.preventDefault();
    const url = draft.trim();
    if (!url) return;
    let origin;
    try {
      origin = originOf(url);
    } catch {
      toast("That doesn't look like a web address");
      return;
    }
    // Must run before any other await, in the same click, or Chrome drops
    // the permission prompt for lacking a user gesture.
    const granted = await requestOrigin(origin);
    if (!granted) {
      toast("Permission needed to fetch that feed");
      return;
    }
    setConfig({ source: "custom", feedUrl: url });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
        Hacker News needs nothing from you. A feed of your own needs one-time
        permission to fetch that single address — nothing else.
      </div>
      {source === "hn" ? (
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://example.com/feed.xml"
            aria-label="Feed address"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              outline: "none",
              fontSize: 13,
              color: "var(--fg)",
            }}
          />
          <button
            type="submit"
            style={{
              alignSelf: "flex-start",
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              color: "var(--fg)",
            }}
          >
            Use this feed instead
          </button>
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {config.feedUrl}
          </div>
          <button
            type="button"
            onClick={() => setConfig({ source: "hn", feedUrl: null })}
            style={{
              alignSelf: "flex-start",
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              color: "var(--fg)",
            }}
          >
            Back to Hacker News
          </button>
        </div>
      )}
    </div>
  );
}

export default NewsSettings;
