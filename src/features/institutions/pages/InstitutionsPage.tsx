import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Mail,
  Phone,
  Shield,
  Palette,
  Power,
  RotateCcw,
  AlertOctagon,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import {
  useInstitutions,
  useGlobalInstitutionStats,
  useSoftDeleteInstitution,
  useRestoreInstitution,
  usePermanentDeleteInstitution,
} from '../api/institutionApi';
import type {
  Institution,
  InstitutionStatus,
} from '../api/institutionApi';
import StatCard from '@/features/dashboard/components/StatCard';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { EditInstitutionModal } from '../components/EditInstitutionModal';
import { InstitutionStatusModal } from '../components/InstitutionStatusModal';
import { BrandingEditorModal } from '../components/BrandingEditorModal';
import { InstitutionDetailModal } from '../components/InstitutionDetailModal';
import { InstitutionActionsDropdown } from '../components/InstitutionActionsDropdown';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { LayoutGrid, List } from 'lucide-react';

type TabType = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'TRASH';

export const InstitutionsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'status' | 'slug'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Debounce search input (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Derive query parameters based on tab
  const queryParams = useMemo(() => {
    let statusFilter: InstitutionStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'SUSPENDED') {
      statusFilter = 'SUSPENDED';
    } else if (activeTab === 'TRASH') {
      statusFilter = 'DELETED';
      includeDeleted = true;
    }

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter,
      includeDeleted,
      sortBy,
      sortOrder,
    };
  }, [page, limit, debouncedSearch, activeTab, sortBy, sortOrder]);

  // API Queries
  const {
    data: institutionsData,
    isLoading: isLoadingInstitutions,
    isFetching: isFetchingInstitutions,
    isError: isErrorInstitutions,
    error: institutionsError,
    refetch: refetchInstitutions,
  } = useInstitutions(queryParams);

  const { data: globalStats, isLoading: isLoadingStats, refetch: refetchStats } = useGlobalInstitutionStats(isSuperAdmin);

  const handleRefreshAll = () => {
    refetchStats();
    refetchInstitutions();
  };

  // Mutations
  const softDeleteMutation = useSoftDeleteInstitution();
  const restoreMutation = useRestoreInstitution();
  const permanentDeleteMutation = usePermanentDeleteInstitution();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [statusInstitution, setStatusInstitution] = useState<Institution | null>(null);
  const [brandingInstitution, setBrandingInstitution] = useState<Institution | null>(null);
  const [detailInstitution, setDetailInstitution] = useState<Institution | null>(null);

  // Confirmation Modals State
  const [softDeleteTarget, setSoftDeleteTarget] = useState<Institution | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Institution | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Institution | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedId(slug);
    toast.success(`Copied @${slug}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const institutionsList = institutionsData?.data || [];
  const meta = institutionsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleExportCsv = () => {
    if (!institutionsList.length) {
      toast.error('No institution records available to export');
      return;
    }
    const headers = [
      'Institution ID',
      'Name',
      'Slug',
      'Status',
      'Primary Email',
      'Phone',
      'Address',
      'Brand Name',
      'Primary Color',
      'Created At',
    ];
    const rows = institutionsList.map((inst) => [
      `"${inst.id}"`,
      `"${inst.name.replace(/"/g, '""')}"`,
      `"${inst.slug}"`,
      `"${inst.status}"`,
      `"${inst.email}"`,
      `"${inst.phone || ''}"`,
      `"${(inst.address || '').replace(/"/g, '""')}"`,
      `"${inst.branding?.displayName || inst.name}"`,
      `"${inst.branding?.primaryColor || '#2563EB'}"`,
      `"${new Date(inst.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `institutions-directory-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Institutions directory exported to CSV successfully');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Top Header */}
      <PageHeader
        title="Institutions Directory"
        subtitle="Manage authorized coaching centers, tenant domains, white-label client styling, and lab allocations"
        icon={<GraduationCap size={20} />}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#fff0eb] text-[#ff8a5c] rounded-full border border-[#ff8a5c]/20">
            Multi-Tenant
          </span>
        }
        actions={
          <>
            <button
              onClick={handleExportCsv}
              title="Export institutions directory as CSV"
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors font-medium text-xs flex items-center gap-1.5 min-h-[38px]"
            >
              <Download size={14} className="text-gray-500" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>
            <button
              onClick={handleRefreshAll}
              title="Refresh directory"
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
            >
              <RefreshCw
                size={16}
                className={isFetchingInstitutions ? 'animate-spin text-[#ff8a5c]' : ''}
              />
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 min-h-[38px]"
              >
                <Plus size={16} />
                <span>Provision Institution</span>
              </button>
            )}
          </>
        }
      />

      {/* Network Error Alert Banner */}
      {isErrorInstitutions && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-4 text-rose-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Failed to load institutions directory</p>
              <p className="text-xs text-rose-600 mt-0.5">
                {(institutionsError as Error)?.message || 'An error occurred while connecting to the backend API.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchInstitutions()}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-100/50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* KPI Overview Cards (Super Admin) */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Centers"
            value={isLoadingStats ? '—' : globalStats?.totalInstitutions ?? meta.total}
            type="orange"
            icon={<GraduationCap size={24} className="text-white" />}
            isLoading={isLoadingStats}
            subtitle="Onboarded client tenants"
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            active={activeTab === 'ALL'}
          />
          <StatCard
            title="Active Centers"
            value={isLoadingStats ? '—' : globalStats?.activeInstitutions ?? 0}
            type="blue"
            icon={<CheckCircle2 size={24} className="text-white" />}
            isLoading={isLoadingStats}
            subtitle="Live authentications enabled"
            onClick={() => {
              setActiveTab('ACTIVE');
              setPage(1);
            }}
            active={activeTab === 'ACTIVE'}
          />
          <StatCard
            title="Suspended Centers"
            value={isLoadingStats ? '—' : globalStats?.suspendedInstitutions ?? 0}
            type="coral"
            icon={<AlertCircle size={24} className="text-white" />}
            isLoading={isLoadingStats}
            subtitle="Pending renewal or review"
            onClick={() => {
              setActiveTab('SUSPENDED');
              setPage(1);
            }}
            active={activeTab === 'SUSPENDED'}
          />
          <StatCard
            title="Recycle Bin"
            value={isLoadingStats ? '—' : globalStats?.deletedInstitutions ?? 0}
            type="cyan"
            icon={<Trash2 size={24} className="text-white" />}
            isLoading={isLoadingStats}
            subtitle="Soft-deleted client centers"
            onClick={() => {
              setActiveTab('TRASH');
              setPage(1);
            }}
            active={activeTab === 'TRASH'}
          />
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit overflow-x-auto custom-scrollbar">
        {[
          { id: 'ALL', label: 'All Centers' },
          { id: 'ACTIVE', label: 'Active', textClass: 'text-emerald-700' },
          { id: 'SUSPENDED', label: 'Suspended', textClass: 'text-amber-700' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as TabType);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === tab.id
                ? `bg-white ${tab.textClass || 'text-gray-900'} shadow-xs`
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('TRASH');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'TRASH'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Trash2 size={13} />
            <span>Recycle Bin</span>
            {globalStats && globalStats.deletedInstitutions > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                {globalStats.deletedInstitutions}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search name, slug, email... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeChips={[
          ...(sortBy !== 'createdAt' || sortOrder !== 'desc'
            ? [
                {
                  id: 'sort',
                  label: 'Sort',
                  value: `${sortBy} (${sortOrder.toUpperCase()})`,
                  onRemove: () => {
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(searchTerm || sortBy !== 'createdAt' || sortOrder !== 'desc')}
        onClearFilters={() => {
          setSearchTerm('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        totalResults={meta?.total}
        totalLabel="Institutions"
        actions={
          <button
            type="button"
            onClick={() => refetchInstitutions()}
            disabled={isFetchingInstitutions}
            className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 shadow-2xs"
            title="Refresh Table"
          >
            <RefreshCw
              size={14}
              className={isFetchingInstitutions ? 'animate-spin text-[#ff8a5c]' : ''}
            />
          </button>
        }
        filterElements={
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <FilterSelect
              icon={<ArrowUpDown size={13} />}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort by Column"
            >
              <option value="createdAt">Date Onboarded</option>
              <option value="name">Institution Name</option>
              <option value="status">Status</option>
              <option value="slug">Tenant Slug</option>
            </FilterSelect>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors shrink-0 font-bold text-xs shadow-2xs"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        }
      />

      {/* Main Content Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Dual-Mode Responsive Data View */}
        <ResponsiveDataView<Institution>
          items={institutionsList}
          isLoading={isLoadingInstitutions}
          isError={isErrorInstitutions}
          errorMessage={(institutionsError as Error)?.message}
          onRetry={refetchInstitutions}
          viewMode={viewMode}
          keyExtractor={(inst) => inst.id}
          cardGridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4"
          emptyState={
            <EmptyState
              icon={<Building2 size={28} />}
              title="No institutions found"
              description={
                searchTerm
                  ? `No institutions matched "${searchTerm}". Try another search term.`
                  : activeTab === 'TRASH'
                  ? 'Recycle bin is completely empty.'
                  : 'Get started by provisioning your first typing training institution.'
              }
              action={
                isSuperAdmin && !searchTerm && activeTab !== 'TRASH' ? (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Provision Center</span>
                  </button>
                ) : undefined
              }
            />
          }
          renderCard={(inst) => {
            const isDeleted = !!inst.deletedAt;
            return (
              <div
                key={inst.id}
                className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 ${
                  isDeleted ? 'opacity-65 bg-gray-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center border border-gray-200 shrink-0">
                      {inst.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="font-semibold text-gray-900 text-sm hover:text-[#ff8a5c] transition-colors truncate cursor-pointer"
                        onClick={() => setDetailInstitution(inst)}
                      >
                        {inst.name}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-gray-400 text-[11px]">@{inst.slug}</span>
                        <button
                          type="button"
                          onClick={() => handleCopySlug(inst.slug)}
                          className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                          title="Copy slug"
                        >
                          {copiedId === inst.slug ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <InstitutionActionsDropdown
                      institution={inst}
                      isSuperAdmin={isSuperAdmin}
                      onView={(target) => setDetailInstitution(target)}
                      onEdit={(target) => setEditingInstitution(target)}
                      onBranding={(target) => setBrandingInstitution(target)}
                      onChangeStatus={(target) => setStatusInstitution(target)}
                      onSoftDelete={(target) => setSoftDeleteTarget(target)}
                      onRestore={(target) => setRestoreTarget(target)}
                      onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50 text-xs">
                  {isDeleted ? (
                    <StatusBadge status="DELETED" size="sm" />
                  ) : (
                    <StatusBadge status={inst.status} size="sm" />
                  )}
                  <span className="text-[11px] text-gray-400">
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {inst.email && (
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 bg-gray-50/50 -mx-4 -mb-4 p-2.5 rounded-b-2xl truncate">
                    <a
                      href={`mailto:${inst.email}`}
                      className="hover:text-[#ff8a5c] flex items-center gap-1.5 truncate"
                    >
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{inst.email}</span>
                    </a>
                    {inst.phone && <span className="text-gray-400 shrink-0">{inst.phone}</span>}
                  </div>
                )}
              </div>
            );
          }}
          renderTable={(items) => (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Center & Tenant Slug</th>
                  <th className="py-3.5 px-6">Official Contact</th>
                  <th className="py-3.5 px-6">Operational Status</th>
                  <th className="py-3.5 px-6">Onboarded</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                {items.map((inst) => {
                  const isDeleted = !!inst.deletedAt;

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDetailInstitution(inst)}
                    >
                      {/* Name & Slug */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center border border-gray-200 group-hover:border-[#ff8a5c]/40 group-hover:bg-[#fff0eb] group-hover:text-[#ff8a5c] transition-all shrink-0">
                            {inst.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-[#ff8a5c] transition-colors flex items-center gap-2">
                              <span>{inst.name}</span>
                              {inst.phone && (
                                <span className="text-[10px] text-gray-400 hidden sm:inline">
                                  • {inst.phone}
                                </span>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-1.5 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-mono text-gray-400 text-[11px]">
                                @{inst.slug}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopySlug(inst.slug)}
                                className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                                title="Copy slug"
                              >
                                {copiedId === inst.slug ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <a
                            href={`mailto:${inst.email}`}
                            className="text-gray-800 font-medium hover:text-[#ff8a5c] flex items-center gap-1.5 transition-colors truncate max-w-[200px]"
                          >
                            <Mail size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{inst.email}</span>
                          </a>
                          {inst.address && (
                            <div className="text-[11px] text-gray-400 truncate max-w-[220px]">
                              {inst.address}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        {isDeleted ? (
                          <StatusBadge status="DELETED" size="sm" />
                        ) : (
                          <StatusBadge status={inst.status} size="sm" />
                        )}
                      </td>

                      {/* Onboarded Date */}
                      <td className="py-3.5 px-6 text-gray-500 text-[11px]">
                        {new Date(inst.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <InstitutionActionsDropdown
                          institution={inst}
                          isSuperAdmin={isSuperAdmin}
                          onView={(target) => setDetailInstitution(target)}
                          onEdit={(target) => setEditingInstitution(target)}
                          onBranding={(target) => setBrandingInstitution(target)}
                          onChangeStatus={(target) => setStatusInstitution(target)}
                          onSoftDelete={(target) => setSoftDeleteTarget(target)}
                          onRestore={(target) => setRestoreTarget(target)}
                          onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
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
          totalPages={meta.totalPages}
          totalItems={meta.total}
          pageSize={limit}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          itemName="institutions"
        />
      </div>

      {/* Modals Orchestration */}

      {/* 1. Provision New Institution */}
      <CreateInstitutionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* 2. Edit Institution Profile */}
      <EditInstitutionModal
        isOpen={!!editingInstitution}
        institution={editingInstitution}
        onClose={() => setEditingInstitution(null)}
      />

      {/* 3. Change Status */}
      <InstitutionStatusModal
        isOpen={!!statusInstitution}
        institution={statusInstitution}
        onClose={() => setStatusInstitution(null)}
      />

      {/* 4. White-Label Branding Studio */}
      <BrandingEditorModal
        isOpen={!!brandingInstitution}
        institution={brandingInstitution}
        onClose={() => setBrandingInstitution(null)}
      />

      {/* 5. 3-Tab Detailed Inspector Dossier */}
      <InstitutionDetailModal
        isOpen={!!detailInstitution}
        institution={detailInstitution}
        onClose={() => setDetailInstitution(null)}
        onOpenEdit={(inst) => setEditingInstitution(inst)}
        onOpenBranding={(inst) => setBrandingInstitution(inst)}
      />

      {/* 6. Soft Delete (Move to Trash) Confirmation */}
      <ConfirmationModal
        isOpen={!!softDeleteTarget}
        title="Move Institution to Trash?"
        description={`Are you sure you want to move "${softDeleteTarget?.name}" to the recycle bin? Its active authentications will be temporarily disabled, but you can restore it at any time.`}
        confirmText="Move to Trash"
        variant="danger"
        isLoading={softDeleteMutation.isPending}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={() => {
          if (!softDeleteTarget) return;
          softDeleteMutation.mutate(softDeleteTarget.id, {
            onSuccess: () => setSoftDeleteTarget(null),
          });
        }}
      />

      {/* 7. Restore from Trash Confirmation */}
      <ConfirmationModal
        isOpen={!!restoreTarget}
        title="Restore Institution from Trash?"
        description={`Restore "${restoreTarget?.name}" back to Active status? The center will immediately regain access to its licenses and tenant configurations.`}
        confirmText="Restore Institution"
        variant="info"
        isLoading={restoreMutation.isPending}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate(restoreTarget.id, {
            onSuccess: () => setRestoreTarget(null),
          });
        }}
      />

      {/* 8. Permanent Purge Confirmation (with typed slug safety!) */}
      <ConfirmationModal
        isOpen={!!permanentDeleteTarget}
        title="Permanently Purge Institution?"
        description={`This action is permanent and IRREVERSIBLE. All student records, licenses, device links, and branding assets for "${permanentDeleteTarget?.name}" will be wiped out completely.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText={permanentDeleteTarget?.slug}
        isLoading={permanentDeleteMutation.isPending}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteMutation.mutate(permanentDeleteTarget.id, {
            onSuccess: () => setPermanentDeleteTarget(null),
          });
        }}
      />
    </div>
  );
};
export default InstitutionsPage;
