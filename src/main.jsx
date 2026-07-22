import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { SettingsProvider } from "./context/SettingsContext";
import AntdConfig from "./context/AntdConfig";
import "./styles/utils/variables.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <SettingsProvider>
    <AntdConfig>
      <App />
    </AntdConfig>
  </SettingsProvider>
);
