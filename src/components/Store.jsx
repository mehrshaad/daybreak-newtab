import { useEffect, useMemo, useState } from "react";
import { mark, MONO, pill, primaryButton, seedFor } from "@daybreak/sdk";
import { WIDGETS, categories, getWidget, typeOf } from "../widgets/registry";
import { Pill } from "./primitives";

const TABS = ["Discover", "Installed", "Add widgets"];

function Card({ widget, installed, onOpen, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 18,
        borderRadius: 16,
        background: hovered ? "var(--panel2)" : "var(--panel)",
        border: `1px solid ${hovered ? "var(--accentLine)" : "var(--line)"}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <div style={mark(seedFor(widget.id), 34)} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {widget.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--faint)" }}>{widget.author}</div>
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.55,
          color: "var(--dim)",
          textWrap: "pretty",
          minHeight: 36,
        }}
      >
        {widget.tagline}
      </div>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
          {widget.category}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={pill(!installed, {
            padding: "5px 12px",
            fontSize: 11,
            background: installed ? "transparent" : "var(--accent)",
            color: installed ? "var(--faint)" : "var(--onAccent)",
            border: installed ? "1px solid var(--line)" : "0",
          })}
        >
          {installed ? "On board" : "Add"}
        </button>
      </div>
    </div>
  );
}

function Detail({ widget, installed, onBack, onToggle }) {
  return (
    <div>
      <Pill onClick={onBack} style={{ marginBottom: 20, fontSize: 12 }}>
        ← All widgets
      </Pill>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 320px",
          gap: 32,
          alignItems: "start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={mark(seedFor(widget.id), 56)} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.02em" }}>
                {widget.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 4 }}>
                {widget.tagline}
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.75,
              color: "var(--dim)",
              textWrap: "pretty",
              margin: "24px 0",
            }}
          >
            {widget.description}
          </p>

          <div className="db-label" style={{ marginBottom: 12 }}>
            Sizes
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {widget.sizes.map((s) => (
              <span
                key={s.join("x")}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  color: "var(--dim)",
                }}
              >
                {s.join("×")}
              </span>
            ))}
          </div>

          {widget.options.length ? (
            <>
              <div className="db-label" style={{ margin: "26px 0 12px" }}>
                Options
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {widget.options.map((o) => (
                  <div
                    key={o.key}
                    style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--dim)" }}
                  >
                    <span style={{ color: "var(--accent)" }}>—</span>
                    <span>{o.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: "var(--panel)",
            border: "1px solid var(--line)",
            position: "sticky",
            top: 0,
          }}
        >
          <button
            type="button"
            onClick={onToggle}
            style={
              installed
                ? pill(false, {
                    width: "100%",
                    padding: 12,
                    borderRadius: 999,
                    fontSize: 14,
                    color: "var(--fg)",
                  })
                : primaryButton({ width: "100%", padding: 12, fontSize: 14 })
            }
          >
            {installed ? "Remove from home" : "Add to home"}
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
            {[
              ["publisher", widget.author],
              ["category", widget.category],
              ["version", widget.version],
              ["default size", widget.defaultSize.join("×")],
              ["refresh", widget.refresh ? widget.refresh.join(" / ") : "not needed"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  fontFamily: MONO,
                  fontSize: 11,
                }}
              >
                <span style={{ color: "var(--faint)" }}>{k}</span>
                <span style={{ color: "var(--dim)", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div className="db-label" style={{ marginBottom: 10 }}>
              Access
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ...widget.permissions.chrome.map((p) => `Chrome "${p}" permission`),
                ...widget.permissions.hosts.map((h) => `Network: ${h}`),
              ].map((line) => (
                <div
                  key={line}
                  style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 12, color: "var(--dim)" }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 99,
                      background: "var(--accent)",
                      flex: "none",
                    }}
                  />
                  <span>{line}</span>
                </div>
              ))}
              {!widget.permissions.chrome.length && !widget.permissions.hosts.length ? (
                <div style={{ fontSize: 12, color: "var(--dim)" }}>
                  Runs entirely offline. No permissions, no network.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Replaces the design's "Publish" tab, which pitched a marketplace and an SDK
// that do not exist. This documents the mechanism that does.
function AddWidgets() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.02em", marginBottom: 6 }}>
        Adding your own widgets
      </div>
      <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.7, marginBottom: 24 }}>
        Every widget in this list is just a folder in the repository. The
        catalog builds itself from those folders, so adding one means dropping
        it in and rebuilding — there is no registry to edit.
      </p>

      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: "var(--codeBg)",
          border: "1px solid var(--line)",
          fontFamily: MONO,
          fontSize: 12,
          lineHeight: 1.9,
          color: "var(--dim)",
          whiteSpace: "pre",
          overflow: "auto",
        }}
      >
        {`src/widgets/my-widget/
  manifest.js     name, sizes, options, permissions
  Widget.jsx      the component

npm run build     the widget now appears here`}
      </div>

      <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.7, margin: "24px 0 0" }}>
        The full contract — every manifest field, the props a widget receives,
        and where to keep its data — is documented in{" "}
        <code style={{ fontFamily: MONO }}>src/sdk/types.md</code>.
      </p>
      <p style={{ fontSize: 13, color: "var(--faint)", lineHeight: 1.7, marginTop: 16 }}>
        Installing a widget straight from another repository, without a
        rebuild, is planned for a later release. It will use this same manifest
        shape, running the widget in a sandboxed frame — Chrome extensions may
        not execute remotely-hosted code in the extension itself.
      </p>
    </div>
  );
}

const EXIT_MS = 220;

function Store({ open = true, boardIds, onClose, onToggle, initialDetail }) {
  // Kept mounted through the exit so closing animates too.
  const [present, setPresent] = useState(open);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState("Discover");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(initialDetail || null);

  useEffect(() => {
    if (open) {
      setPresent(true);
      setClosing(false);
      return undefined;
    }
    if (!present) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      setPresent(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open, present]);

  const cats = useMemo(() => categories(), []);
  const onBoard = useMemo(
    () => new Set(boardIds.map((id) => typeOf(id))),
    [boardIds]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WIDGETS.filter((w) => {
      if (category !== "All" && w.category !== category) return false;
      if (tab === "Installed" && !onBoard.has(w.id)) return false;
      if (!q) return true;
      return `${w.name} ${w.tagline} ${w.author} ${w.category}`
        .toLowerCase()
        .includes(q);
    });
  }, [category, query, tab, onBoard]);

  const detailWidget = detail ? getWidget(detail) : null;
  const showBrowse = tab !== "Add widgets" && !detailWidget;

  if (!present) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        // The board stays faintly visible behind, but blurred well out of
        // focus so it reads as depth rather than as competing content.
        background: "var(--storeScrim)",
        backdropFilter: "var(--blur-overlay)",
        WebkitBackdropFilter: "var(--blur-overlay)",
        display: "flex",
        flexDirection: "column",
        animation: closing
          ? `db-store-out ${EXIT_MS}ms ease both`
          : "db-store-in .3s cubic-bezier(.2,.8,.2,1) both",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Widget store"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.02em" }}>
          Widgets
        </div>
        {/* Transparent: the pills already read as a group, so a filled
            container was just a slab of colour. */}
        <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 999 }}>
          {TABS.map((t) => (
            <Pill
              key={t}
              active={tab === t}
              onClick={() => {
                setTab(t);
                setDetail(null);
              }}
              style={{ padding: "7px 15px" }}
            >
              {t}
            </Pill>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 200 }}>
          {tab !== "Add widgets" ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search widgets…"
              aria-label="Search widgets"
              style={{
                width: "100%",
                maxWidth: 420,
                padding: "9px 16px",
                borderRadius: 999,
                background: "var(--panel)",
                border: "1px solid var(--line)",
                outline: "none",
                fontSize: 13,
                color: "var(--fg)",
              }}
            />
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            cursor: "pointer",
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            color: "var(--fg)",
            lineHeight: 1,
            flex: "none",
          }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {tab !== "Add widgets" ? (
          <div
            style={{
              width: 210,
              padding: "22px 16px",
              borderRight: "1px solid var(--line)",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: "none",
            }}
          >
            <div className="db-label" style={{ padding: "0 12px 10px" }}>
              Categories
            </div>
            {[{ name: "All", count: WIDGETS.length }, ...cats].map((c) => {
              const on = category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCategory(c.name);
                    setDetail(null);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    cursor: "pointer",
                    border: 0,
                    textAlign: "left",
                    background: on ? "var(--accentSoft)" : "transparent",
                    color: on ? "var(--accent)" : "var(--dim)",
                  }}
                >
                  <span>{c.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.55 }}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ flex: 1, overflow: "auto", padding: "24px 32px 40px" }}>
          {tab === "Add widgets" ? <AddWidgets /> : null}

          {detailWidget ? (
            <Detail
              widget={detailWidget}
              installed={onBoard.has(detailWidget.id)}
              onBack={() => setDetail(null)}
              onToggle={() => onToggle(detailWidget)}
            />
          ) : null}

          {showBrowse ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 18,
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {tab === "Installed"
                    ? "On your board"
                    : category === "All"
                    ? "All widgets"
                    : category}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--faint)" }}>
                  {results.length} {results.length === 1 ? "widget" : "widgets"}
                </div>
              </div>

              {results.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: 14,
                  }}
                >
                  {results.map((w) => (
                    <Card
                      key={w.id}
                      widget={w}
                      installed={onBoard.has(w.id)}
                      onOpen={() => setDetail(w.id)}
                      onToggle={() => onToggle(w)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--faint)" }}>
                  Nothing matches that.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Store;
