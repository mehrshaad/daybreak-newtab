import { Component } from "react";
import { issueUrl } from "../core/report";

// Shared by the two buttons on a failed tile, so they read as a pair.
const COMPACT_ACTION = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 11px",
  borderRadius: 999,
  fontSize: 11,
  lineHeight: 1,
  cursor: "pointer",
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  color: "var(--fg)",
};

// A crash in one widget must not blank the whole new tab. Board wraps every
// tile in one of these, and main.jsx wraps the app.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfaced in the extension's page console; nothing is sent anywhere. The
    // component stack is kept so the report link can carry it — it is usually
    // the most useful half of a React crash and the hardest for somebody to
    // fetch by hand.
    console.error("Daybreak error:", error, info?.componentStack);
    this.setState({ componentStack: info?.componentStack || "" });
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.compact) {
      return (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            height: "100%",
            padding: 12,
            textAlign: "center",
            fontSize: 12,
            color: "var(--faint)",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                color: "var(--danger)",
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 5, height: 5, borderRadius: 999, background: "var(--danger)" }}
              />
              {this.props.label || "Widget"} failed
            </div>
            {/* The message itself, not just that something went wrong. Even a
                line of it is often enough for somebody to recognise the
                problem, and it is what makes the report worth sending. */}
            {/* Wraps to the room it has rather than being cut at a fixed
                220px. A message truncated to "Cannot read properties of
                undefined (rea…" tells you nothing the heading did not; the
                part that identifies the bug is the end of it. Clamped at four
                lines so a runaway message cannot push the buttons out of a
                small tile, with the full text on hover either way. */}
            <div
              style={{
                marginBottom: 10,
                fontSize: 11,
                lineHeight: 1.45,
                color: "var(--faint)",
                maxWidth: "100%",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "anywhere",
              }}
              title={String(this.state.error?.message || "")}
            >
              {String(this.state.error?.message || "")}
            </div>
            {/* One style for both. They are two ways out of the same dead end
                and neither is the recommended one, so painting Retry as filled
                and Report as an outline made a choice on the reader's behalf
                that there is no basis for. */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => this.setState({ error: null })}
                className="db-action"
                style={{ ...COMPACT_ACTION, fontFamily: "inherit" }}
              >
                Retry
              </button>
              <a
                href={issueUrl({
                  error: this.state.error,
                  componentStack: this.state.componentStack,
                  where: this.props.label,
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="db-action"
                style={{ ...COMPACT_ACTION, textDecoration: "none" }}
              >
                Report
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          background: "#0a0b0e",
          color: "#eef0f3",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          {/* It is an error, and it should look like one. The screen was a
              heading and a paragraph in the same grey as everything else, which
              read as a polite notice — the same weight as "nothing here yet". */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(255,129,137,.12)",
              border: "1px solid rgba(255,129,137,.32)",
              color: "#ff8189",
              fontFamily: "'DM Mono', ui-monospace, monospace",
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 6, height: 6, borderRadius: 999, background: "#ff8189" }}
            />
            Error
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>
            Daybreak hit an error
          </h1>
          <p style={{ fontSize: 14, color: "#9aa0ab", lineHeight: 1.6, margin: 0 }}>
            Reloading the tab usually fixes it. If it keeps happening, open
            settings and reset the layout.
          </p>

          {/* What actually went wrong. The screen used to say none of this, so
              there was nothing to act on and nothing to tell anybody — and the
              stack, which is the part that would identify the bug, was only in
              a console nobody was going to open. */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,129,137,.06)",
              border: "1px solid rgba(255,129,137,.22)",
              // A red edge down the side, so the block reads as the error
              // itself rather than as a quotation of one.
              borderLeft: "3px solid #ff8189",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono', ui-monospace, monospace",
                fontSize: 12,
                color: "#ffd7da",
                wordBreak: "break-word",
              }}
            >
              {String(this.state.error?.message || "Unknown error")}
            </div>
            {this.state.error?.stack ? (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 12, color: "#9aa0ab", cursor: "pointer" }}>
                  Details
                </summary>
                <pre
                  style={{
                    margin: "8px 0 0",
                    maxHeight: 180,
                    overflow: "auto",
                    fontFamily: "'DM Mono', ui-monospace, monospace",
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "#9aa0ab",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.error.stack}
                  {this.state.componentStack || ""}
                </pre>
              </details>
            ) : null}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              type="button"
              className="db-action-solid"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 14,
                cursor: "pointer",
                border: 0,
                background: "#6f9bff",
                color: "#0a0b0e",
                fontWeight: 500,
              }}
            >
              Reload
            </button>
            {/* Opens a GitHub issue with the error, the stack and the version
                already filled in. Nothing from the board, the settings or any
                widget goes with it — see core/report.js. */}
            <a
              href={issueUrl({
                error: this.state.error,
                componentStack: this.state.componentStack,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="db-action-ghost"
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 14,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid rgba(255,255,255,.18)",
                color: "#eef0f3",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Report it
            </a>
          </div>
          <p style={{ fontSize: 11, color: "#6d7480", lineHeight: 1.6, marginTop: 12 }}>
            The report carries the error and your version. Nothing from your
            board or settings is included.
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
