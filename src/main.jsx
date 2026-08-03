import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { SettingsProvider } from "./core/SettingsProvider";
import { installFavicon } from "./core/favicon";
import "./styles/base.scss";

// Before React mounts, so the tab icon is right on the first paint.
installFavicon();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>
);
