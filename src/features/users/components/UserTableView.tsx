import React from 'react';
import { CheckCircle2, Building, Smartphone, Laptop } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { UserActionsDropdown } from './UserActionsDropdown';
import type { User } from '../api/userApi';
import type { InstitutionOption } from '@/features/institutions/api/institutionApi';

interface UserTableViewProps {
  users: User[];
  currentUserId?: string;
  isSuperAdmin: boolean;
  institutionMap: Map<string, InstitutionOption>;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onViewDetails: (user: User) => void;
  onChangeStatus: (user: User) => void;
}

export const UserTableView: React.FC<UserTableViewProps> = ({
  users,
  currentUserId,
  isSuperAdmin,
  institutionMap,
  onEdit,
  onResetPassword,
  onViewDetails,
  onChangeStatus,
}) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
          <th scope="col" className="px-6 py-3.5">User</th>
          <th scope="col" className="px-6 py-3.5">Role</th>
          <th scope="col" className="px-6 py-3.5">Status</th>
          <th scope="col" className="px-6 py-3.5">Last Active Device</th>
          {isSuperAdmin && <th scope="col" className="px-6 py-3.5">Institution</th>}
          <th scope="col" className="px-6 py-3.5">Registered</th>
          <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-sm">
        {users.map((user) => {
          const isDeleted = user.deletedAt !== null;
          const isSelf = currentUserId === user.id;

          return (
            <tr
              key={user.id}
              className={`group hover:bg-gray-50/60 transition-colors ${
                isDeleted ? 'opacity-60 bg-gray-50/30' : ''
              }`}
            >
              {/* Name & Email */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <div className="relative shrink-0">
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover shadow-2xs border border-gray-100"
                      />
                      {user.activeSessionsCount && user.activeSessionsCount > 0 ? (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                          title="Online Now"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-300 to-primary-400 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.activeSessionsCount && user.activeSessionsCount > 0 ? (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                          title="Online Now"
                        />
                      ) : null}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <span
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onViewDetails(user)}
                      >
                        {user.name}
                      </span>
                      {user.emailVerified && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                      {isSelf && (
                        <span className="px-1.5 py-0.2 rounded-md bg-orange-50 text-primary text-[10px] font-bold border border-orange-200">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>

              {/* Role Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : user.role === 'ADMIN'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {user.role.replace('_', ' ')}
                </span>
              </td>

              {/* Status Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                {isDeleted ? (
                  <StatusBadge status="DELETED" />
                ) : (
                  <StatusBadge
                    status={user.status}
                    onClick={() => onChangeStatus(user)}
                    title="Click to modify user status"
                  />
                )}
              </td>

              {/* Last Active Device */}
              <td className="px-6 py-4">
                {user.lastLogin ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
                      {user.lastLogin.deviceType === 'mobile' ? (
                        <Smartphone size={13} className="text-gray-400" />
                      ) : (
                        <Laptop size={13} className="text-gray-400" />
                      )}
                      <span>{user.lastLogin.browser || 'Web Client'}</span>
                      {user.lastLogin.os && (
                        <span className="text-gray-400 font-normal">
                          ({user.lastLogin.os})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="font-mono text-gray-500">
                        {user.lastLogin.ipAddress || '—'}
                      </span>
                      {(user.lastLogin.city || user.lastLogin.country) && (
                        <>
                          <span>•</span>
                          <span>
                            {[user.lastLogin.city, user.lastLogin.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">Never signed in</span>
                )}
              </td>

              {/* Institution (Super Admin only) */}
              {isSuperAdmin && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.institutionId ? (
                    institutionMap.get(user.institutionId) ? (
                      <span
                        className="inline-flex items-center gap-1.5 font-medium text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 max-w-[180px] truncate"
                        title={`ID: ${user.institutionId}`}
                      >
                        <Building size={12} className="shrink-0 text-indigo-500" />
                        <span className="truncate">{institutionMap.get(user.institutionId)!.name}</span>
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {user.institutionId.substring(0, 12)}...
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 italic">Global Platform</span>
                  )}
                </td>
              )}

              {/* Registered Date */}
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <UserActionsDropdown
                  user={user}
                  onEdit={onEdit}
                  onResetPassword={onResetPassword}
                  onViewDetails={onViewDetails}
                  onChangeStatus={onChangeStatus}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
