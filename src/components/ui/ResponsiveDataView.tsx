import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';
import { MEDIA_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';

export interface ResponsiveDataViewProps<T> {
  items: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  viewMode?: 'TABLE' | 'CARDS';
  onViewModeChange?: (mode: 'TABLE' | 'CARDS') => void;
  renderTable: (items: T[]) => React.ReactNode;
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
  cardGridClassName?: string;
  mobileCardClassName?: string;
  skeletonCount?: number;
  skeletonCard?: React.ReactNode;
  skeletonTable?: React.ReactNode;
}

export function ResponsiveDataView<T>({
  items,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyState,
  viewMode: controlledViewMode,
  renderTable,
  renderCard,
  keyExtractor,
  className,
  cardGridClassName = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4',
  mobileCardClassName,
  skeletonCount = 6,
  skeletonCard,
  skeletonTable,
}: ResponsiveDataViewProps<T>) {
  const [internalViewMode, setInternalViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Automatically adapt to mobile screens when the view mode is not controlled
  const isMobileViewport = !useMediaQuery(MEDIA_QUERY.MD);
  useEffect(() => {
    if (controlledViewMode !== undefined) return;
    setInternalViewMode(isMobileViewport ? 'CARDS' : 'TABLE');
  }, [controlledViewMode, isMobileViewport]);

  const effectiveViewMode = controlledViewMode ?? internalViewMode;
  const effectiveMobileCardClass =
    mobileCardClassName || cardGridClassName || 'grid grid-cols-1 gap-3.5 p-3.5 sm:p-4';

  // 1. Error State
  if (isError) {
    return (
      <div className="p-6 text-center bg-rose-50/50 border border-rose-100 rounded-2xl m-4">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={20} />
        </div>
        <h4 className="text-sm font-bold text-rose-900">Failed to load records</h4>
        <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">
          {errorMessage || 'A network error occurred while connecting to the server.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shadow-2xs inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (isLoading) {
    if (effectiveViewMode === 'CARDS') {
      return (
        <div className={cardGridClassName}>
          {Array.from({ length: skeletonCount }).map((_, i) =>
            skeletonCard ? (
              <React.Fragment key={i}>{skeletonCard}</React.Fragment>
            ) : (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 animate-pulse shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                    <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
                <div className="h-10 bg-gray-50 rounded-xl" />
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            )
          )}
        </div>
      );
    }

    // Dual-Mode Skeleton for Table View: Touch cards on mobile, Table rows on desktop
    return (
      <div className={className || ''}>
        {/* Mobile Skeleton (< md) */}
        <div className="md:hidden space-y-3 p-3.5">
          {Array.from({ length: Math.min(skeletonCount, 4) }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
              <div className="h-9 bg-gray-50 rounded-xl" />
            </div>
          ))}
        </div>

        {/* Desktop Skeleton (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          {skeletonTable || (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100/70 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (!items || items.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs my-4">
        <EmptyState
          title="No records found"
          description="There are no items matching your current criteria or filter selection."
        />
      </div>
    );
  }

  // 4. Render Table or Cards
  if (effectiveViewMode === 'CARDS') {
    return (
      <div className={cardGridClassName + ' ' + (className || '')}>
        {items.map((item, index) => (
          <React.Fragment key={keyExtractor(item)}>
            {renderCard(item, index)}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // TABLE view mode: Pure CSS responsive dual-mode
  // - Mobile screens (< md): Automatically render touch-safe cards (zero horizontal scroll!)
  // - Desktop screens (>= md): Render high-density data table
  return (
    <div className={className || ''}>
      {/* Mobile Card List (< md screens) */}
      <div className="md:hidden">
        <div className={effectiveMobileCardClass}>
          {items.map((item, index) => (
            <React.Fragment key={keyExtractor(item)}>
              {renderCard(item, index)}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Desktop High-Density Table (>= md screens) */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        {renderTable(items)}
      </div>
    </div>
  );
}

export default ResponsiveDataView;
