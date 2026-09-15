import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Radio,
  CheckCircle2,
  PauseCircle,
  AlertOctagon,
  RefreshCw,
  Building2,
  Copy,
  Check,
  ArrowUpDown,
  AlertCircle,
  Download,
} from 'lucide-react';
import { exportCsv } from '@/lib/exportCsv';
import StatCard from '@/components/ui/StatCard';
import { useNowMs } from '@/hooks/useNowMs';
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
  useOnDepChange,
} from '@/hooks/useDebouncedValue';
import {
  useActivations,
  useActivationStats,
} from '../api/activationApi';
import type { Activation, ActivationStatus } from '../api/activationApi';
import { DeactivateSeatModal } from './DeactivateSeatModal';
import { ReactivateSeatModal } from './ReactivateSeatModal';
import { RevokeActivationModal } from './RevokeActivationModal';
import { ActivationDetailModal } from './ActivationDetailModal';
import { ActivationActionsDropdown } from './ActivationActionsDropdown';
import { toast } from 'sonner';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';

export type SeatTabType =
  | 'ALL'
  | 'ACTIVE'
  | 'RECENT_24H'
  | 'DEACTIVATED'
  | 'REVOKED';

interface SeatsTabViewProps {
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
  institutions: Array<{ id: string; name: string }>;
  isSuperAdmin: boolean;
}

export const SeatsTabView: React.FC<SeatsTabViewProps> = ({
  selectedInstitutionId,
  setSelectedInstitutionId,
  institutions,
  isSuperAdmin,
}) => {
  const [seatTab, setSeatTab] = useState<SeatTabType>('ALL');
  const [seatSearch, setSeatSearch] = useState('');
  const debouncedSeatSearch = useDebouncedValue(seatSearch, SEARCH_DEBOUNCE_MS);
  const [seatPage, setSeatPage] = useState(1);
  const [seatLimit] = useState(10);
  const [seatSortBy, setSeatSortBy] = useState<
    'lastSeenAt' | 'firstActivatedAt' | 'deviceName' | 'status'
  >('lastSeenAt');
  const [seatSortOrder, setSeatSortOrder] = useState<'asc' | 'desc'>('desc');
  const [seatViewMode, setSeatViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [copiedUUID, setCopiedUUID] = useState<string | null>(null);

  useOnDepChange(debouncedSeatSearch, () => setSeatPage(1));

  const seatQueryParams = useMemo(() => {
    let statusFilter: ActivationStatus | undefined = undefined;
    if (seatTab === 'ACTIVE') statusFilter = 'ACTIVE';
    else if (seatTab === 'DEACTIVATED') statusFilter = 'DEACTIVATED';
    else if (seatTab === 'REVOKED') statusFilter = 'REVOKED';

    return {
      page: seatPage,
      limit: seatLimit,
      search: debouncedSeatSearch.trim() || undefined,
      status: statusFilter,
      institutionId: selectedInstitutionId || undefined,
      sortBy: seatSortBy,
      sortOrder: seatSortOrder,
    };
  }, [
    seatPage,
    seatLimit,
    debouncedSeatSearch,
    seatTab,
    selectedInstitutionId,
    seatSortBy,
    seatSortOrder,
  ]);

  const {
    data: activationsData,
    isLoading: isLoadingActivations,
    isFetching: isFetchingActivations,
    isError: isActivationsError,
    error: activationsError,
    refetch: refetchActivations,
  } = useActivations(seatQueryParams);

  const {
    data: activationStats,
    isLoading: isLoadingStats,
    refetch: refetchActivationStats,
  } = useActivationStats(selectedInstitutionId || undefined);

  const handleRefreshSeats = () => {
    void refetchActivationStats();
    void refetchActivations();
  };

  const [deactivatingActivation, setDeactivatingActivation] =
    useState<Activation | null>(null);
  const [reactivatingActivation, setReactivatingActivation] =
    useState<Activation | null>(null);
  const [revokingActivation, setRevokingActivation] =
    useState<Activation | null>(null);
  const [detailActivation, setDetailActivation] = useState<Activation | null>(
    null,
  );

  const rawActivationsList = activationsData?.data || [];
  const seatMeta = activationsData?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const nowMs = useNowMs();

  const activationsList = useMemo(() => {
    if (seatTab === 'RECENT_24H') {
      const past24h = nowMs - 24 * 60 * 60 * 1000;
      return rawActivationsList.filter((act) => {
        const lastSeen = new Date(act.lastSeenAt).getTime();
        return act.status === 'ACTIVE' && lastSeen >= past24h;
      });
    }
    return rawActivationsList;
  }, [rawActivationsList, seatTab, nowMs]);

  const handleCopyUUID = (uuid: string) => {
    void navigator.clipboard.writeText(uuid);
    setCopiedUUID(uuid);
    toast.success('Device UUID copied to clipboard');
    setTimeout(() => setCopiedUUID(null), 2000);
  };

  const handleExportSeatsCsv = () => {
    if (!rawActivationsList.length) {
      toast.error('No workstation seat records available to export');
      return;
    }
    exportCsv(
      `workstation-seats-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Activation ID', accessor: 'id' },
        { header: 'Device Name', accessor: (act) => act.deviceName || '' },
        {
          header: 'Hardware Fingerprint',
          accessor: (act) => act.hardwareFingerprint || '',
        },
        {
          header: 'License Key',
          accessor: (act) => act.license?.licenseKey || act.licenseId || '',
        },
        {
          header: 'Institution',
          accessor: (act) =>
            act.institution?.name ||
            institutions.find((i) => i.id === act.institutionId)?.name ||
            act.institutionId ||
            '',
        },
        { header: 'App Version', accessor: (act) => act.appVersion || '' },
        { header: 'OS Version', accessor: (act) => act.osVersion || '' },
        { header: 'Status', accessor: 'status' },
        {
          header: 'First Activated At',
          accessor: (act) =>
            act.firstActivatedAt
              ? new Date(act.firstActivatedAt).toISOString()
              : '',
        },
        {
          header: 'Last Seen At',
          accessor: (act) =>
            act.lastSeenAt ? new Date(act.lastSeenAt).toISOString() : '',
        },
      ],
      rawActivationsList,
    );
    toast.success('Workstation seat records exported to CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seat Activations KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Stations"
          value={activationStats?.totalActivations ?? seatMeta.total}
          type="blue"
          icon={<Monitor size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="All registered PCs"
          onClick={() => {
            setSeatTab('ALL');
            setSeatPage(1);
          }}
          active={seatTab === 'ALL'}
        />
        <StatCard
          title="Active Today (24h)"
          value={activationStats?.activeInLast24Hours ?? 0}
          type="emerald"
          icon={<Radio size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Heartbeat in 24h"
          onClick={() => {
            setSeatTab('RECENT_24H');
            setSeatPage(1);
          }}
          active={seatTab === 'RECENT_24H'}
        />
        <StatCard
          title="Occupied Seats"
          value={activationStats?.activeSeats ?? 0}
          type="cyan"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Licensed active slots"
          onClick={() => {
            setSeatTab('ACTIVE');
            setSeatPage(1);
          }}
          active={seatTab === 'ACTIVE'}
        />
        <StatCard
          title="Deactivated Slots"
          value={activationStats?.deactivatedSeats ?? 0}
          type="orange"
          icon={<PauseCircle size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Released back to quota"
          onClick={() => {
            setSeatTab('DEACTIVATED');
            setSeatPage(1);
          }}
          active={seatTab === 'DEACTIVATED'}
        />
        <StatCard
          title="Revoked Stations"
          value={activationStats?.revokedSeats ?? 0}
          type="coral"
          icon={<AlertOctagon size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Blacklisted PCs"
          onClick={() => {
            setSeatTab('REVOKED');
            setSeatPage(1);
          }}
          active={seatTab === 'REVOKED'}
        />
      </div>

      {/* Error Banner with Retry */}
      {isActivationsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to synchronize workstation seat activations:{' '}
              {activationsError instanceof Error
                ? activationsError.message
                : 'Network error'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshSeats}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Station Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSeatTab('ALL');
              setSeatPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              seatTab === 'ALL'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Stations
          </button>
          <button
            type="button"
            onClick={() => {
              setSeatTab('ACTIVE');
              setSeatPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              seatTab === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => {
              setSeatTab('RECENT_24H');
              setSeatPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              seatTab === 'RECENT_24H'
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
              setSeatTab('DEACTIVATED');
              setSeatPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              seatTab === 'DEACTIVATED'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Deactivated
          </button>
          <button
            type="button"
            onClick={() => {
              setSeatTab('REVOKED');
              setSeatPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              seatTab === 'REVOKED'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Revoked
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportSeatsCsv}
            className="flex items-center gap-1.5 h-[38px] px-3 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Export currently loaded workstations to CSV"
          >
            <Download size={13} className="text-gray-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleRefreshSeats}
            disabled={isFetchingActivations}
            className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 shadow-2xs cursor-pointer"
            title="Refresh Table &amp; Metrics"
          >
            <RefreshCw
              size={14}
              className={isFetchingActivations ? 'animate-spin text-primary' : ''}
            />
          </button>
        </div>
      </div>

      {/* Seat Activations Filter Toolbar */}
      <FilterToolbar
        searchValue={seatSearch}
        onSearchChange={setSeatSearch}
        searchPlaceholder="Search PC name, UUID, fingerprint... (Press / to focus)"
        activeChips={[
          ...(selectedInstitutionId
            ? [
                {
                  id: 'institution',
                  label: 'Institution',
                  value:
                    institutions.find((i) => i.id === selectedInstitutionId)
                      ?.name || selectedInstitutionId,
                  onRemove: () => {
                    setSelectedInstitutionId('');
                    setSeatPage(1);
                  },
                },
              ]
            : []),
          ...(seatSortBy !== 'lastSeenAt' || seatSortOrder !== 'desc'
            ? [
                {
                  id: 'seatSort',
                  label: 'Sort',
                  value: `${seatSortBy} (${seatSortOrder.toUpperCase()})`,
                  onRemove: () => {
                    setSeatSortBy('lastSeenAt');
                    setSeatSortOrder('desc');
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          selectedInstitutionId ||
            seatSearch ||
            seatSortBy !== 'lastSeenAt' ||
            seatSortOrder !== 'desc',
        )}
        onClearFilters={() => {
          setSelectedInstitutionId('');
          setSeatSearch('');
          setSeatSortBy('lastSeenAt');
          setSeatSortOrder('desc');
          setSeatPage(1);
        }}
        totalResults={seatMeta.total}
        totalLabel="Workstation seats"
        viewMode={seatViewMode}
        onViewModeChange={setSeatViewMode}
        filterElements={
          <>
            {isSuperAdmin && (
              <FilterSelect
                icon={<Building2 size={13} />}
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setSeatPage(1);
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

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <FilterSelect
                icon={<ArrowUpDown size={13} />}
                value={seatSortBy}
                onChange={(e) =>
                  setSeatSortBy(
                    e.target.value as
                      | 'lastSeenAt'
                      | 'firstActivatedAt'
                      | 'deviceName'
                      | 'status',
                  )
                }
                title="Sort by Attribute"
              >
                <option value="lastSeenAt">Last Heartbeat</option>
                <option value="firstActivatedAt">First Activated</option>
                <option value="deviceName">Station Name</option>
                <option value="status">Status</option>
              </FilterSelect>
              <button
                type="button"
                onClick={() =>
                  setSeatSortOrder(seatSortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors shrink-0 font-bold text-xs shadow-2xs cursor-pointer"
                title={`Sort ${seatSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {seatSortOrder.toUpperCase()}
              </button>
            </div>
          </>
        }
      />

      {/* Seat Activations Table Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Mobile Card List or Cards Grid Mode */}
        <div
          className={
            seatViewMode === 'CARDS'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4'
              : 'md:hidden divide-y divide-gray-100'
          }
        >
          {isLoadingActivations ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))
          ) : activationsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No workstation terminals found.
            </div>
          ) : (
            activationsList.map((act) => {
              const lastSeenMs = nowMs - new Date(act.lastSeenAt).getTime();
              const isOnlineNow = lastSeenMs < 1000 * 60 * 60;
              const isWithin24h = lastSeenMs < 1000 * 60 * 60 * 24;

              return (
                <div
                  key={act.id}
                  onClick={() => setDetailActivation(act)}
                  className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <Monitor size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                          <span>{act.deviceName}</span>
                          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-gray-100 text-gray-600 rounded">
                            v{act.appVersion}
                          </span>
                        </div>
                        <span className="font-mono text-gray-400 text-[11px] block truncate max-w-[180px]">
                          {act.deviceId}
                        </span>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <ActivationActionsDropdown
                        activation={act}
                        onView={(target) => setDetailActivation(target)}
                        onDeactivate={(target) =>
                          setDeactivatingActivation(target)
                        }
                        onReactivate={(target) =>
                          setReactivatingActivation(target)
                        }
                        onRevoke={(target) => setRevokingActivation(target)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">
                        License Key
                      </span>
                      <span className="font-mono font-bold text-gray-800 text-[11px] truncate block">
                        {act.license?.licenseKey || act.licenseId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">
                        Hardware ID
                      </span>
                      <span className="font-mono text-gray-600 text-[11px] truncate block">
                        {act.hardwareFingerprint}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
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
                      <span className="font-medium text-gray-700">
                        {isOnlineNow && act.status === 'ACTIVE'
                          ? 'Online Now'
                          : isWithin24h && act.status === 'ACTIVE'
                            ? 'Active Today'
                            : 'Offline'}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(act.lastSeenAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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
                      <h3 className="text-sm font-bold text-gray-800">
                        No workstation terminals found
                      </h3>
                      <p className="text-xs text-gray-500">
                        {seatSearch
                          ? `No workstations matched "${seatSearch}". Try another search term.`
                          : 'Desktop client activations will appear here as lab computers connect.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                activationsList.map((act) => {
                  const lastSeenMs = nowMs - new Date(act.lastSeenAt).getTime();
                  const isOnlineNow = lastSeenMs < 1000 * 60 * 60;
                  const isWithin24h = lastSeenMs < 1000 * 60 * 60 * 24;

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDetailActivation(act)}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                            <Monitor size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors flex items-center gap-2">
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
                                className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors cursor-pointer"
                                title="Copy Device UUID"
                              >
                                {copiedUUID === act.deviceId ? (
                                  <Check
                                    size={11}
                                    className="text-emerald-600"
                                  />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="font-mono text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 inline-block truncate max-w-[170px]">
                          {act.hardwareFingerprint}
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="font-mono font-bold text-gray-800 text-xs">
                          {act.license?.licenseKey || act.licenseId}
                        </div>
                      </td>

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
                            {new Date(act.lastSeenAt).toLocaleString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </div>
                        </div>
                      </td>

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

                      <td
                        className="py-3.5 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActivationActionsDropdown
                          activation={act}
                          onView={(target) => setDetailActivation(target)}
                          onDeactivate={(target) =>
                            setDeactivatingActivation(target)
                          }
                          onReactivate={(target) =>
                            setReactivatingActivation(target)
                          }
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

        {/* Standardized Pagination Bar */}
        <Pagination
          page={seatPage}
          totalPages={seatMeta.totalPages}
          totalItems={seatMeta.total}
          pageSize={seatLimit}
          onPageChange={(p) => setSeatPage(p)}
          itemName="seat activations"
        />
      </div>

      {/* Seat Operation Modals */}
      <DeactivateSeatModal
        activation={deactivatingActivation}
        isOpen={Boolean(deactivatingActivation)}
        onClose={() => setDeactivatingActivation(null)}
      />

      <ReactivateSeatModal
        activation={reactivatingActivation}
        isOpen={Boolean(reactivatingActivation)}
        onClose={() => setReactivatingActivation(null)}
      />

      <RevokeActivationModal
        activation={revokingActivation}
        isOpen={Boolean(revokingActivation)}
        onClose={() => setRevokingActivation(null)}
      />

      <ActivationDetailModal
        activation={detailActivation}
        isOpen={Boolean(detailActivation)}
        onClose={() => setDetailActivation(null)}
      />
    </div>
  );
};

