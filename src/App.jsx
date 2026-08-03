import { useMemo } from "react";
import { useSettings } from "./core/settingsContext";
import { background, tokens } from "./core/tokens";

function App() {
  const { settings } = useSettings();
  const { theme, accent, wall } = settings.appearance;

  const rootStyle = useMemo(
    () => ({
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "var(--fg)",
      background: background(theme, accent, wall),
      backgroundAttachment: "fixed",
      WebkitFontSmoothing: "antialiased",
      ...tokens(theme, accent),
    }),
    [theme, accent, wall]
  );

  return (
    <div style={rootStyle}>
      <div style={{ padding: 28 }}>
        <span className="db-label">Daybreak v2</span>
      </div>
    </div>
  );
}

export default App;
