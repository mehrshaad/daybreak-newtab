import { createContext, useContext } from "react";

// Split from the provider so that file exports only a component and keeps
// react-refresh happy — the same split as SettingsContext / SettingsProvider.
export const NoticeContext = createContext(null);

// Falls back to a queue that swallows everything, so a component rendered
// outside the provider (a test, a story) still runs rather than throwing.
export function useNotices() {
  return (
    useContext(NoticeContext) || {
      notices: [],
      notify: () => null,
      dismiss: () => {},
      freeze: () => {},
    }
  );
}
