import React from 'react';

export interface OperationBadgeProps {
  operation: string;
}

const OPERATION_BADGE_CLASSES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const DEFAULT_BADGE_CLASS = 'bg-gray-100 text-gray-700 border border-gray-200';

/**
 * Small colored badge for a sync operation kind (CREATE / UPDATE / DELETE).
 *
 * Extracted from `SyncTableView` so the table component exports only
 * components (`react-refresh/only-export-components`), and so any future
 * surface that shows an operation kind reuses the same visual language.
 */
export const OperationBadge: React.FC<OperationBadgeProps> = ({ operation }) => {
  const badgeClass = OPERATION_BADGE_CLASSES[operation] ?? DEFAULT_BADGE_CLASS;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
      {operation}
    </span>
  );
};
