import { useEffect, useMemo, useState } from "react";
import { nextSunSwitch, sunLocation, sunTheme } from "./sunTheme";

// The sunrise theme, kept current.
//
// Scheduled rather than polled: there are two moments a day when this changes
// and a timer set to the next one costs nothing, where a minute tick would run
// 1440 times to find two. Returns null where there is no answer (a polar
// summer, or an unparseable place), which the caller resolves as it would
// "system".
export function useSunTheme(enabled, widgets) {
  // Recomputed only when the widget a city could come from changes, not on
  // every widget render.
  const place = useMemo(
    () => (enabled ? sunLocation(widgets) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, widgets?.weather?.config?.city, widgets?.sun?.config?.city,
     widgets?.air?.config?.city, widgets?.prayer?.config?.city]
  );

  const [theme, setTheme] = useState(() => (place ? sunTheme(new Date(), place) : null));

  useEffect(() => {
    if (!place) {
      setTheme(null);
      return undefined;
    }

    let timer = null;
    const settle = () => {
      const now = new Date();
      setTheme(sunTheme(now, place));
      const next = nextSunSwitch(now, place);
      clearTimeout(timer);
      // A one-second cushion past the mark, so the recomputation lands on the
      // other side of it rather than exactly on it and reads the same answer.
      // Capped at six hours: setTimeout is only accurate to about 25 days, and
      // a suspended laptop's timer does not fire at all — the visibility
      // listener below is what actually covers a lid closed overnight, and a
      // ceiling keeps the timer honest in between.
      const delay = next ? Math.min(next - now + 1000, 6 * 3600 * 1000) : 3600 * 1000;
      timer = setTimeout(settle, Math.max(1000, delay));
    };
    settle();

    // A backgrounded tab throttles timers to once a minute and a sleeping
    // machine runs none at all, so the tab that has been open since yesterday
    // morning would still be light. Coming back to the tab is the moment it
    // matters, and it is free to check.
    const onVisible = () => {
      if (document.visibilityState === "visible") settle();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [place]);

  return theme;
}
