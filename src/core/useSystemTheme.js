import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

export const systemTheme = () =>
  typeof window !== "undefined" && window.matchMedia?.(QUERY).matches
    ? "dark"
    : "light";

// Tracks the OS/browser colour scheme and updates when the user changes it, so
// "System" keeps following rather than being sampled once at load.
export function useSystemTheme() {
  const [theme, setTheme] = useState(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return theme;
}

// The stored preference may be "system"; everything downstream wants a real
// theme, so resolve it in one place.
export function resolveTheme(preference, fromSystem) {
  return preference === "dark" || preference === "light" ? preference : fromSystem;
}
