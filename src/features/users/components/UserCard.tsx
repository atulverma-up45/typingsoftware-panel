import React from 'react';
import { CheckCircle2, Building, Smartphone, Laptop } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { UserActionsDropdown } from './UserActionsDropdown';
import type { User } from '../api/userApi';
import type { InstitutionOption } from '@/features/institutions/api/institutionApi';

interface UserCardProps {
  user: User;
  currentUserId?: string;
  isSuperAdmin: boolean;
  institutionMap: Map<string, InstitutionOption>;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onViewDetails: (user: User) => void;
  onChangeStatus: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUserId,
  isSuperAdmin,
  institutionMap,
  onEdit,
  onResetPassword,
  onViewDetails,
  onChangeStatus,
}) => {
  const isDeleted = user.deletedAt !== null;
  const isSelf = currentUserId === user.id;

  return (
    <div
      key={user.id}
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 ${
        isDeleted ? 'opacity-65 bg-gray-50/40' : ''
      }`}
    >
      {/* Card Header: Avatar, Name, Actions */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          {user.image ? (
            <div className="relative shrink-0">
              <img
                src={user.image}
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-2xs"
              />
              {user.activeSessionsCount && user.activeSessionsCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              ) : null}
            </div>
          ) : (
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-300 to-primary-400 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {user.activeSessionsCount && user.activeSessionsCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              ) : null}
            </div>
          )}

          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <span
                className="cursor-pointer hover:text-primary transition-colors truncate"
                onClick={() => onViewDetails(user)}
              >
                {user.name}
              </span>
              {user.emailVerified && (
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              )}
              {isSelf && (
                <span className="px-1.5 py-0.2 rounded bg-orange-50 text-primary text-[10px] font-bold border border-orange-200 shrink-0">
                  YOU
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Quick Action Dropdown */}
        <div className="shrink-0">
          <UserActionsDropdown
            user={user}
            onEdit={onEdit}
            onResetPassword={onResetPassword}
            onViewDetails={onViewDetails}
            onChangeStatus={onChangeStatus}
          />
        </div>
      </div>

      {/* Badges Row: Role & Status */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-50 text-xs">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            user.role === 'SUPER_ADMIN'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : user.role === 'ADMIN'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {user.role.replace('_', ' ')}
        </span>

        {isDeleted ? (
          <StatusBadge status="DELETED" size="sm" />
        ) : (
          <StatusBadge
            status={user.status}
            size="sm"
            onClick={() => onChangeStatus(user)}
          />
        )}

        {isSuperAdmin && user.institutionId && (
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 max-w-[150px] truncate ml-auto">
            <Building size={11} className="shrink-0 text-indigo-500" />
            <span className="truncate">
              {institutionMap.get(user.institutionId)?.name || user.institutionId.substring(0, 8)}
            </span>
          </span>
        )}
      </div>

      {/* Device & Location Info */}
      {user.lastLogin && (
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 bg-gray-50/50 -mx-4 -mb-4 p-2.5 rounded-b-2xl">
          <div className="flex items-center gap-1.5 truncate">
            {user.lastLogin.deviceType === 'mobile' ? (
              <Smartphone size={12} className="text-gray-400" />
            ) : (
              <Laptop size={12} className="text-gray-400" />
            )}
            <span className="truncate">{user.lastLogin.browser || 'Browser'}</span>
          </div>
          <span className="font-mono text-[10px] text-gray-400 shrink-0">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};
