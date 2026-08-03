import { Component } from "react";

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
    // Surfaced in the extension's page console; nothing is sent anywhere.
    console.error("Daybreak error:", error, info?.componentStack);
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
            <div style={{ marginBottom: 8 }}>{this.props.label || "Widget"} failed</div>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                fontSize: 11,
                cursor: "pointer",
                background: "var(--panel2)",
                border: "1px solid var(--line)",
                color: "var(--fg)",
              }}
            >
              Retry
            </button>
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
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>
            Daybreak hit an error
          </h1>
          <p style={{ fontSize: 14, color: "#9aa0ab", lineHeight: 1.6 }}>
            Reloading the tab usually fixes it. If it keeps happening, open
            settings and reset the layout.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
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
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
