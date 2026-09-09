import React from 'react';
import { Layers } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 sm:py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="p-3.5 sm:p-4 rounded-2xl bg-primary-100 text-primary mb-3.5 shadow-2xs border border-primary-200 flex items-center justify-center">
        {icon || <Layers size={28} />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs sm:text-[13px] text-gray-500 mt-1.5 leading-relaxed max-w-xs">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

