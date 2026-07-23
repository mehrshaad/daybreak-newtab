import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import AntdConfig from "./context/AntdConfig";
import { SettingsProvider } from "./context/SettingsContext";
import "./styles/utils/variables.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <SettingsProvider>
      <AntdConfig>
        <App />
      </AntdConfig>
    </SettingsProvider>
  </ErrorBoundary>
);
