import { createContext, useContext } from "react";

// The context object and its hook live apart from the provider component so
// the provider file exports only a component (keeps react-refresh happy).
export const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
