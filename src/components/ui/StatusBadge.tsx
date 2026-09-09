import React from 'react';

export type StatusType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'BANNED'
  | 'REVOKED'
  | 'DELETED'
  | 'PENDING'
  | 'EXPIRED'
  | 'ONLINE'
  | 'OFFLINE'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  onClick,
  title,
  className = '',
}) => {
  const normalized = (status || '').toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'ACTIVE':
      case 'ONLINE':
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
          pulse: true,
        };
      case 'SUSPENDED':
      case 'PENDING':
      case 'WARNING':
      case 'EXPIRING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500',
          pulse: false,
        };
      case 'REVOKED':
      case 'BANNED':
      case 'DELETED':
      case 'DANGER':
      case 'ERROR':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500',
          pulse: false,
        };
      case 'INACTIVE':
      case 'OFFLINE':
      case 'DISABLED':
        return {
          bg: 'bg-gray-100 text-gray-600 border-gray-200/80',
          dot: 'bg-gray-400',
          pulse: false,
        };
      case 'SUPER_ADMIN':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dot: 'bg-purple-500',
          pulse: false,
        };
      case 'ADMIN':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dot: 'bg-blue-500',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-gray-50 text-gray-700 border-gray-200/80',
          dot: 'bg-gray-400',
          pulse: false,
        };
    }
  };

  const style = getStyle();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2 font-medium',
  }[size];

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full font-semibold border transition-all select-none ${
        style.bg
      } ${sizeClasses} ${
        onClick
          ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-2xs hover:shadow-xs'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {style.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
        </span>
      )}
      <span>{(status ?? '').replace(/_/g, ' ')}</span>
    </span>
  );
};

export default StatusBadge;

