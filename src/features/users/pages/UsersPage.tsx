import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserX,
  UserCheck,
  Search,
  Plus,
  Building,
  CheckCircle2,
  RefreshCw,
  X,
  Laptop,
  Smartphone,
  Trash2,
  Download,
  AlertCircle,
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
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-gray-800 tracking-tight">
              User Directory
            </h1>
            {!isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#ff8a5c] border border-orange-200 flex items-center gap-1.5">
                <Building size={13} />
                Institute Scoped
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-500 mt-1">
            {isSuperAdmin
              ? 'Multi-tenant administration. Manage platform staff, institute administrators, and account credentials.'
              : `Managing team members and instructors assigned to your institution.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            title="Export user directory as CSV"
            className="px-3 py-2.5 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl border border-gray-200 shadow-xs transition-colors font-medium text-xs flex items-center gap-1.5"
          >
            <Download size={15} className="text-gray-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRefreshAll}
            title="Refresh list"
            className="p-2.5 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 rounded-xl border border-gray-200 shadow-xs transition-colors"
          >
            <RefreshCw size={18} className={isFetchingUsers ? 'animate-spin text-[#ff8a5c]' : ''} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#ff8a5c] hover:bg-[#f77947] text-white rounded-xl shadow-sm transition-all duration-200 font-medium text-sm flex items-center gap-2"
          >
            <Plus size={18} /> Provision New User
          </button>
        </div>
      </div>

      {/* Network Error Alert Banner */}
      {isErrorUsers && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-4 text-rose-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Failed to load user directory</p>
              <p className="text-xs text-rose-600 mt-0.5">
                {(usersError as Error)?.message || 'An error occurred while connecting to the backend API.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchUsers()}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-100/50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Tenant Isolation Banner for Institute Admins */}
      {!isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100 text-[#ff8a5c]">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Multi-Tenant Scoping Active</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Displaying accounts associated with institution ID:{' '}
                <span className="font-mono text-gray-900 font-medium">
                  {currentUser?.institutionId || 'Unassigned'}
                </span>
                . Data outside your institution is completely isolated and protected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Stat Cards (Standardized StatCard Component) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value={statsData?.data?.total ?? 0}
          type="orange"
          icon={<Users size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="All directory accounts"
          onClick={() => handleTabChange('all')}
          active={activeTab === 'all' && !roleFilter && !statusFilter}
        />
        <StatCard
          title="Active Accounts"
          value={statsData?.data?.active ?? 0}
          type="blue"
          icon={<UserCheck size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Verified & active staff"
          onClick={() => handleTabChange('active')}
          active={activeTab === 'active'}
        />
        <StatCard
          title="Suspended / Banned"
          value={(statsData?.data?.suspended ?? 0) + (statsData?.data?.banned ?? 0)}
          type="coral"
          icon={<UserX size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Restricted or locked access"
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
          icon={<Shield size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Privileged accounts"
          onClick={() => {
            setRoleFilter(roleFilter === 'ADMIN' ? '' : 'ADMIN');
            setPage(1);
          }}
          active={roleFilter === 'ADMIN'}
        />
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Quick View Segment Tabs */}
        <div className="px-6 pt-4 pb-0 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              All Directory
            </button>
            <button
              onClick={() => handleTabChange('active')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'border-[#ff8a5c] text-[#ff8a5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Users
            </button>
            <button
              onClick={() => handleTabChange('suspended')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
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
                className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'trash'
                    ? 'border-[#ff8a5c] text-[#ff8a5c]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Trash2 size={13} /> Trash & Deleted
              </button>
            )}
          </div>

          <div className="pb-3 text-xs text-gray-400 font-medium">
            {totalUsers} {totalUsers === 1 ? 'user registered' : 'users registered'}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-gray-50/40">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-9 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ff8a5c] focus:ring-1 focus:ring-[#ff8a5c] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#ff8a5c] cursor-pointer"
            >
              <option value="">All Roles</option>
              {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
              <option value="ADMIN">Admin</option>
              <option value="SUPPORT">Support</option>
            </select>

            {/* Status Filter (when on All tab) */}
            {activeTab === 'all' && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#ff8a5c] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>
            )}

            {/* Institution Filter (Super Admin only) */}
            {isSuperAdmin && (
              <select
                value={institutionFilter}
                onChange={(e) => {
                  setInstitutionFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#ff8a5c] cursor-pointer max-w-[180px] truncate"
              >
                <option value="">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            )}

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#ff8a5c] cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            {/* Clear Filters CTA */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 transition-colors flex items-center gap-1.5"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* User Data Table */}
        <div className="overflow-x-auto">
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
              {isLoadingUsers ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-gray-100 rounded" />
                          <div className="w-44 h-3 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-5 bg-gray-100 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-5 bg-gray-100 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-28 h-3.5 bg-gray-100 rounded" />
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <div className="w-20 h-4 bg-gray-100 rounded" />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="w-20 h-3.5 bg-gray-100 rounded" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="w-8 h-8 bg-gray-100 rounded-full ml-auto" />
                    </td>
                  </tr>
                ))
              ) : usersList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="px-6 py-16 text-center text-gray-500"
                  >
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-3.5 rounded-2xl bg-orange-50 text-[#ff8a5c] mb-3">
                        <Users size={32} />
                      </div>
                      <p className="text-base font-bold text-gray-800">No users found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {hasActiveFilters
                          ? 'No user accounts match your active search and filter criteria.'
                          : 'No accounts have been registered under this scope yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={handleClearFilters}
                          className="mt-4 px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-colors"
                        >
                          Clear all filters
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#ff8a5c] hover:bg-[#f77947] text-xs font-medium text-white shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={15} /> Provision first user
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                usersList.map((user) => {
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
                                className="w-10 h-10 rounded-xl object-cover shadow-xs border border-gray-100"
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
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb48b] to-[#f89c6d] flex items-center justify-center text-white font-bold text-sm shadow-xs">
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
                                <span title="Email verified">
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                </span>
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            DELETED
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedUserForStatus(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-transform hover:scale-105 ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : user.status === 'SUSPENDED'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : user.status === 'BANNED'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                            title="Click to change status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : user.status === 'SUSPENDED'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                            />
                            {user.status}
                          </button>
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
                              {user.activeSessionsCount && user.activeSessionsCount > 0 ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                                  title="Online Now"
                                />
                              ) : null}
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
                                className="inline-flex items-center gap-1.5 font-medium text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 max-w-[200px] truncate"
                                title={`ID: ${user.institutionId} (${institutionMap.get(user.institutionId)!.slug})`}
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalUsers > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-800">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-gray-800">{Math.min(page * pageSize, totalUsers)}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalUsers}</span> users
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg border border-gray-200 transition-colors text-gray-700"
              >
                Previous
              </button>
              <div className="px-2 text-xs font-mono text-gray-600">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg border border-gray-200 transition-colors text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
