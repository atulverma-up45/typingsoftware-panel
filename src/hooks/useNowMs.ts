import { useEffect, useState } from 'react';

/** Default refresh interval for the freshness clock (1 minute). */
const NOW_REFRESH_MS = 60_000;

/**
 * A render-stable "now" timestamp for freshness display ("last seen 5m ago").
 *
 * Reading `Date.now()` directly during render is impure — the value changes
 * between renders, which breaks memoisation and React's render guarantees.
 * This hook owns that impurity: the timestamp is captured once at mount and
 * then advanced from an interval callback (never during render). Components
 * that render relative times should call this once and derive from it.
 */
export function useNowMs(refreshIntervalMs: number = NOW_REFRESH_MS): number {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const refreshTimer = setInterval(() => setNowMs(Date.now()), refreshIntervalMs);
    return () => clearInterval(refreshTimer);
  }, [refreshIntervalMs]);

  return nowMs;
}
