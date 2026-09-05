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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import {
  useLicenses,
  useLicenseStats,
  useSoftDeleteLicense,
  useRestoreLicense,
  usePermanentDeleteLicense,
} from '../api/licenseApi';
import type { License, LicenseStatus } from '../api/licenseApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { GenerateLicenseModal } from '../components/GenerateLicenseModal';
import { EditLicenseModal } from '../components/EditLicenseModal';
import { LicenseStatusModal } from '../components/LicenseStatusModal';
import { RevokeLicenseModal } from '../components/RevokeLicenseModal';
import { LicenseDetailModal } from '../components/LicenseDetailModal';
import { LicenseActionsDropdown } from '../components/LicenseActionsDropdown';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type TabType = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'SUSPENDED' | 'REVOKED' | 'TRASH';

export const LicensesPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters & Tab State
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'expiresAt' | 'status' | 'maxActivations'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
    refetch: refetchLicenses,
  } = useLicenses(queryParams);

  const { data: licenseStats, isLoading: isLoadingStats } = useLicenseStats(
    selectedInstitutionId || undefined,
  );

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

  // Filter client-side for "EXPIRING" tab (expiring in next 30 days)
  const licensesList = useMemo(() => {
    if (activeTab === 'EXPIRING') {
      const now = Date.now();
      const in30Days = now + 30 * 24 * 60 * 60 * 1000;
      return rawLicensesList.filter((lic) => {
        const exp = new Date(lic.expiresAt).getTime();
        return lic.status === 'ACTIVE' && exp > now && exp <= in30Days;
      });
    }
    return rawLicensesList;
  }, [rawLicensesList, activeTab]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Workstation Licenses
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#fff0eb] text-[#ff8a5c] rounded-full border border-[#ff8a5c]/20">
              Fleet Authority
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage cryptographic workstation keys, seat capacities, offline verification rules, and active client heartbeats
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Generate License Key</span>
          </button>
        </div>
      </div>

      {/* Fleet Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Issued Keys */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Keys
            </span>
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingStats ? '—' : licenseStats?.totalLicenses ?? meta.total}
            </div>
            <span className="text-[11px] text-gray-400">Minted licenses</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Key size={22} />
          </div>
        </div>

        {/* Active & Valid */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active & Valid
            </span>
            <div className="text-2xl font-bold text-emerald-600">
              {isLoadingStats ? '—' : licenseStats?.activeLicenses ?? 0}
            </div>
            <span className="text-[11px] text-emerald-600/80 font-medium">Authorizing lab PCs</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Workstation Seat Capacity */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Seat Capacity
            </span>
            <div className="text-2xl font-bold text-indigo-600">
              {isLoadingStats ? '—' : licenseStats?.totalWorkstationSeatCapacity ?? 0}
            </div>
            <span className="text-[11px] text-indigo-600/80 font-medium">Aggregated stations</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Monitor size={22} />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Expiring &lt;30d
            </span>
            <div className="text-2xl font-bold text-amber-600">
              {isLoadingStats ? '—' : licenseStats?.expiringWithin30Days ?? 0}
            </div>
            <span className="text-[11px] text-amber-600/80 font-medium">Needs renewal review</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        {/* Revoked / Inactive */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Revoked Keys
            </span>
            <div className="text-2xl font-bold text-rose-600">
              {isLoadingStats ? '—' : licenseStats?.revokedLicenses ?? 0}
            </div>
            <span className="text-[11px] text-gray-400">Terminated credentials</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertOctagon size={22} />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Filters & Tabs Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ALL');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'TRASH'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Trash2 size={13} />
                <span>Recycle Bin</span>
              </button>
            </div>

            {/* Search & Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Institution Filter (Super Admin) */}
              {isSuperAdmin && (
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => {
                    setSelectedInstitutionId(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c] max-w-[200px]"
                >
                  <option value="">All Institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Search Bar */}
              <div className="relative min-w-[220px] sm:min-w-[260px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search license key, hash, or ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                />
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
              >
                <option value="createdAt">Date Minted</option>
                <option value="expiresAt">Expiration Date</option>
                <option value="maxActivations">Seat Capacity</option>
                <option value="status">Status</option>
              </select>

              {/* Sort Direction Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={15} />
              </button>

              {/* Privacy Mask Toggle */}
              <button
                type="button"
                onClick={() => setIsAllKeysMasked(!isAllKeysMasked)}
                className={`p-2 border rounded-xl transition-colors ${
                  isAllKeysMasked
                    ? 'border-[#ff8a5c] text-[#ff8a5c] bg-[#fff0eb]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title={isAllKeysMasked ? 'Reveal full keys' : 'Mask keys for screen privacy'}
              >
                {isAllKeysMasked ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => refetchLicenses()}
                disabled={isFetchingLicenses}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title="Refresh Table"
              >
                <RefreshCw
                  size={15}
                  className={isFetchingLicenses ? 'animate-spin text-[#ff8a5c]' : ''}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
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
              {isLoadingLicenses ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="w-44 h-4 bg-gray-200 rounded mb-1.5" />
                      <div className="w-24 h-3 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-32 h-4 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-28 h-3.5 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-16 h-4 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-24 h-4 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="w-6 h-6 bg-gray-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : licensesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
                        <Key size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">No licenses found</h3>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? `No licenses matched "${searchTerm}". Try another search term.`
                          : activeTab === 'TRASH'
                          ? 'Recycle bin has no soft-deleted licenses.'
                          : 'Get started by generating your first cryptographic workstation license key.'}
                      </p>
                      {!searchTerm && activeTab !== 'TRASH' && (
                        <button
                          type="button"
                          onClick={() => setIsGenerateModalOpen(true)}
                          className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
                        >
                          <Plus size={14} />
                          <span>Generate Key</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                licensesList.map((lic) => {
                  const isDeleted = !!lic.deletedAt;
                  const activationsCount = lic.activations?.length || 0;
                  const maxSeats = lic.maxActivations || 1;
                  const seatRatio = Math.min(100, Math.round((activationsCount / maxSeats) * 100));

                  const isExpired = new Date(lic.expiresAt).getTime() < Date.now();
                  const msUntilExpiry = new Date(lic.expiresAt).getTime() - Date.now();
                  const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDetailLicense(lic)}
                    >
                      {/* Key & Copy */}
                      <td className="py-3.5 px-6">
                        <div className="space-y-1">
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-mono font-extrabold text-gray-900 text-[13px] tracking-wide group-hover:text-[#ff8a5c] transition-colors select-all">
                              {isAllKeysMasked
                                ? `${lic.licenseKey.slice(0, 8)}••••-••••-${lic.licenseKey.slice(-4)}`
                                : lic.licenseKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(lic.licenseKey)}
                              className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                              title="Copy full key"
                            >
                              {copiedKey === lic.licenseKey ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Minted: {new Date(lic.issuedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Institution */}
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

                      {/* Seat Saturation Meter */}
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

                      {/* Offline Grace */}
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          <Clock size={11} className="text-gray-400" />
                          <span>{lic.offlineGraceDays}d allowed</span>
                        </span>
                      </td>

                      {/* Status & Expiry */}
                      <td className="py-3.5 px-6">
                        <div className="space-y-1">
                          {isDeleted ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Trash2 size={10} />
                              <span>In Trash</span>
                            </span>
                          ) : lic.status === 'REVOKED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              <AlertOctagon size={10} />
                              <span>Revoked</span>
                            </span>
                          ) : lic.status === 'SUSPENDED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Suspended</span>
                            </span>
                          ) : isExpired || lic.status === 'EXPIRED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              <span>Expired</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </span>
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

                      {/* Actions */}
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-gray-800">
                {Math.min(page * limit, meta.total)}
              </span>{' '}
              of <span className="font-semibold text-gray-800">{meta.total}</span> licenses
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                Page {page} of {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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
      <ConfirmationModal
        isOpen={!!softDeleteTarget}
        title="Move License to Trash?"
        description={`Are you sure you want to move license "${softDeleteTarget?.licenseKey}" to the recycle bin? It will be archived and hidden from standard directory listings.`}
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
        title="Restore License from Trash?"
        description={`Restore license "${restoreTarget?.licenseKey}" back to active directory?`}
        confirmText="Restore License"
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

      {/* 8. Permanent Purge Confirmation (with typed key safety!) */}
      <ConfirmationModal
        isOpen={!!permanentDeleteTarget}
        title="Permanently Purge License?"
        description={`This action is permanent and IRREVERSIBLE. All cryptographic records, hashes, and workstation activation links for key "${permanentDeleteTarget?.licenseKey}" will be destroyed forever.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText={permanentDeleteTarget?.licenseKey}
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

export default LicensesPage;

