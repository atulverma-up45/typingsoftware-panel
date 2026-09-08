import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-all ${className}`}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#ff8a5c] border border-orange-200/60 shadow-2xs shrink-0">
              {icon}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-gray-800 tracking-tight leading-snug">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-[13px] text-gray-500 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-1 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

