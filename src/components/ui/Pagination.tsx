import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'records',
  className = '',
}) => {
  if (totalItems <= 0) return null;

  const startRecord = Math.min((page - 1) * pageSize + 1, totalItems);
  const endRecord = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={`p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
    >
      {/* Records Count Info */}
      <div className="text-gray-500 text-center sm:text-left order-2 sm:order-1">
        Showing <span className="font-semibold text-gray-800">{startRecord}</span> to{' '}
        <span className="font-semibold text-gray-800">{endRecord}</span> of{' '}
        <span className="font-semibold text-gray-800">{totalItems}</span> {itemName}
      </div>

      {/* Controls Container */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto">
        {/* Page Size Selector (if provided) */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] sm:text-xs">
            <span className="hidden xs:inline">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 font-medium text-gray-700 focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            title="First page"
            aria-label="First page"
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-white rounded-lg border border-gray-200 transition-colors text-gray-600 shadow-2xs hidden xs:flex items-center justify-center min-w-[32px] min-h-[32px]"
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-white rounded-lg border border-gray-200 transition-colors text-gray-700 font-medium flex items-center gap-1 shadow-2xs min-h-[34px]"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="px-2.5 py-1 text-gray-700 font-medium bg-white rounded-lg border border-gray-200 shadow-2xs min-h-[34px] flex items-center justify-center">
            <span>{page}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-500">{totalPages || 1}</span>
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-white rounded-lg border border-gray-200 transition-colors text-gray-700 font-medium flex items-center gap-1 shadow-2xs min-h-[34px]"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={15} />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            title="Last page"
            aria-label="Last page"
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-white rounded-lg border border-gray-200 transition-colors text-gray-600 shadow-2xs hidden xs:flex items-center justify-center min-w-[32px] min-h-[32px]"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

