import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Building2,
  Eye,
  EyeOff,
  ArrowUpDown,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import {
  useLicenses,
  useLicenseStats,
  useSoftDeleteLicense,
  useRestoreLicense,
  usePermanentDeleteLicense,
} from '../api/licenseApi';
import type { License, LicenseStatus } from '../api/licenseApi';
import { useNowMs } from '@/hooks/useNowMs';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { GenerateLicenseModal } from '../components/GenerateLicenseModal';
import { EditLicenseModal } from '../components/EditLicenseModal';
import { LicenseStatusModal } from '../components/LicenseStatusModal';
import { RevokeLicenseModal } from '../components/RevokeLicenseModal';
import { exportCsv } from '@/lib/exportCsv';
import { LicenseDetailModal } from '../components/LicenseDetailModal';
import { toast } from 'sonner';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { LicenseStatsHeader, type TabType } from '../components/LicenseStatsHeader';
import { LicenseTableView } from '../components/LicenseTableView';
import { LicenseConfirmModals } from '../components/LicenseConfirmModals';

export const LicensesPage: React.FC = () => {
  const { isSuperAdmin, isSupport } = usePermissions();

  const nowMs = useNowMs();

  // Filters & Tab State
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'expiresAt' | 'status' | 'maxActivations'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Reset to the first page whenever the committed (debounced) search changes
  useOnDepChange(debouncedSearch, () => setPage(1));

  // Derive query params
  const queryParams = useMemo(() => {
    let statusFilter: LicenseStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'SUSPENDED') {
      statusFilter = 'SUSPENDED';
    } else if (activeTab === 'REVOKED') {
      statusFilter = 'REVOKED';
    } else if (activeTab === 'TRASH') {
      includeDeleted = true;
    }

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter,
      institutionId: selectedInstitutionId || undefined,
      includeDeleted,
      sortBy: activeTab === 'EXPIRING' ? 'expiresAt' : sortBy,
      sortOrder: activeTab === 'EXPIRING' ? 'asc' : sortOrder,
    };
  }, [page, limit, debouncedSearch, activeTab, selectedInstitutionId, sortBy, sortOrder]);

  // Queries
  const {
    data: licensesData,
    isLoading: isLoadingLicenses,
    isFetching: isFetchingLicenses,
    isError: isErrorLicenses,
    error: licensesError,
    refetch: refetchLicenses,
  } = useLicenses(queryParams);

  const { data: licenseStats, isLoading: isLoadingStats, refetch: refetchStats } = useLicenseStats(
    selectedInstitutionId || undefined,
  );

  const handleRefreshAll = () => {
    refetchStats();
    refetchLicenses();
  };

  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });

  // Mutations
  const softDeleteMutation = useSoftDeleteLicense();
  const restoreMutation = useRestoreLicense();
  const permanentDeleteMutation = usePermanentDeleteLicense();

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [statusLicense, setStatusLicense] = useState<License | null>(null);
  const [revokingLicense, setRevokingLicense] = useState<License | null>(null);
  const [detailLicense, setDetailLicense] = useState<License | null>(null);

  // Danger confirmations
  const [softDeleteTarget, setSoftDeleteTarget] = useState<License | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<License | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<License | null>(null);

  // Copy helper & Mask state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAllKeysMasked, setIsAllKeysMasked] = useState(false);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('License key copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rawLicensesList = licensesData?.data || [];
  const meta = licensesData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const institutions = institutionsData?.data || [];

  const handleExportCsv = () => {
    if (!rawLicensesList.length) {
      toast.error('No license records available to export');
      return;
    }
    exportCsv(
      `workstation-licenses-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'License ID', accessor: 'id' },
        { header: 'License Key', accessor: 'licenseKey' },
        {
          header: 'Institution',
          accessor: (lic) => institutions.find((i) => i.id === lic.institutionId)?.name || lic.institutionId,
        },
        { header: 'Status', accessor: 'status' },
        { header: 'Max Seats', accessor: 'maxActivations' },
        { header: 'Active Seats', accessor: (lic) => lic.activations?.length || 0 },
        { header: 'Expires At', accessor: (lic) => new Date(lic.expiresAt).toISOString() },
        { header: 'Created At', accessor: (lic) => new Date(lic.createdAt).toISOString() },
      ],
      rawLicensesList,
    );
    toast.success('Licenses exported to CSV successfully');
  };

  // Filter client-side for "EXPIRING" tab (expiring in next 30 days)
  const licensesList = useMemo(() => {
    if (activeTab === 'EXPIRING') {
      const now = nowMs;
      const in30Days = now + 30 * 24 * 60 * 60 * 1000;
      return rawLicensesList.filter((lic) => {
        const exp = new Date(lic.expiresAt).getTime();
        return lic.status === 'ACTIVE' && exp > now && exp <= in30Days;
      });
    }
    return rawLicensesList;
  }, [rawLicensesList, activeTab, nowMs]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Header & KPI StatCards */}
      <LicenseStatsHeader
        licenseStats={licenseStats}
        isLoadingStats={isLoadingStats}
        totalLicenses={meta.total}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        isErrorLicenses={isErrorLicenses}
        licensesError={licensesError}
        onRetry={refetchLicenses}
        onExportCsv={handleExportCsv}
        onRefreshAll={handleRefreshAll}
        isFetchingLicenses={isFetchingLicenses}
        isSupport={isSupport}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
      />

      {/* Filter & Search Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search license key, hash, or ID... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeChips={[
          ...(selectedInstitutionId
            ? [
                {
                  id: 'institution',
                  label: 'Institution',
                  value:
                    institutions.find((i) => i.id === selectedInstitutionId)?.name ||
                    selectedInstitutionId,
                  onRemove: () => {
                    setSelectedInstitutionId('');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          selectedInstitutionId || searchTerm || sortBy !== 'createdAt' || sortOrder !== 'desc'
        )}
        onClearFilters={() => {
          setSelectedInstitutionId('');
          setSearchTerm('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        totalResults={meta.total}
        totalLabel="License keys"
        actions={
          <div className="flex items-center gap-1.5">
            {/* Privacy Mask Toggle */}
            <button
              type="button"
              onClick={() => setIsAllKeysMasked(!isAllKeysMasked)}
              className={`h-[38px] px-2.5 border rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer ${
                isAllKeysMasked
                  ? 'border-primary text-primary bg-primary-100'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title={isAllKeysMasked ? 'Reveal full keys' : 'Mask keys for screen privacy'}
            >
              {isAllKeysMasked ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">{isAllKeysMasked ? 'Masked' : 'Visible'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetchLicenses()}
              disabled={isFetchingLicenses}
              className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Refresh Table"
            >
              <RefreshCw
                size={14}
                className={isFetchingLicenses ? 'animate-spin text-primary' : ''}
              />
            </button>
          </div>
        }
        filterElements={
          <>
            {isSuperAdmin && (
              <FilterSelect
                icon={<Building2 size={13} />}
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
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

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 w-full sm:w-auto">
              <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'expiresAt' | 'status' | 'maxActivations')}
                className="w-full sm:w-auto text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary"
              >
                <option value="createdAt">Date Minted</option>
                <option value="expiresAt">Expiration Date</option>
                <option value="maxActivations">Seat Capacity</option>
                <option value="status">Status</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 font-semibold text-xs cursor-pointer"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </>
        }
      />

      {/* Main Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        <LicenseTableView
          licensesList={licensesList}
          isLoadingLicenses={isLoadingLicenses}
          isErrorLicenses={isErrorLicenses}
          licensesError={licensesError}
          refetchLicenses={refetchLicenses}
          viewMode={viewMode}
          searchTerm={searchTerm}
          activeTab={activeTab}
          isSupport={isSupport}
          isSuperAdmin={isSuperAdmin}
          isAllKeysMasked={isAllKeysMasked}
          copiedKey={copiedKey}
          onCopyKey={handleCopyKey}
          onGenerateKey={() => setIsGenerateModalOpen(true)}
          onView={(target) => setDetailLicense(target)}
          onEdit={(target) => setEditingLicense(target)}
          onChangeStatus={(target) => setStatusLicense(target)}
          onRevoke={(target) => setRevokingLicense(target)}
          onSoftDelete={(target) => setSoftDeleteTarget(target)}
          onRestore={(target) => setRestoreTarget(target)}
          onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
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
          itemName="licenses"
        />
      </div>

      {/* Modal Orchestrations */}
      <GenerateLicenseModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        defaultInstitutionId={selectedInstitutionId}
      />

      <EditLicenseModal
        isOpen={!!editingLicense}
        license={editingLicense}
        onClose={() => setEditingLicense(null)}
      />

      <LicenseStatusModal
        isOpen={!!statusLicense}
        license={statusLicense}
        onClose={() => setStatusLicense(null)}
      />

      <RevokeLicenseModal
        isOpen={!!revokingLicense}
        license={revokingLicense}
        onClose={() => setRevokingLicense(null)}
      />

      <LicenseDetailModal
        isOpen={!!detailLicense}
        license={detailLicense}
        onClose={() => setDetailLicense(null)}
        onOpenEdit={(lic) => setEditingLicense(lic)}
        onOpenRevoke={(lic) => setRevokingLicense(lic)}
      />

      <LicenseConfirmModals
        softDeleteTarget={softDeleteTarget}
        onCloseSoftDelete={() => setSoftDeleteTarget(null)}
        onConfirmSoftDelete={() => {
          if (!softDeleteTarget) return;
          softDeleteMutation.mutate(softDeleteTarget.id, {
            onSuccess: () => setSoftDeleteTarget(null),
          });
        }}
        isSoftDeleting={softDeleteMutation.isPending}

        restoreTarget={restoreTarget}
        onCloseRestore={() => setRestoreTarget(null)}
        onConfirmRestore={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate(restoreTarget.id, {
            onSuccess: () => setRestoreTarget(null),
          });
        }}
        isRestoring={restoreMutation.isPending}

        permanentDeleteTarget={permanentDeleteTarget}
        onClosePermanentDelete={() => setPermanentDeleteTarget(null)}
        onConfirmPermanentDelete={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteMutation.mutate(permanentDeleteTarget.id, {
            onSuccess: () => setPermanentDeleteTarget(null),
          });
        }}
        isPermanentDeleting={permanentDeleteMutation.isPending}
      />
    </div>
  );
};

export default LicensesPage;
