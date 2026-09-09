import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

export interface ActiveFilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface FilterToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  enableSlashShortcut?: boolean;
  filterElements?: React.ReactNode;
  activeFilterCount?: number;
  hasActiveFilters?: boolean;
  activeChips?: ActiveFilterChip[];
  onClearFilters?: () => void;
  viewMode?: 'TABLE' | 'CARDS';
  onViewModeChange?: (mode: 'TABLE' | 'CARDS') => void;
  actions?: React.ReactNode;
  totalResults?: number;
  totalLabel?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * Reusable standardized Select component for all page filters
 */
export interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  isActive?: boolean;
  variant?: 'light' | 'dark';
  containerClassName?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  icon,
  isActive,
  variant = 'light',
  containerClassName = '',
  className = '',
  children,
  value,
  ...props
}) => {
  const isCurrentlyActive =
    isActive !== undefined
      ? isActive
      : Boolean(value) && value !== 'ALL' && value !== '';

  const isDark = variant === 'dark';

  return (
    <div className={`relative w-full md:w-auto inline-block shrink-0 ${containerClassName}`}>
      {icon && (
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
            isCurrentlyActive
              ? 'text-primary'
              : isDark
              ? 'text-gray-400'
              : 'text-gray-400'
          }`}
        >
          {icon}
        </div>
      )}

      <select
        value={value}
        className={`w-full md:w-auto text-xs font-medium rounded-xl h-[38px] min-h-[38px] transition-all cursor-pointer appearance-none ${
          icon ? 'pl-9' : 'pl-3'
        } pr-8 py-1.5 focus:outline-none shadow-2xs ${
          isDark
            ? isCurrentlyActive
              ? 'bg-black/40 border-primary text-white ring-1 ring-primary/30'
              : 'bg-black/30 hover:bg-black/40 border-white/10 text-gray-200 focus:border-primary'
            : isCurrentlyActive
            ? 'bg-primary-50 border-primary text-primary-700 font-semibold ring-1 ring-primary/20'
            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20'
        } border ${className}`}
        {...props}
      >
        {children}
      </select>

      <div
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
          isCurrentlyActive
            ? 'text-primary'
            : isDark
            ? 'text-gray-400'
            : 'text-gray-400'
        }`}
      >
        <ChevronDown size={13} />
      </div>
    </div>
  );
};

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  enableSlashShortcut = true,
  filterElements,
  activeFilterCount = 0,
  hasActiveFilters,
  activeChips,
  onClearFilters,
  viewMode,
  onViewModeChange,
  actions,
  totalResults,
  totalLabel,
  variant = 'light',
  className = '',
}) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute active count from prop, boolean, or chips
  const effectiveActiveCount =
    activeFilterCount > 0
      ? activeFilterCount
      : activeChips && activeChips.length > 0
      ? activeChips.length
      : hasActiveFilters
      ? 1
      : 0;

  const isDark = variant === 'dark';

  // Keyboard shortcut '/' to focus search & 'Escape' to blur/clear
  useEffect(() => {
    if (!enableSlashShortcut || onSearchChange === undefined) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName.toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) {
        if (e.key === 'Escape' && activeElement === searchInputRef.current) {
          if (searchValue) {
            onSearchChange('');
          } else {
            searchInputRef.current?.blur();
          }
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableSlashShortcut, onSearchChange, searchValue]);

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 shadow-2xs space-y-3 transition-all ${
        isDark
          ? 'bg-black/20 border-white/10 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      } ${className}`}
    >
      {/* Primary Toolbar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input Container */}
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-0 max-w-full sm:max-w-md">
            <Search
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-gray-400' : 'text-gray-400'
              }`}
              size={15}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full rounded-xl pl-9 pr-12 py-2 text-sm sm:text-xs transition-all h-[38px] shadow-2xs focus:outline-none ${
                isDark
                  ? 'bg-black/30 hover:bg-black/40 focus:bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />

            {/* Keyboard shortcut indicator when empty, or Clear button when populated */}
            {searchValue ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Clear search (Esc)"
              >
                <X size={13} />
              </button>
            ) : (
              enableSlashShortcut && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
                  <kbd
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border select-none ${
                      isDark
                        ? 'bg-white/10 border-white/10 text-gray-400'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}
                  >
                    /
                  </kbd>
                </div>
              )
            )}
          </div>
        )}

        {/* Quick Controls & Mobile Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Mobile Filter Toggle Button (Visible only on < md screens when filters exist) */}
          {filterElements && (
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all h-[38px] ${
                isMobileFiltersOpen || effectiveActiveCount > 0
                  ? isDark
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-primary-100 border-primary text-primary'
                  : isDark
                  ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={13} />
              <span>Filters</span>
              {effectiveActiveCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {effectiveActiveCount}
                </span>
              )}
              {isMobileFiltersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Desktop Filter Elements (Rendered inline on md+ screens) */}
          {filterElements && (
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              {filterElements}
            </div>
          )}

          {/* Clear Active Filters Button (Desktop) */}
          {(hasActiveFilters || effectiveActiveCount > 0) && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors shadow-2xs h-[38px] ${
                isDark
                  ? 'text-gray-300 hover:text-primary hover:bg-white/5 border-white/10'
                  : 'text-gray-500 hover:text-primary hover:bg-orange-50/50 border-gray-200'
              }`}
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Switcher (Cards vs Table) */}
          {viewMode !== undefined && onViewModeChange !== undefined && (
            <div
              className={`flex items-center p-0.5 rounded-xl border shrink-0 h-[38px] ${
                isDark
                  ? 'bg-black/30 border-white/10'
                  : 'bg-gray-100 border-gray-200/70'
              }`}
            >
              <button
                type="button"
                onClick={() => onViewModeChange('TABLE')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'TABLE'
                    ? isDark
                      ? 'bg-white/20 text-primary shadow-2xs font-bold'
                      : 'bg-white text-primary shadow-2xs font-bold'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Dense Table View"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('CARDS')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'CARDS'
                    ? isDark
                      ? 'bg-white/20 text-primary shadow-2xs font-bold'
                      : 'bg-white text-primary shadow-2xs font-bold'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Touch Cards View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          )}

          {/* Actions slot */}
          {actions}
        </div>
      </div>

      {/* Active Filter Chips Ribbon (Instant 1-tap removal) */}
      {activeChips && activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider mr-1 ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`}
          >
            Filtered By:
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isDark
                  ? 'bg-white/10 text-gray-200 border-white/10'
                  : 'bg-primary-100 text-primary-700 border-primary/30 shadow-2xs'
              }`}
            >
              <span className={isDark ? 'text-gray-400 font-normal' : 'text-gray-500 font-normal'}>
                {chip.label}:
              </span>
              <span>{chip.value}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className={`p-0.5 rounded transition-colors ${
                  isDark
                    ? 'hover:text-red-400 hover:bg-white/10'
                    : 'hover:text-red-600 hover:bg-red-50'
                }`}
                title={`Remove ${chip.label} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className={`text-xs font-semibold transition-colors ml-1.5 underline ${
                isDark
                  ? 'text-gray-400 hover:text-primary'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Mobile Collapsible Filter Drawer (< md screens) */}
      {filterElements && isMobileFiltersOpen && (
        <div
          className={`md:hidden pt-3 border-t space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
            isDark ? 'border-white/10' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider pb-1">
            <span>Filter Parameters</span>
            {(hasActiveFilters || effectiveActiveCount > 0) && onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-primary hover:underline font-bold text-xs flex items-center gap-1"
              >
                <RotateCcw size={11} />
                <span>Reset All</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filterElements}
          </div>
        </div>
      )}

      {/* Optional Result Counters / Active Filter Context */}
      {totalResults !== undefined && (
        <div
          className={`pt-1 text-[11px] font-medium flex items-center justify-between ${
            isDark ? 'text-gray-400' : 'text-gray-400'
          }`}
        >
          <span>
            {totalLabel || 'Matching items'}:{' '}
            <strong className={isDark ? 'text-white font-semibold' : 'text-gray-700 font-semibold'}>
              {totalResults}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;

