import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  Building2,
  Trash2,
  Download,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
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
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { exportCsv } from '@/lib/exportCsv';
import { EditInstitutionModal } from '../components/EditInstitutionModal';
import { InstitutionStatusModal } from '../components/InstitutionStatusModal';
import { BrandingEditorModal } from '../components/BrandingEditorModal';
import { InstitutionDetailModal } from '../components/InstitutionDetailModal';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import EmptyState from '@/components/ui/EmptyState';
import { InstitutionStatsCards, type InstitutionTabType } from '../components/InstitutionStatsCards';
import { InstitutionCard } from '../components/InstitutionCard';
import { InstitutionTableView } from '../components/InstitutionTableView';
import { InstitutionConfirmModals } from '../components/InstitutionConfirmModals';

export const InstitutionsPage: React.FC = () => {
  const { isSuperAdmin } = usePermissions();

  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<InstitutionTabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'status' | 'slug'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  useOnDepChange(debouncedSearch, () => setPage(1));

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
    if (isSuperAdmin) {
      refetchStats();
    }
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
    toast.success(`Copied slug "${slug}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const institutionsList = institutionsData?.data || [];
  const meta = institutionsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleExportCsv = () => {
    if (!institutionsList.length) {
      toast.error('No institution records available to export');
      return;
    }
    exportCsv(
      `institutions-directory-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Center ID', accessor: 'id' },
        { header: 'Center Name', accessor: 'name' },
        { header: 'Slug', accessor: 'slug' },
        { header: 'Email', accessor: 'email' },
        { header: 'Phone', accessor: (i) => i.phone || '' },
        { header: 'Status', accessor: 'status' },
        { header: 'Address', accessor: (i) => i.address || '' },
        { header: 'Onboarded Date', accessor: (i) => new Date(i.createdAt).toISOString() },
      ],
      institutionsList,
    );
    toast.success('Institutions exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Training Centers & Institutes"
        subtitle="Provision, configure white-label branding, and oversee educational franchisee tenants"
        icon={<GraduationCap className="text-primary" size={24} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export institution directory as CSV"
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors font-medium text-xs flex items-center gap-1.5 min-h-[38px]"
            >
              <Download size={14} className="text-gray-500" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingInstitutions}
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="Refresh Directory"
            >
              <RefreshCw
                size={16}
                className={isFetchingInstitutions ? 'animate-spin text-primary' : ''}
              />
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1.5 min-h-[38px]"
              >
                <Plus size={16} />
                <span>Onboard Center</span>
              </button>
            )}
          </div>
        }
      />

      {/* KPI Overview Cards (Super Admin) */}
      {isSuperAdmin && (
        <InstitutionStatsCards
          stats={globalStats}
          totalInstitutions={meta.total}
          isLoading={isLoadingStats}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
        />
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
              setActiveTab(tab.id as InstitutionTabType);
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

      {/* Multifaceted Filter Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search centers by title, slug or email... (Press / to focus)"
        activeChips={[
          ...(sortBy !== 'createdAt'
            ? [
                {
                  id: 'sort',
                  label: 'Sort By',
                  value: sortBy.toUpperCase(),
                  onRemove: () => setSortBy('createdAt'),
                },
              ]
            : []),
          ...(sortOrder !== 'desc'
            ? [
                {
                  id: 'order',
                  label: 'Order',
                  value: sortOrder.toUpperCase(),
                  onRemove: () => setSortOrder('desc'),
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalResults={meta.total}
        totalLabel="Centers"
        filterElements={
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <FilterSelect
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              title="Sort criteria"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="slug">Slug ID</option>
            </FilterSelect>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-[38px] px-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-xs shrink-0 shadow-2xs transition-colors"
              title={`Sort ${sortOrder.toUpperCase()}`}
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        }
      />

      {/* Main Content Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
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
                    className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Provision Center</span>
                  </button>
                ) : undefined
              }
            />
          }
          renderCard={(inst) => (
            <InstitutionCard
              key={inst.id}
              institution={inst}
              isSuperAdmin={isSuperAdmin}
              copiedId={copiedId}
              onCopySlug={handleCopySlug}
              onView={(target) => setDetailInstitution(target)}
              onEdit={(target) => setEditingInstitution(target)}
              onBranding={(target) => setBrandingInstitution(target)}
              onChangeStatus={(target) => setStatusInstitution(target)}
              onSoftDelete={(target) => setSoftDeleteTarget(target)}
              onRestore={(target) => setRestoreTarget(target)}
              onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
            />
          )}
          renderTable={(items) => (
            <InstitutionTableView
              institutions={items}
              isSuperAdmin={isSuperAdmin}
              copiedId={copiedId}
              onCopySlug={handleCopySlug}
              onView={(target) => setDetailInstitution(target)}
              onEdit={(target) => setEditingInstitution(target)}
              onBranding={(target) => setBrandingInstitution(target)}
              onChangeStatus={(target) => setStatusInstitution(target)}
              onSoftDelete={(target) => setSoftDeleteTarget(target)}
              onRestore={(target) => setRestoreTarget(target)}
              onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
            />
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
      <CreateInstitutionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditInstitutionModal
        isOpen={!!editingInstitution}
        institution={editingInstitution}
        onClose={() => setEditingInstitution(null)}
      />

      <InstitutionStatusModal
        isOpen={!!statusInstitution}
        institution={statusInstitution}
        onClose={() => setStatusInstitution(null)}
      />

      <BrandingEditorModal
        isOpen={!!brandingInstitution}
        institution={brandingInstitution}
        onClose={() => setBrandingInstitution(null)}
      />

      <InstitutionDetailModal
        isOpen={!!detailInstitution}
        institution={detailInstitution}
        onClose={() => setDetailInstitution(null)}
        onOpenEdit={(inst) => setEditingInstitution(inst)}
        onOpenBranding={(inst) => setBrandingInstitution(inst)}
      />

      <InstitutionConfirmModals
        softDeleteTarget={softDeleteTarget}
        restoreTarget={restoreTarget}
        permanentDeleteTarget={permanentDeleteTarget}
        isSoftDeletePending={softDeleteMutation.isPending}
        isRestorePending={restoreMutation.isPending}
        isPermanentDeletePending={permanentDeleteMutation.isPending}
        onCloseSoftDelete={() => setSoftDeleteTarget(null)}
        onCloseRestore={() => setRestoreTarget(null)}
        onClosePermanentDelete={() => setPermanentDeleteTarget(null)}
        onConfirmSoftDelete={() => {
          if (!softDeleteTarget) return;
          softDeleteMutation.mutate(softDeleteTarget.id, {
            onSuccess: () => setSoftDeleteTarget(null),
          });
        }}
        onConfirmRestore={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate(restoreTarget.id, {
            onSuccess: () => setRestoreTarget(null),
          });
        }}
        onConfirmPermanentDelete={() => {
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
