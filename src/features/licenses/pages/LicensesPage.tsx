import React, { useState, useMemo } from 'react';
import {
  Shield,
  Key,
  Plus,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Monitor,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertOctagon,
  Eye,
  EyeOff,
  Radio,
  Sparkles,
  Download,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/lib/permissions';
import {
  useLicenses,
  useLicenseStats,
  useSoftDeleteLicense,
  useRestoreLicense,
  usePermanentDeleteLicense,
} from '../api/licenseApi';
import type { License, LicenseStatus } from '../api/licenseApi';
import StatCard from '@/components/ui/StatCard';
import { useNowMs } from '@/hooks/useNowMs';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { GenerateLicenseModal } from '../components/GenerateLicenseModal';
import { EditLicenseModal } from '../components/EditLicenseModal';
import { LicenseStatusModal } from '../components/LicenseStatusModal';
import { RevokeLicenseModal } from '../components/RevokeLicenseModal';
import { LicenseDetailModal } from '../components/LicenseDetailModal';
import { LicenseActionsDropdown } from '../components/LicenseActionsDropdown';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { LayoutGrid, List } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Modal';

type TabType = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'SUSPENDED' | 'REVOKED' | 'TRASH';

export const LicensesPage: React.FC = () => {
  const { isSuperAdmin, isSupport } = usePermissions();

  // Render-stable freshness clock for the EXPIRING-tab filter — `Date.now()`
  // must not be called during render (the value would change between renders
  // and break memoisation); this hook owns the impurity on an interval.
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
    const headers = [
      'License ID',
      'License Key',
      'Institution',
      'Status',
      'Max Seats',
      'Active Seats',
      'Expires At',
      'Created At',
    ];
    const rows = rawLicensesList.map((lic) => [
      `"${lic.id}"`,
      `"${lic.licenseKey}"`,
      `"${institutions.find((i) => i.id === lic.institutionId)?.name || lic.institutionId}"`,
      `"${lic.status}"`,
      `"${lic.maxActivations}"`,
      `"${lic.activations?.length || 0}"`,
      `"${new Date(lic.expiresAt).toISOString()}"`,
      `"${new Date(lic.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `workstation-licenses-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      {/* Top Header */}
      <PageHeader
        title="Workstation Licenses"
        subtitle="Manage cryptographic workstation keys, seat capacities, offline verification rules, and active client heartbeats"
        icon={<Shield size={20} />}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary rounded-full border border-primary/20">
            Fleet Authority
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export licenses as CSV"
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors font-medium text-xs flex items-center gap-1.5 min-h-[38px]"
            >
              <Download size={14} className="text-gray-500" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleRefreshAll}
              title="Refresh licenses"
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
            >
              <RefreshCw
                size={16}
                className={isFetchingLicenses ? 'animate-spin text-primary' : ''}
              />
            </button>
            {isSupport ? (
              <div
                title="Support role is view-only. Key generation is restricted to administrators."
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-400 bg-gray-100 rounded-xl shadow-2xs flex items-center gap-1.5 min-h-[38px] cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} className="text-gray-400" />
                <span>Generate Key (Locked)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-[#ff7a45] rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 min-h-[38px]"
              >
                <Plus size={16} />
                <span>Generate License Key</span>
              </button>
            )}
          </>
        }
      />

      {/* Network Error Alert Banner */}
      {isErrorLicenses && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-4 text-rose-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Failed to load workstation licenses</p>
              <p className="text-xs text-rose-600 mt-0.5">
                {(licensesError as Error)?.message || 'An error occurred while connecting to the backend API.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetchLicenses()}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-100/50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Fleet Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Keys"
          value={isLoadingStats ? '—' : licenseStats?.totalLicenses ?? meta.total}
          type="orange"
          icon={<Key size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Minted licenses"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          active={activeTab === 'ALL'}
        />
        <StatCard
          title="Active & Valid"
          value={isLoadingStats ? '—' : licenseStats?.activeLicenses ?? 0}
          type="blue"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Authorizing lab PCs"
          onClick={() => {
            setActiveTab('ACTIVE');
            setPage(1);
          }}
          active={activeTab === 'ACTIVE'}
        />
        <StatCard
          title="Seat Capacity"
          value={isLoadingStats ? '—' : licenseStats?.totalWorkstationSeatCapacity ?? 0}
          type="coral"
          icon={<Monitor size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Aggregated stations"
        />
        <StatCard
          title="Expiring <30d"
          value={isLoadingStats ? '—' : licenseStats?.expiringWithin30Days ?? 0}
          type="cyan"
          icon={<Clock size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Needs renewal review"
          onClick={() => {
            setActiveTab('EXPIRING');
            setPage(1);
          }}
          active={activeTab === 'EXPIRING'}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'ALL'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          All Licenses
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('ACTIVE');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'ACTIVE'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('EXPIRING');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'EXPIRING'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Expiring Soon</span>
          {licenseStats && licenseStats.expiringWithin30Days > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
              {licenseStats.expiringWithin30Days}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('SUSPENDED');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'SUSPENDED'
              ? 'bg-white text-gray-800 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Suspended
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('REVOKED');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'REVOKED'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Revoked
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('TRASH');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'TRASH'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Trash2 size={13} />
          <span>Recycle Bin</span>
        </button>
      </div>
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
              className={`h-[38px] px-2.5 border rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold shadow-2xs ${
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
              className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 shadow-2xs"
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
            {/* Institution Filter (Super Admin) */}
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
                onChange={(e) => setSortBy(e.target.value as any)}
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
                className="p-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 font-semibold text-xs"
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

        {/* Dual-Mode Responsive Data View */}
        <ResponsiveDataView<License>
          items={licensesList}
          isLoading={isLoadingLicenses}
          isError={isErrorLicenses}
          errorMessage={(licensesError as Error)?.message}
          onRetry={refetchLicenses}
          viewMode={viewMode}
          keyExtractor={(lic) => lic.id}
          cardGridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4"
          emptyState={
            <EmptyState
              icon={<Shield size={28} />}
              title="No licenses found"
              description={
                searchTerm
                  ? `No workstation licenses matched "${searchTerm}".`
                  : activeTab === 'TRASH'
                  ? 'Recycle bin is completely empty.'
                  : 'Get started by generating your first cryptographic workstation key.'
              }
              action={
                !searchTerm && activeTab !== 'TRASH' && !isSupport ? (
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-[#ff7a45] rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Generate Key</span>
                  </button>
                ) : undefined
              }
            />
          }
          renderCard={(lic) => {
            const isDeleted = !!lic.deletedAt;
            const isMasked = isAllKeysMasked;
            const activationsCount = lic.activations?.length || 0;
            const maxSeats = lic.maxActivations || 1;
            const seatRatio = Math.round((activationsCount / maxSeats) * 100);
            const now = new Date().getTime();
            const expTime = new Date(lic.expiresAt).getTime();
            const isExpired = expTime <= now;
            const daysUntilExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={lic.id}
                className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 ${
                  isDeleted ? 'opacity-65 bg-gray-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-[13px] font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/80 truncate block">
                        {isMasked ? `${lic.licenseKey.substring(0, 8)}••••••••••••` : lic.licenseKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(lic.licenseKey)}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        title="Copy license key"
                      >
                        {copiedKey === lic.licenseKey ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    {lic.institution?.name && (
                      <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                        {lic.institution.name}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <LicenseActionsDropdown
                      license={lic}
                      isSuperAdmin={isSuperAdmin}
                      onView={(target) => setDetailLicense(target)}
                      onEdit={(target) => setEditingLicense(target)}
                      onChangeStatus={(target) => setStatusLicense(target)}
                      onRevoke={(target) => setRevokingLicense(target)}
                      onSoftDelete={(target) => setSoftDeleteTarget(target)}
                      onRestore={(target) => setRestoreTarget(target)}
                      onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-700">
                      {activationsCount} / {maxSeats} Seats
                    </span>
                    <span className="text-gray-400 font-medium">{seatRatio}% capacity</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        seatRatio >= 100
                          ? 'bg-purple-600'
                          : seatRatio >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${seatRatio}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-50 text-xs">
                  {isDeleted ? (
                    <StatusBadge status="DELETED" size="sm" />
                  ) : isExpired ? (
                    <StatusBadge status="EXPIRED" size="sm" />
                  ) : (
                    <StatusBadge status={lic.status} size="sm" />
                  )}

                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" />
                    {isExpired ? (
                      <span className="text-rose-600 font-semibold">Expired</span>
                    ) : daysUntilExpiry <= 30 ? (
                      <span className="text-amber-600 font-semibold">Expires in {daysUntilExpiry}d</span>
                    ) : (
                      <span>Expires {new Date(lic.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
          renderTable={(items) => (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">License Key & Credentials</th>
                  <th className="py-3.5 px-6">Tenant Institution</th>
                  <th className="py-3.5 px-6">Seat Saturation</th>
                  <th className="py-3.5 px-6">Offline Grace</th>
                  <th className="py-3.5 px-6">Status & Expiration</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                {items.map((lic) => {
                  const isDeleted = !!lic.deletedAt;
                  const isMasked = isAllKeysMasked;
                  const activationsCount = lic.activations?.length || 0;
                  const maxSeats = lic.maxActivations || 1;
                  const seatRatio = Math.round((activationsCount / maxSeats) * 100);
                  const now = new Date().getTime();
                  const expTime = new Date(lic.expiresAt).getTime();
                  const isExpired = expTime <= now;
                  const daysUntilExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDetailLicense(lic)}
                    >
                      <td className="py-3.5 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                              {isMasked ? `${lic.licenseKey.substring(0, 8)}••••••••••••` : lic.licenseKey}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyKey(lic.licenseKey);
                              }}
                              className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
                              title="Copy Key"
                            >
                              {copiedKey === lic.licenseKey ? (
                                <Check size={14} className="text-emerald-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Minted: {new Date(lic.issuedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-gray-900">
                            {lic.institution?.name || 'Assigned Center'}
                          </div>
                          {lic.institution?.slug && (
                            <div className="text-[11px] font-mono text-gray-400">
                              @{lic.institution.slug}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="space-y-1.5 min-w-[120px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-gray-800">
                              {activationsCount} / {maxSeats} Seats
                            </span>
                            <span className="text-gray-400 font-medium">{seatRatio}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                seatRatio >= 100
                                  ? 'bg-purple-600'
                                  : seatRatio >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${seatRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          <Clock size={11} className="text-gray-400" />
                          <span>{lic.offlineGraceDays}d allowed</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="space-y-1">
                          {isDeleted ? (
                            <StatusBadge status="DELETED" size="sm" />
                          ) : isExpired ? (
                            <StatusBadge status="EXPIRED" size="sm" />
                          ) : (
                            <StatusBadge status={lic.status} size="sm" />
                          )}
                          <div className="text-[10px] text-gray-400">
                            {isExpired ? (
                              <span className="text-rose-600 font-medium">Expired</span>
                            ) : daysUntilExpiry <= 30 ? (
                              <span className="text-amber-600 font-medium">
                                Expires in {daysUntilExpiry}d
                              </span>
                            ) : (
                              <span>Expires {new Date(lic.expiresAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <LicenseActionsDropdown
                          license={lic}
                          isSuperAdmin={isSuperAdmin}
                          onView={(target) => setDetailLicense(target)}
                          onEdit={(target) => setEditingLicense(target)}
                          onChangeStatus={(target) => setStatusLicense(target)}
                          onRevoke={(target) => setRevokingLicense(target)}
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
          itemName="licenses"
        />
      </div>

      {/* Modal Orchestrations */}

      {/* 1. Generate / Mint License */}
      <GenerateLicenseModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        defaultInstitutionId={selectedInstitutionId}
      />

      {/* 2. Edit Limits */}
      <EditLicenseModal
        isOpen={!!editingLicense}
        license={editingLicense}
        onClose={() => setEditingLicense(null)}
      />

      {/* 3. Change Status */}
      <LicenseStatusModal
        isOpen={!!statusLicense}
        license={statusLicense}
        onClose={() => setStatusLicense(null)}
      />

      {/* 4. Revoke License */}
      <RevokeLicenseModal
        isOpen={!!revokingLicense}
        license={revokingLicense}
        onClose={() => setRevokingLicense(null)}
      />

      {/* 5. 3-Tab Inspector Dossier */}
      <LicenseDetailModal
        isOpen={!!detailLicense}
        license={detailLicense}
        onClose={() => setDetailLicense(null)}
        onOpenEdit={(lic) => setEditingLicense(lic)}
        onOpenRevoke={(lic) => setRevokingLicense(lic)}
      />

      {/* 6. Soft Delete to Trash Confirmation */}
      <ConfirmDialog
        isOpen={!!softDeleteTarget}
        title="Move License to Trash?"
        description={`Are you sure you want to move license "${softDeleteTarget?.licenseKey}" to the recycle bin? It will be archived and hidden from standard directory listings.`}
        confirmLabel="Move to Trash"
        variant="danger"
        isPending={softDeleteMutation.isPending}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={() => {
          if (!softDeleteTarget) return;
          softDeleteMutation.mutate(softDeleteTarget.id, {
            onSuccess: () => setSoftDeleteTarget(null),
          });
        }}
      />

      {/* 7. Restore from Trash Confirmation */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        title="Restore License from Trash?"
        description={`Restore license "${restoreTarget?.licenseKey}" back to active directory?`}
        confirmLabel="Restore License"
        variant="info"
        isPending={restoreMutation.isPending}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate(restoreTarget.id, {
            onSuccess: () => setRestoreTarget(null),
          });
        }}
      />

      {/* 8. Permanent Purge Confirmation (with typed key safety!) */}
      <ConfirmDialog
        isOpen={!!permanentDeleteTarget}
        title="Permanently Purge License?"
        description={`This action is permanent and IRREVERSIBLE. All cryptographic records, hashes, and workstation activation links for key "${permanentDeleteTarget?.licenseKey}" will be destroyed forever.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase={permanentDeleteTarget?.licenseKey}
        isPending={permanentDeleteMutation.isPending}
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

export default LicensesPage;

