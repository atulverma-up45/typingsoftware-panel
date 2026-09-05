import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Radio,
  CheckCircle2,
  PauseCircle,
  AlertOctagon,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Key,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import {
  useActivations,
  useActivationStats,
} from '../api/activationApi';
import type { Activation, ActivationStatus } from '../api/activationApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { DeactivateSeatModal } from '../components/DeactivateSeatModal';
import { ReactivateSeatModal } from '../components/ReactivateSeatModal';
import { RevokeActivationModal } from '../components/RevokeActivationModal';
import { ActivationDetailModal } from '../components/ActivationDetailModal';
import { ActivationActionsDropdown } from '../components/ActivationActionsDropdown';
import { toast } from 'sonner';

type TabType = 'ALL' | 'ACTIVE' | 'RECENT_24H' | 'DEACTIVATED' | 'REVOKED';

export const ActivationsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters State
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'lastSeenAt' | 'firstActivatedAt' | 'deviceName' | 'status'>('lastSeenAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Derive query parameters
  const queryParams = useMemo(() => {
    let statusFilter: ActivationStatus | undefined = undefined;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'DEACTIVATED') {
      statusFilter = 'DEACTIVATED';
    } else if (activeTab === 'REVOKED') {
      statusFilter = 'REVOKED';
    }

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter,
      institutionId: selectedInstitutionId || undefined,
      sortBy,
      sortOrder,
    };
  }, [page, limit, debouncedSearch, activeTab, selectedInstitutionId, sortBy, sortOrder]);

  // Queries
  const {
    data: activationsData,
    isLoading: isLoadingActivations,
    isFetching: isFetchingActivations,
    refetch: refetchActivations,
  } = useActivations(queryParams);

  const { data: activationStats, isLoading: isLoadingStats } = useActivationStats(
    selectedInstitutionId || undefined,
  );

  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });

  // Modals state
  const [deactivatingActivation, setDeactivatingActivation] = useState<Activation | null>(null);
  const [reactivatingActivation, setReactivatingActivation] = useState<Activation | null>(null);
  const [revokingActivation, setRevokingActivation] = useState<Activation | null>(null);
  const [detailActivation, setDetailActivation] = useState<Activation | null>(null);

  // Copy tracking
  const [copiedUUID, setCopiedUUID] = useState<string | null>(null);
  const handleCopyUUID = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiedUUID(uuid);
    toast.success('Device UUID copied');
    setTimeout(() => setCopiedUUID(null), 2000);
  };

  const rawActivationsList = activationsData?.data || [];
  const meta = activationsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const institutions = institutionsData?.data || [];

  // Filter client-side for RECENT_24H tab
  const activationsList = useMemo(() => {
    if (activeTab === 'RECENT_24H') {
      const past24h = Date.now() - 24 * 60 * 60 * 1000;
      return rawActivationsList.filter((act) => {
        const lastSeen = new Date(act.lastSeenAt).getTime();
        return act.status === 'ACTIVE' && lastSeen >= past24h;
      });
    }
    return rawActivationsList;
  }, [rawActivationsList, activeTab]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Workstation Activations
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Hardware Fleet
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time telemetry and seat governance for physical desktop client terminals across student labs
          </p>
        </div>
      </div>

      {/* Terminal Fleet Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Terminals */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Stations
            </span>
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingStats ? '—' : activationStats?.totalActivations ?? meta.total}
            </div>
            <span className="text-[11px] text-gray-400">All registered PCs</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Monitor size={22} />
          </div>
        </div>

        {/* Online Now / Active in 24h */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Today (24h)
            </span>
            <div className="text-2xl font-bold text-emerald-600">
              {isLoadingStats ? '—' : activationStats?.activeInLast24Hours ?? 0}
            </div>
            <span className="text-[11px] text-emerald-600/80 font-medium">Testing heartbeats</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Radio size={22} />
          </div>
        </div>

        {/* Active Seats */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Occupied Seats
            </span>
            <div className="text-2xl font-bold text-indigo-600">
              {isLoadingStats ? '—' : activationStats?.activeSeats ?? 0}
            </div>
            <span className="text-[11px] text-indigo-600/80 font-medium">Licensed active slots</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Deactivated */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Deactivated Slots
            </span>
            <div className="text-2xl font-bold text-amber-600">
              {isLoadingStats ? '—' : activationStats?.deactivatedSeats ?? 0}
            </div>
            <span className="text-[11px] text-amber-600/80 font-medium">Released back to quota</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <PauseCircle size={22} />
          </div>
        </div>

        {/* Revoked Blacklist */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Revoked Terminals
            </span>
            <div className="text-2xl font-bold text-rose-600">
              {isLoadingStats ? '—' : activationStats?.revokedSeats ?? 0}
            </div>
            <span className="text-[11px] text-gray-400">Blacklisted PCs</span>
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
                All Stations
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
                  setActiveTab('RECENT_24H');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeTab === 'RECENT_24H'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Radio size={12} />
                <span>Online / 24h</span>
                {activationStats && activationStats.activeInLast24Hours > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                    {activationStats.activeInLast24Hours}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('DEACTIVATED');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'DEACTIVATED'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Deactivated
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
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 max-w-[200px]"
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
                  placeholder="Search PC name, UUID, fingerprint, OS..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="lastSeenAt">Last Heartbeat</option>
                <option value="firstActivatedAt">First Activated</option>
                <option value="deviceName">Station Name</option>
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

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => refetchActivations()}
                disabled={isFetchingActivations}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title="Refresh Table"
              >
                <RefreshCw
                  size={15}
                  className={isFetchingActivations ? 'animate-spin text-blue-600' : ''}
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
                <th className="py-3.5 px-6">Workstation Terminal</th>
                <th className="py-3.5 px-6">Hardware Fingerprint</th>
                <th className="py-3.5 px-6">Assigned License Key</th>
                <th className="py-3.5 px-6">Last Heartbeat</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
              {isLoadingActivations ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="w-36 h-4 bg-gray-200 rounded mb-1" />
                      <div className="w-24 h-3 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-28 h-3.5 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-36 h-4 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-24 h-3.5 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-16 h-5 bg-gray-200 rounded-full" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="w-6 h-6 bg-gray-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : activationsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
                        <Monitor size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">No workstation terminals found</h3>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? `No workstations matched "${searchTerm}". Try another search term.`
                          : 'Desktop client activations will appear here as lab computers connect.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                activationsList.map((act) => {
                  const lastSeenMs = Date.now() - new Date(act.lastSeenAt).getTime();
                  const isOnlineNow = lastSeenMs < 1000 * 60 * 60; // 1 hour
                  const isWithin24h = lastSeenMs < 1000 * 60 * 60 * 24; // 24 hours

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDetailActivation(act)}
                    >
                      {/* Workstation PC & Device UUID */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                            <Monitor size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-2">
                              <span>{act.deviceName}</span>
                              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-gray-100 text-gray-600 rounded">
                                v{act.appVersion}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1.5 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-mono text-gray-400 text-[11px] truncate max-w-[150px]">
                                {act.deviceId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUUID(act.deviceId)}
                                className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                                title="Copy Device UUID"
                              >
                                {copiedUUID === act.deviceId ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hardware Fingerprint */}
                      <td className="py-3.5 px-6">
                        <div className="font-mono text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 inline-block truncate max-w-[170px]">
                          {act.hardwareFingerprint}
                        </div>
                      </td>

                      {/* License Key */}
                      <td className="py-3.5 px-6">
                        <div className="font-mono font-bold text-gray-800 text-xs">
                          {act.license?.licenseKey || act.licenseId}
                        </div>
                      </td>

                      {/* Last Seen Heartbeat */}
                      <td className="py-3.5 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isOnlineNow && act.status === 'ACTIVE'
                                  ? 'bg-emerald-500 animate-ping'
                                  : isWithin24h && act.status === 'ACTIVE'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300'
                              }`}
                            />
                            <span className="text-[11px] font-medium text-gray-700">
                              {isOnlineNow && act.status === 'ACTIVE'
                                ? 'Online Now'
                                : isWithin24h && act.status === 'ACTIVE'
                                ? 'Active Today'
                                : 'Offline'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(act.lastSeenAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        {act.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : act.status === 'DEACTIVATED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            <span>Deactivated</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertOctagon size={10} />
                            <span>Revoked</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActivationActionsDropdown
                          activation={act}
                          isSuperAdmin={isSuperAdmin}
                          onView={(target) => setDetailActivation(target)}
                          onDeactivate={(target) => setDeactivatingActivation(target)}
                          onReactivate={(target) => setReactivatingActivation(target)}
                          onRevoke={(target) => setRevokingActivation(target)}
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
              of <span className="font-semibold text-gray-800">{meta.total}</span> workstations
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

      {/* 1. Deactivate Seat */}
      <DeactivateSeatModal
        isOpen={!!deactivatingActivation}
        activation={deactivatingActivation}
        onClose={() => setDeactivatingActivation(null)}
      />

      {/* 2. Reactivate Seat */}
      <ReactivateSeatModal
        isOpen={!!reactivatingActivation}
        activation={reactivatingActivation}
        onClose={() => setReactivatingActivation(null)}
      />

      {/* 3. Revoke Terminal */}
      <RevokeActivationModal
        isOpen={!!revokingActivation}
        activation={revokingActivation}
        onClose={() => setRevokingActivation(null)}
      />

      {/* 4. 3-Tab Detailed Inspector Dossier */}
      <ActivationDetailModal
        isOpen={!!detailActivation}
        activation={detailActivation}
        onClose={() => setDetailActivation(null)}
        onOpenDeactivate={(act) => setDeactivatingActivation(act)}
        onOpenReactivate={(act) => setReactivatingActivation(act)}
        onOpenRevoke={(act) => setRevokingActivation(act)}
      />
    </div>
  );
};

export default ActivationsPage;

