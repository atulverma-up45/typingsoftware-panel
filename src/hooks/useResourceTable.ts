import { useState } from 'react';
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
  useOnDepChange,
} from './useDebouncedValue';

export interface UseResourceTableOptions<TSortKey extends string> {
  defaultSortBy: TSortKey;
  defaultSortOrder?: 'asc' | 'desc';
  defaultLimit?: number;
  defaultViewMode?: 'TABLE' | 'CARDS';
  debounceMs?: number;
}

export interface ResourceTableState<TSortKey extends string> {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  debouncedSearch: string;
  sortBy: TSortKey;
  setSortBy: React.Dispatch<React.SetStateAction<TSortKey>>;
  sortOrder: 'asc' | 'desc';
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  viewMode: 'TABLE' | 'CARDS';
  setViewMode: React.Dispatch<React.SetStateAction<'TABLE' | 'CARDS'>>;
  handleSort: (column: TSortKey) => void;
  resetFilters: () => void;
}

/**
 * Standardized hook for table state management across the admin panel.
 * Handles page, limit, search debouncing, column sorting, and responsive view mode.
 */
export function useResourceTable<TSortKey extends string>(
  options: UseResourceTableOptions<TSortKey>,
): ResourceTableState<TSortKey> {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(options.defaultLimit ?? 10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(
    search,
    options.debounceMs ?? SEARCH_DEBOUNCE_MS,
  );
  const [sortBy, setSortBy] = useState<TSortKey>(options.defaultSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    options.defaultSortOrder ?? 'desc',
  );
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>(
    options.defaultViewMode ?? 'TABLE',
  );

  // Auto-reset page to 1 whenever debounced search input changes
  useOnDepChange(debouncedSearch, () => setPage(1));

  const handleSort = (column: TSortKey) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setPage(1);
    setSortBy(options.defaultSortBy);
    setSortOrder(options.defaultSortOrder ?? 'desc');
  };

  return {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    debouncedSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    handleSort,
    resetFilters,
  };
}

