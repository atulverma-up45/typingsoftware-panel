import { useEffect, useState } from 'react';

/**
 * Delay (ms) used by list pages before a search term is committed to a query.
 * Keeps API traffic smooth while the admin is typing.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Delay (ms) used for slug availability checks in institution forms.
 */
export const SLUG_CHECK_DEBOUNCE_MS = 350;

/**
 * Returns a copy of `value` that only updates after `delay` ms have passed
 * without `value` changing. Standard primitive for search inputs that drive
 * server queries.
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
 * useUsers({ search: debouncedSearch });
 */
export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Runs `onCommit` during render whenever `dep` changes — React's recommended
 * "adjust state during render" pattern (no effect, no cascading render).
 * Typical use: resetting pagination when the committed search term changes.
 *
 * @example
 * useOnDepChange(debouncedSearch, () => setPage(1));
 */
export function useOnDepChange<T>(dep: T, onCommit: () => void): void {
  const [prevDep, setPrevDep] = useState<T>(dep);
  if (!Object.is(prevDep, dep)) {
    setPrevDep(dep);
    onCommit();
  }
}

export default useDebouncedValue;