import { useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query and reactively returns whether it matches.
 * Replaces hand-rolled `window.innerWidth < X` resize listeners.
 * Built on `useSyncExternalStore` — the idiomatic external-system subscription.
 *
 * @example
 * const isDesktop = useMediaQuery(MEDIA_QUERY.LG);
 */
export function useMediaQuery(query: string): boolean {
  const matches = useSyncExternalStore(
    (onStoreChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', onStoreChange);
      return () => mediaQueryList.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(query).matches,
    // SSR / pre-hydration snapshot
    () => false,
  );

  return matches;
}

/** Breakpoint helpers aligned with the layout breakpoints used across the app. */
export const MEDIA_QUERY = {
  /** Tailwind `sm` — 640px */
  SM: '(min-width: 640px)',
  /** Tailwind `md` — 768px (ResponsiveDataView table/cards switch) */
  MD: '(min-width: 768px)',
  /** Tailwind `lg` — 1024px (sidebar collapses below this) */
  LG: '(min-width: 1024px)',
} as const;

export default useMediaQuery;