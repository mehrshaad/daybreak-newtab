import { Component } from "react";

// Keeps a crash in any widget from blanking the whole new tab page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Daybreak error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "12px",
            fontFamily: "system-ui, sans-serif",
            color: "#1f2328",
            background: "#f4f6f8",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1 style={{ margin: 0 }}>Something went wrong</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Reload the tab to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#1677ff",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
