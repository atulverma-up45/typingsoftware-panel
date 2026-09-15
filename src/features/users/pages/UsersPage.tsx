import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  useUsers,
  useUserStats,
  type User,
} from '../api/userApi';
import { useInstitutionMap } from '@/features/institutions/api/institutionApi';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { exportCsv } from '@/lib/exportCsv';

// Reusable Responsive UI Module Library
import PageHeader from '@/components/ui/PageHeader';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

// Extracted User Feature Components
import { UserStatsCards } from '../components/UserStatsCards';
import { UserCard } from '../components/UserCard';
import { UserTableView } from '../components/UserTableView';
import { UserModalsCoordinator } from '../components/UserModalsCoordinator';

export const UsersPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const { isSuperAdmin, canMutateUsers } = usePermissions();

  // Filters & Tabs State
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'suspended' | 'trash'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  useOnDepChange(debouncedSearch, () => setPage(1));

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
  const meta = usersData?.meta || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const totalUsers = meta.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  const handleExportCsv = () => {
    if (!usersList.length) {
      toast.error('No user records available to export');
      return;
    }
    exportCsv(
      `user-directory-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'User ID', accessor: 'id' },
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role' },
        { header: 'Status', accessor: 'status' },
        {
          header: 'Institution',
          accessor: (u) => (u.institutionId && institutionMap.get(u.institutionId)?.name) || u.institutionId || 'Global Platform',
        },
        { header: 'Active Sessions', accessor: (u) => u.activeSessionsCount || 0 },
        {
          header: 'Last Active Device',
          accessor: (u) => (u.lastLogin ? `${u.lastLogin.browser || 'Browser'} (${u.lastLogin.os || 'OS'})` : 'Never'),
        },
        { header: 'Last IP', accessor: (u) => u.lastLogin?.ipAddress || '' },
        {
          header: 'Last Location',
          accessor: (u) => [u.lastLogin?.city, u.lastLogin?.country].filter(Boolean).join(', '),
        },
        { header: 'Registered At', accessor: (u) => new Date(u.createdAt).toISOString() },
      ],
      usersList,
    );
    toast.success('User directory exported to CSV');
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="User & Account Directory"
        subtitle={
          isSuperAdmin
            ? 'Manage system-wide administrator and school operator identities across tenants'
            : 'Manage administrators and instructors assigned to your institution'
        }
        icon={<Users className="text-primary" size={24} />}
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
              <RefreshCw size={16} className={isFetchingUsers ? 'animate-spin text-primary' : ''} />
            </button>
            {canMutateUsers && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1.5 min-h-[38px]"
              >
                <Plus size={16} />
                <span>Provision User</span>
              </button>
            )}
          </>
        }
      />

      {/* Tenant Isolation Notice for Institute Admins */}
      {!isSuperAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-50/50 border border-orange-200/70 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-primary shrink-0">
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

      {/* Top Stat Cards */}
      <UserStatsCards
        statsData={statsData}
        isLoadingStats={isLoadingStats}
        activeTab={activeTab}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        isSuperAdmin={isSuperAdmin}
        onTabChange={handleTabChange}
        onToggleAdminFilter={() => {
          setRoleFilter(roleFilter === 'ADMIN' ? '' : 'ADMIN');
          setPage(1);
        }}
      />

      {/* Main Container */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-xs overflow-hidden">
        {/* Quick View Segment Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-0 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>All Accounts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-600">
                {statsData?.data?.total ?? 0}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('active')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Active</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100">
                {statsData?.data?.active ?? 0}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('suspended')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'suspended'
                  ? 'border-coral-500 text-coral-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Suspended</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-coral-50 text-coral-600 border border-coral-100">
                {(statsData?.data?.suspended ?? 0) + (statsData?.data?.banned ?? 0)}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('trash')}
              className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'trash'
                  ? 'border-gray-500 text-gray-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Recycle Bin</span>
              {activeTab === 'trash' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-600">
                  {meta.total}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Multifaceted Filter Toolbar */}
        <FilterToolbar
          searchValue={search}
          onSearchChange={(v) => setSearch(v)}
          searchPlaceholder="Search by name, email, or user ID... (Press / to focus)"
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
          hasActiveFilters={Boolean(roleFilter || statusFilter || institutionFilter || search)}
          onClearFilters={() => {
            setRoleFilter('');
            setStatusFilter('');
            setInstitutionFilter('');
            setSearch('');
            setPage(1);
          }}
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          totalResults={totalUsers}
          totalLabel="Users"
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
                {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                <option value="ADMIN">INSTITUTE ADMIN</option>
                <option value="INSTRUCTOR">INSTRUCTOR</option>
                <option value="STUDENT">STUDENT</option>
              </FilterSelect>

              {/* Status Filter */}
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
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BANNED">BANNED</option>
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
                  title="Filter by Institution Tenant"
                >
                  <option value="">All Institutions (Global)</option>
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

        {/* Responsive Data View: Card Layout vs Desktop Table */}
        <ResponsiveDataView
          items={usersList}
          isLoading={isLoadingUsers}
          isError={isErrorUsers}
          errorMessage={usersError?.message || 'Failed to query user database'}
          onRetry={handleRefreshAll}
          viewMode={viewMode}
          keyExtractor={(user) => user.id}
          emptyState={
            <EmptyState
              title={
                debouncedSearch
                  ? `No accounts matched "${debouncedSearch}"`
                  : activeTab === 'trash'
                    ? 'Recycle bin is empty'
                    : 'No users provisioned in this category'
              }
              description={
                debouncedSearch
                  ? 'Try broadening your search term or clearing active status filters.'
                  : 'Create staff accounts or enroll administrators to manage courses.'
              }
              action={
                canMutateUsers && activeTab !== 'trash' ? (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    Provision First Account
                  </button>
                ) : undefined
              }
            />
          }
          renderCard={(user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUserId={currentUser?.id}
              isSuperAdmin={isSuperAdmin}
              institutionMap={institutionMap}
              onEdit={(u) => setSelectedUserForEdit(u)}
              onResetPassword={(u) => setSelectedUserForPassword(u)}
              onViewDetails={(u) => setSelectedUserForDetails(u)}
              onChangeStatus={(u) => setSelectedUserForStatus(u)}
            />
          )}
          renderTable={(items) => (
            <UserTableView
              users={items}
              currentUserId={currentUser?.id}
              isSuperAdmin={isSuperAdmin}
              institutionMap={institutionMap}
              onEdit={(u) => setSelectedUserForEdit(u)}
              onResetPassword={(u) => setSelectedUserForPassword(u)}
              onViewDetails={(u) => setSelectedUserForDetails(u)}
              onChangeStatus={(u) => setSelectedUserForStatus(u)}
            />
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
      <UserModalsCoordinator
        isCreateModalOpen={isCreateModalOpen}
        selectedUserForEdit={selectedUserForEdit}
        selectedUserForPassword={selectedUserForPassword}
        selectedUserForDetails={selectedUserForDetails}
        selectedUserForStatus={selectedUserForStatus}
        onCloseCreate={() => setIsCreateModalOpen(false)}
        onCloseEdit={() => setSelectedUserForEdit(null)}
        onClosePassword={() => setSelectedUserForPassword(null)}
        onCloseDetails={() => setSelectedUserForDetails(null)}
        onCloseStatus={() => setSelectedUserForStatus(null)}
        onSelectEdit={(u) => setSelectedUserForEdit(u)}
        onSelectPassword={(u) => setSelectedUserForPassword(u)}
        onSelectStatus={(u) => setSelectedUserForStatus(u)}
      />
    </div>
  );
};

export default UsersPage;
