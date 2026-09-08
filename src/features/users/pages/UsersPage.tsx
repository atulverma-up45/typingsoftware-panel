import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserX,
  UserCheck,
  Plus,
  Building,
  CheckCircle2,
  RefreshCw,
  Laptop,
  Smartphone,
  Trash2,
  Download,
} from 'lucide-react';
import {
  useUsers,
  useUserStats,
  useInstitutionMap,
  type User,
} from '../api/userApi';
import StatCard from '@/features/dashboard/components/StatCard';
import { UserActionsDropdown } from '../components/UserActionsDropdown';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { UserDetailModal } from '../components/UserDetailModal';
import { StatusChangeModal } from '../components/StatusChangeModal';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

// Reusable Responsive UI Module Library
import PageHeader from '@/components/ui/PageHeader';
import FilterToolbar, { FilterSelect, type ActiveFilterChip } from '@/components/ui/FilterToolbar';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters & Tabs State
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'suspended' | 'trash'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Debounce search input by 300ms for smooth API usage
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<User | null>(null);

  // Fetch institutions list and lookup map for Super Admin dropdown & table resolution
  const { institutions, institutionMap } = useInstitutionMap(isSuperAdmin);

  // Derive effective status & includeDeleted from active tab and filters
  const effectiveIncludeDeleted = activeTab === 'trash';
  const effectiveStatus =
    activeTab === 'active'
      ? 'ACTIVE'
      : activeTab === 'suspended'
        ? 'SUSPENDED'
        : statusFilter || undefined;

  // Stats Query (GET /users/stats)
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useUserStats(isSuperAdmin && institutionFilter ? institutionFilter : undefined);

  // Users List Query (GET /users)
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    isError: isErrorUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers({
    page,
    limit: pageSize,
    search: debouncedSearch ? debouncedSearch.trim() : undefined,
    role: roleFilter || undefined,
    status: effectiveStatus,
    institutionId: isSuperAdmin ? institutionFilter || undefined : undefined,
    includeDeleted: effectiveIncludeDeleted,
  });

  const usersList: User[] = usersData?.data || [];
  const meta = usersData?.meta || { page: 1, limit: pageSize, total: 0 };
  const totalUsers = meta.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  const handleExportCsv = () => {
    if (!usersList.length) {
      toast.error('No user records available to export');
      return;
    }
    const headers = [
      'User ID',
      'Name',
      'Email',
      'Role',
      'Status',
      'Institution',
      'Active Sessions',
      'Last Active Device',
      'Last IP',
      'Last Location',
      'Registered At',
    ];
    const rows = usersList.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${(u.institutionId && institutionMap.get(u.institutionId)?.name) || u.institutionId || 'Global Platform'}"`,
      `"${u.activeSessionsCount || 0}"`,
      `"${u.lastLogin ? `${u.lastLogin.browser || 'Browser'} (${u.lastLogin.os || 'OS'})` : 'Never'}"`,
      `"${u.lastLogin?.ipAddress || ''}"`,
      `"${[u.lastLogin?.city, u.lastLogin?.country].filter(Boolean).join(', ')}"`,
      `"${new Date(u.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `user-directory-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('User directory exported to CSV successfully');
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchUsers();
  };

  const handleTabChange = (tab: 'all' | 'active' | 'suspended' | 'trash') => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter('');
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setInstitutionFilter('');
    setActiveTab('all');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(roleFilter) ||
    Boolean(statusFilter) ||
    Boolean(institutionFilter) ||
    activeTab !== 'all';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Top Header */}
      <PageHeader
        title="User Directory"
        subtitle={
          isSuperAdmin
            ? 'Multi-tenant administration. Manage platform staff, institute administrators, and account credentials.'
            : 'Managing team members and instructors assigned to your educational institution.'
        }
        icon={<Users size={20} />}
        badge={
          !isSuperAdmin ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#ff8a5c] border border-orange-200 flex items-center gap-1.5">
              <Building size={13} />
              Institute Scoped
            </span>
          ) : undefined
        }
        actions={
          <>
            <button
              onClick={handleExportCsv}
              title="Export user directory as CSV"
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors font-medium text-xs flex items-center gap-1.5 min-h-[38px]"
            >
              <Download size={14} className="text-gray-500" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>
            <button
              onClick={handleRefreshAll}
              title="Refresh list"
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
            >
              <RefreshCw size={16} className={isFetchingUsers ? 'animate-spin text-[#ff8a5c]' : ''} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 bg-[#ff8a5c] hover:bg-[#f77947] text-white rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1.5 min-h-[38px]"
            >
              <Plus size={16} />
              <span>Provision User</span>
            </button>
          </>
        }
      />

      {/* Tenant Isolation Notice for Institute Admins */}
      {!isSuperAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-50/50 border border-orange-200/70 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-[#ff8a5c] shrink-0">
              <Shield size={16} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Multi-Tenant Scoping Active</p>
              <p className="text-gray-600 mt-0.5">
                Displaying accounts associated with institution ID:{' '}
                <span className="font-mono text-gray-900 font-medium">
                  {currentUser?.institutionId || 'Unassigned'}
                </span>
                . External accounts are isolated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Stat Cards (Standardized StatCard Component) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          title="Total Users"
          value={statsData?.data?.total ?? 0}
          type="orange"
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          isLoading={isLoadingStats}
          subtitle="All directory accounts"
          onClick={() => handleTabChange('all')}
          active={activeTab === 'all' && !roleFilter && !statusFilter}
        />
        <StatCard
          title="Active Accounts"
          value={statsData?.data?.active ?? 0}
          type="blue"
          icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          isLoading={isLoadingStats}
          subtitle="Verified & active staff"
          onClick={() => handleTabChange('active')}
          active={activeTab === 'active'}
        />
        <StatCard
          title="Suspended / Banned"
          value={(statsData?.data?.suspended ?? 0) + (statsData?.data?.banned ?? 0)}
          type="coral"
          icon={<UserX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          isLoading={isLoadingStats}
          subtitle="Restricted or locked"
          onClick={() => handleTabChange('suspended')}
          active={activeTab === 'suspended'}
        />
        <StatCard
          title={isSuperAdmin ? 'Administrators' : 'Staff Members'}
          value={
            (statsData?.data?.admins ?? 0) +
            (isSuperAdmin ? statsData?.data?.superAdmins ?? 0 : 0)
          }
          type="cyan"
          icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          isLoading={isLoadingStats}
          subtitle="Privileged accounts"
          onClick={() => {
            setRoleFilter(roleFilter === 'ADMIN' ? '' : 'ADMIN');
            setPage(1);
          }}
          active={roleFilter === 'ADMIN'}
        />
      </div>

      {/* Main Container */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-xs overflow-hidden">
        {/* Quick View Segment Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-0 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              All Directory
            </button>
            <button
              onClick={() => handleTabChange('active')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
            </button>
            <button
              onClick={() => handleTabChange('suspended')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'suspended'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Suspended
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => handleTabChange('trash')}
                className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'trash'
                    ? 'border-[#ff8a5c] text-[#ff8a5c]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Trash2 size={13} /> Trash
              </button>
            )}
          </div>

          <div className="pb-3 text-xs text-gray-400 font-medium hidden sm:block">
            {totalUsers} {totalUsers === 1 ? 'user registered' : 'users registered'}
          </div>
        </div>

        {/* Filter Toolbar Component */}
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email... (Press / to focus)"
          hasActiveFilters={hasActiveFilters}
          activeChips={[
            ...(roleFilter
              ? [
                  {
                    id: 'role',
                    label: 'Role',
                    value: roleFilter,
                    onRemove: () => {
                      setRoleFilter('');
                      setPage(1);
                    },
                  },
                ]
              : []),
            ...(statusFilter
              ? [
                  {
                    id: 'status',
                    label: 'Status',
                    value: statusFilter,
                    onRemove: () => {
                      setStatusFilter('');
                      setPage(1);
                    },
                  },
                ]
              : []),
            ...(institutionFilter
              ? [
                  {
                    id: 'institution',
                    label: 'Institution',
                    value: institutionMap.get(institutionFilter)?.name || institutionFilter,
                    onRemove: () => {
                      setInstitutionFilter('');
                      setPage(1);
                    },
                  },
                ]
              : []),
          ]}
          onClearFilters={handleClearFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={totalUsers}
          totalLabel="Users in directory"
          filterElements={
            <>
              {/* Role Filter */}
              <FilterSelect
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                title="Filter by Role"
              >
                <option value="">All Roles</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                <option value="ADMIN">Admin</option>
                <option value="SUPPORT">Support</option>
              </FilterSelect>

              {/* Status Filter (on All tab) */}
              {activeTab === 'all' && (
                <FilterSelect
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Filter by Status"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </FilterSelect>
              )}

              {/* Institution Filter (Super Admin only) */}
              {isSuperAdmin && (
                <FilterSelect
                  value={institutionFilter}
                  onChange={(e) => {
                    setInstitutionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-[200px] truncate"
                  title="Filter by Institution"
                >
                  <option value="">All Institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </FilterSelect>
              )}
            </>
          }
        />

        {/* Responsive Data View: Desktop Table OR Mobile Cards */}
        <ResponsiveDataView<User>
          items={usersList}
          isLoading={isLoadingUsers}
          isError={isErrorUsers}
          errorMessage={(usersError as Error)?.message}
          onRetry={refetchUsers}
          viewMode={viewMode}
          keyExtractor={(u) => u.id}
          cardGridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4"
          emptyState={
            <EmptyState
              icon={<Users size={28} />}
              title="No users found"
              description={
                hasActiveFilters
                  ? 'No user accounts match your active search and filter criteria.'
                  : 'No accounts have been registered under this scope yet.'
              }
              action={
                hasActiveFilters ? (
                  <button
                    onClick={handleClearFilters}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#ff8a5c] hover:bg-[#f77947] text-xs font-medium text-white shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={15} /> Provision first user
                  </button>
                )
              }
            />
          }
          // Mobile Card Representation (Zero horizontal scrolling!)
          renderCard={(user) => {
            const isDeleted = user.deletedAt !== null;
            const isSelf = currentUser?.id === user.id;

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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb48b] to-[#f89c6d] flex items-center justify-center text-white font-bold text-sm shadow-2xs">
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
                          className="cursor-pointer hover:text-[#ff8a5c] transition-colors truncate"
                          onClick={() => setSelectedUserForDetails(user)}
                        >
                          {user.name}
                        </span>
                        {user.emailVerified && (
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        )}
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded bg-orange-50 text-[#ff8a5c] text-[10px] font-bold border border-orange-200 shrink-0">
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
                      onEdit={(u) => setSelectedUserForEdit(u)}
                      onResetPassword={(u) => setSelectedUserForPassword(u)}
                      onViewDetails={(u) => setSelectedUserForDetails(u)}
                      onChangeStatus={(u) => setSelectedUserForStatus(u)}
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
                      onClick={() => setSelectedUserForStatus(user)}
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
          }}
          // Desktop Table View (Sticky header & structured columns)
          renderTable={(items) => (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Active Device</th>
                  {isSuperAdmin && <th className="px-6 py-3.5">Institution</th>}
                  <th className="px-6 py-3.5">Registered</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((user) => {
                  const isDeleted = user.deletedAt !== null;
                  const isSelf = currentUser?.id === user.id;

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
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb48b] to-[#f89c6d] flex items-center justify-center text-white font-bold text-sm shadow-2xs">
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
                                className="cursor-pointer hover:text-[#ff8a5c] transition-colors"
                                onClick={() => setSelectedUserForDetails(user)}
                              >
                                {user.name}
                              </span>
                              {user.emailVerified && (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              )}
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded-md bg-orange-50 text-[#ff8a5c] text-[10px] font-bold border border-orange-200">
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
                            onClick={() => setSelectedUserForStatus(user)}
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
                          onEdit={(u) => setSelectedUserForEdit(u)}
                          onResetPassword={(u) => setSelectedUserForPassword(u)}
                          onViewDetails={(u) => setSelectedUserForDetails(u)}
                          onChangeStatus={(u) => setSelectedUserForStatus(u)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        />

        {/* Standardized Pagination Bar */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalUsers}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemName="users"
        />
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditUserModal
        user={selectedUserForEdit}
        isOpen={Boolean(selectedUserForEdit)}
        onClose={() => setSelectedUserForEdit(null)}
      />

      <ResetPasswordModal
        user={selectedUserForPassword}
        isOpen={Boolean(selectedUserForPassword)}
        onClose={() => setSelectedUserForPassword(null)}
      />

      <UserDetailModal
        user={selectedUserForDetails}
        isOpen={Boolean(selectedUserForDetails)}
        onClose={() => setSelectedUserForDetails(null)}
        onEdit={(u) => setSelectedUserForEdit(u)}
        onResetPassword={(u) => setSelectedUserForPassword(u)}
        onChangeStatus={(u) => setSelectedUserForStatus(u)}
      />

      <StatusChangeModal
        user={selectedUserForStatus}
        isOpen={Boolean(selectedUserForStatus)}
        onClose={() => setSelectedUserForStatus(null)}
      />
    </div>
  );
}
