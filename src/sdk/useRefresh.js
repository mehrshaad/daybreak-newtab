import { useEffect, useState } from "react";

// Milliseconds behind each refresh-rate label offered in the widget drawer.
// "Live" is a minute, not a second: it means "as fresh as the source is worth
// polling", and every data widget here reads an API or a Chrome list.
export const RATE_MS = {
  Live: 60_000,
  "5 min": 300_000,
  "1 hr": 3_600_000,
};

// A counter that increments on an interval. Widgets take it as `refreshKey`
// and use it as an effect dependency to re-fetch.
export function useTick(ms) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ms || ms <= 0) return undefined;
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);

  return tick;
}

export function useRefresh(rate) {
  return useTick(RATE_MS[rate] ?? RATE_MS.Live);
}

// Clock-style widgets need a real second hand; align the first tick to the
// next second boundary so the displayed time never lags by up to a second.
export function useSeconds(enabled = true) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return undefined;
    let timeout;
    let interval;
    const start = () => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    };
    timeout = setTimeout(start, 1000 - (Date.now() % 1000));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [enabled]);

  return now;
}

// Minute-resolution clock, aligned to the minute boundary.
export function useMinutes() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout;
    let interval;
    const start = () => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    };
    timeout = setTimeout(start, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return now;
}
