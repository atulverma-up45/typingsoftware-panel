import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Radio,
  Monitor,
  Clock,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Trash2,
  Download,
  Building2,
  ArrowUpDown,
  Copy,
  Check,
  AlertTriangle,
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
  useDevices,
  useDeviceStats,
  useSoftDeleteDevice,
  useRestoreDevice,
  usePermanentDeleteDevice,
  useRevokeDevice,
} from '../api/deviceApi';
import type { Device, DeviceStatus } from '../api/deviceApi';
import { DeviceActionsDropdown } from './DeviceActionsDropdown';
import { DeviceDetailModal } from './DeviceDetailModal';
import { DeviceStatusModal } from './DeviceStatusModal';
import { EditDeviceModal } from './EditDeviceModal';
import { toast } from 'sonner';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { ConfirmDialog } from '@/components/ui/Modal';

export type DeviceTabType = 'ALL' | 'ACTIVE' | 'SUSPECT' | 'REVOKED' | 'TRASH';

interface DevicesTabViewProps {
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
  institutions: Array<{ id: string; name: string }>;
  isSuperAdmin: boolean;
}

export const DevicesTabView: React.FC<DevicesTabViewProps> = ({
  selectedInstitutionId,
  setSelectedInstitutionId,
  institutions,
  isSuperAdmin,
}) => {
  const [deviceTab, setDeviceTab] = useState<DeviceTabType>('ALL');
  const [deviceSearch, setDeviceSearch] = useState('');
  const debouncedDeviceSearch = useDebouncedValue(
    deviceSearch,
    SEARCH_DEBOUNCE_MS,
  );
  const [devicePage, setDevicePage] = useState(1);
  const [deviceLimit] = useState(10);
  const [deviceSortBy, setDeviceSortBy] = useState<
    'lastSeenAt' | 'deviceName' | 'createdAt' | 'status'
  >('lastSeenAt');
  const [deviceSortOrder, setDeviceSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deviceViewMode, setDeviceViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [copiedUUID, setCopiedUUID] = useState<string | null>(null);

  useOnDepChange(debouncedDeviceSearch, () => setDevicePage(1));

  const deviceQueryParams = useMemo(() => {
    let statusFilter: DeviceStatus | undefined = undefined;
    let includeDeleted = false;

    if (deviceTab === 'ACTIVE') statusFilter = 'ACTIVE';
    else if (deviceTab === 'SUSPECT') statusFilter = 'SUSPECT';
    else if (deviceTab === 'REVOKED') statusFilter = 'REVOKED';
    else if (deviceTab === 'TRASH') includeDeleted = true;

    return {
      page: devicePage,
      limit: deviceLimit,
      search: debouncedDeviceSearch.trim() || undefined,
      status: statusFilter,
      includeDeleted,
      institutionId: selectedInstitutionId || undefined,
      sortBy: deviceSortBy,
      sortOrder: deviceSortOrder,
    };
  }, [
    devicePage,
    deviceLimit,
    debouncedDeviceSearch,
    deviceTab,
    selectedInstitutionId,
    deviceSortBy,
    deviceSortOrder,
  ]);

  const {
    data: devicesData,
    isLoading: isLoadingDevices,
    isFetching: isFetchingDevices,
    isError: isDevicesError,
    error: devicesError,
    refetch: refetchDevices,
  } = useDevices(deviceQueryParams);

  const {
    data: deviceStats,
    isLoading: isLoadingDeviceStats,
    refetch: refetchDeviceStats,
  } = useDeviceStats(selectedInstitutionId || undefined);

  const softDeleteDeviceMutation = useSoftDeleteDevice();
  const restoreDeviceMutation = useRestoreDevice();
  const permanentDeleteDeviceMutation = usePermanentDeleteDevice();
  const revokeDeviceMutation = useRevokeDevice();

  const handleRefreshDevices = () => {
    void refetchDeviceStats();
    void refetchDevices();
  };

  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [statusDevice, setStatusDevice] = useState<Device | null>(null);
  const [revokeDeviceTarget, setRevokeDeviceTarget] = useState<Device | null>(
    null,
  );
  const [trashDeviceTarget, setTrashDeviceTarget] = useState<Device | null>(null);
  const [restoreDeviceTarget, setRestoreDeviceTarget] = useState<Device | null>(
    null,
  );
  const [purgeDeviceTarget, setPurgeDeviceTarget] = useState<Device | null>(null);

  const devicesList = devicesData?.data || [];
  const deviceMeta = devicesData?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const nowMs = useNowMs();

  const handleCopyUUID = (uuid: string) => {
    void navigator.clipboard.writeText(uuid);
    setCopiedUUID(uuid);
    toast.success('Device UUID copied to clipboard');
    setTimeout(() => setCopiedUUID(null), 2000);
  };

  const handleExportDevicesCsv = () => {
    if (!devicesList.length) {
      toast.error('No hardware device records available to export');
      return;
    }
    exportCsv(
      `hardware-fleet-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Record ID', accessor: 'id' },
        { header: 'Device Name', accessor: (dev) => dev.deviceName || '' },
        { header: 'Device UUID', accessor: (dev) => dev.deviceId || '' },
        {
          header: 'Hardware Fingerprint',
          accessor: (dev) => dev.hardwareFingerprint || '',
        },
        {
          header: 'Institution',
          accessor: (dev) =>
            dev.institution?.name ||
            institutions.find((i) => i.id === dev.institutionId)?.name ||
            dev.institutionId ||
            '',
        },
        { header: 'App Version', accessor: (dev) => dev.appVersion || '' },
        { header: 'OS Version', accessor: (dev) => dev.osVersion || '' },
        { header: 'Status', accessor: 'status' },
        {
          header: 'First Registered At',
          accessor: (dev) =>
            dev.firstActivatedAt
              ? new Date(dev.firstActivatedAt).toISOString()
              : '',
        },
        {
          header: 'Last Ping At',
          accessor: (dev) =>
            dev.lastSeenAt ? new Date(dev.lastSeenAt).toISOString() : '',
        },
      ],
      devicesList,
    );
    toast.success('Hardware fleet inventory exported to CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Device Fleet KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Terminals"
          value={deviceStats?.totalDevices ?? deviceMeta.total}
          type="blue"
          icon={<Cpu size={24} className="text-white" />}
          isLoading={isLoadingDeviceStats}
          subtitle="Physical PC inventory"
          onClick={() => {
            setDeviceTab('ALL');
            setDevicePage(1);
          }}
          active={deviceTab === 'ALL'}
        />
        <StatCard
          title="Active 24 Hours"
          value={deviceStats?.activeInLast24Hours ?? 0}
          type="emerald"
          icon={<Radio size={24} className="text-white" />}
          isLoading={isLoadingDeviceStats}
          subtitle="Synced today"
          onClick={() => {
            setDeviceTab('ACTIVE');
            setDevicePage(1);
          }}
          active={deviceTab === 'ACTIVE'}
        />
        <StatCard
          title="Active 7 Days"
          value={deviceStats?.activeInLast7Days ?? 0}
          type="cyan"
          icon={<Monitor size={24} className="text-white" />}
          isLoading={isLoadingDeviceStats}
          subtitle="Regular lab use"
        />
        <StatCard
          title="Dormant (>14d)"
          value={deviceStats?.offlineMoreThan14Days ?? 0}
          type="orange"
          icon={<Clock size={24} className="text-white" />}
          isLoading={isLoadingDeviceStats}
          subtitle="Inactive terminals"
        />
        <StatCard
          title="Suspect / Revoked"
          value={
            (deviceStats?.suspectDevices ?? 0) +
            (deviceStats?.revokedDevices ?? 0)
          }
          type="coral"
          icon={<ShieldAlert size={24} className="text-white" />}
          isLoading={isLoadingDeviceStats}
          subtitle="Blocked hardware"
          onClick={() => {
            setDeviceTab('SUSPECT');
            setDevicePage(1);
          }}
          active={deviceTab === 'SUSPECT' || deviceTab === 'REVOKED'}
        />
      </div>

      {/* Error Banner with Retry */}
      {isDevicesError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to synchronize hardware device fleet:{' '}
              {devicesError instanceof Error
                ? devicesError.message
                : 'Network error'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshDevices}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Fleet Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              setDeviceTab('ALL');
              setDevicePage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              deviceTab === 'ALL'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Fleet ({deviceStats?.totalDevices ?? '—'})
          </button>
          <button
            type="button"
            onClick={() => {
              setDeviceTab('ACTIVE');
              setDevicePage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              deviceTab === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => {
              setDeviceTab('SUSPECT');
              setDevicePage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              deviceTab === 'SUSPECT'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Suspect ({deviceStats?.suspectDevices ?? 0})
          </button>
          <button
            type="button"
            onClick={() => {
              setDeviceTab('REVOKED');
              setDevicePage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              deviceTab === 'REVOKED'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Revoked ({deviceStats?.revokedDevices ?? 0})
          </button>
          <button
            type="button"
            onClick={() => {
              setDeviceTab('TRASH');
              setDevicePage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              deviceTab === 'TRASH'
                ? 'bg-white text-gray-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Trash2 size={12} />
            <span>Recycle Bin</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportDevicesCsv}
            className="flex items-center gap-1.5 h-[38px] px-3 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Export currently loaded hardware fleet to CSV"
          >
            <Download size={13} className="text-gray-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleRefreshDevices}
            disabled={isFetchingDevices}
            className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shrink-0 shadow-2xs cursor-pointer"
            title="Refresh Fleet Table &amp; Metrics"
          >
            <RefreshCw
              size={14}
              className={isFetchingDevices ? 'animate-spin text-primary' : ''}
            />
          </button>
        </div>
      </div>

      {/* Hardware Fleet Filter Toolbar */}
      <FilterToolbar
        searchValue={deviceSearch}
        onSearchChange={setDeviceSearch}
        searchPlaceholder="Search device name, UUID, OS, fingerprint... (Press / to focus)"
        activeChips={[
          ...(selectedInstitutionId
            ? [
                {
                  id: 'deviceInstitution',
                  label: 'Institution',
                  value:
                    institutions.find((i) => i.id === selectedInstitutionId)
                      ?.name || selectedInstitutionId,
                  onRemove: () => {
                    setSelectedInstitutionId('');
                    setDevicePage(1);
                  },
                },
              ]
            : []),
          ...(deviceSortBy !== 'lastSeenAt' || deviceSortOrder !== 'desc'
            ? [
                {
                  id: 'deviceSort',
                  label: 'Sort',
                  value: `${deviceSortBy} (${deviceSortOrder.toUpperCase()})`,
                  onRemove: () => {
                    setDeviceSortBy('lastSeenAt');
                    setDeviceSortOrder('desc');
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          selectedInstitutionId ||
            deviceSearch ||
            deviceSortBy !== 'lastSeenAt' ||
            deviceSortOrder !== 'desc',
        )}
        onClearFilters={() => {
          setSelectedInstitutionId('');
          setDeviceSearch('');
          setDeviceSortBy('lastSeenAt');
          setDeviceSortOrder('desc');
          setDevicePage(1);
        }}
        totalResults={deviceMeta.total}
        totalLabel="Fleet hardware terminals"
        viewMode={deviceViewMode}
        onViewModeChange={setDeviceViewMode}
        filterElements={
          <>
            {isSuperAdmin && (
              <FilterSelect
                icon={<Building2 size={13} />}
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setDevicePage(1);
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
                value={deviceSortBy}
                onChange={(e) =>
                  setDeviceSortBy(
                    e.target.value as
                      | 'lastSeenAt'
                      | 'deviceName'
                      | 'createdAt'
                      | 'status',
                  )
                }
                title="Sort by Attribute"
              >
                <option value="lastSeenAt">Last Ping</option>
                <option value="deviceName">Station Name</option>
                <option value="createdAt">First Registered</option>
                <option value="status">Status</option>
              </FilterSelect>
              <button
                type="button"
                onClick={() =>
                  setDeviceSortOrder(deviceSortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="h-[38px] px-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors shrink-0 font-bold text-xs shadow-2xs cursor-pointer"
                title={`Sort ${deviceSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {deviceSortOrder.toUpperCase()}
              </button>
            </div>
          </>
        }
      />

      {/* Device Fleet Table Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Mobile Card List or Cards Grid Mode */}
        <div
          className={
            deviceViewMode === 'CARDS'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4'
              : 'md:hidden divide-y divide-gray-100'
          }
        >
          {isLoadingDevices ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))
          ) : devicesList.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No hardware terminals found.
            </div>
          ) : (
            devicesList.map((dev) => {
              const lastSeenMs = nowMs - new Date(dev.lastSeenAt).getTime();
              const isOnlineNow = lastSeenMs < 1000 * 60 * 60;
              const isWithin24h = lastSeenMs < 1000 * 60 * 60 * 24;
              const isSoftDeleted = Boolean(dev.deletedAt);

              return (
                <div
                  key={dev.id}
                  onClick={() => setDetailDevice(dev)}
                  className={`p-4 space-y-3 hover:bg-gray-50/70 transition-colors cursor-pointer ${
                    isSoftDeleted ? 'opacity-60 bg-gray-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Cpu size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                          <span>{dev.deviceName}</span>
                          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-gray-100 text-gray-600 rounded">
                            {dev.osVersion || 'Unknown OS'}
                          </span>
                        </div>
                        <span className="font-mono text-gray-400 text-[11px] block truncate max-w-[180px]">
                          {dev.deviceId}
                        </span>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <DeviceActionsDropdown
                        device={dev}
                        isDeleted={isSoftDeleted}
                        onViewDetails={(target) => setDetailDevice(target)}
                        onEdit={(target) => setEditDevice(target)}
                        onStatusChange={(target) => setStatusDevice(target)}
                        onRevoke={(target) => setRevokeDeviceTarget(target)}
                        onDelete={(target) => {
                          if (isSoftDeleted) {
                            setPurgeDeviceTarget(target);
                          } else {
                            setTrashDeviceTarget(target);
                          }
                        }}
                        onRestore={(target) => setRestoreDeviceTarget(target)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">
                        Operating System
                      </span>
                      <span className="font-medium text-gray-700 text-[11px] truncate block">
                        {dev.osVersion || 'Unknown OS'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">
                        App Version
                      </span>
                      <span className="font-mono text-gray-600 text-[11px] truncate block">
                        {dev.appVersion ? `v${dev.appVersion}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isOnlineNow && dev.status === 'ACTIVE'
                            ? 'bg-emerald-500 animate-ping'
                            : isWithin24h && dev.status === 'ACTIVE'
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                        }`}
                      />
                      <span className="font-medium text-gray-700">
                        {isOnlineNow && dev.status === 'ACTIVE'
                          ? 'Online Now'
                          : isWithin24h && dev.status === 'ACTIVE'
                            ? 'Active Today'
                            : 'Offline'}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(dev.lastSeenAt).toLocaleDateString(undefined, {
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
                <th className="py-3.5 px-6">Hardware Terminal</th>
                <th className="py-3.5 px-6">Hardware Fingerprint</th>
                <th className="py-3.5 px-6">Operating System</th>
                <th className="py-3.5 px-6">Last Heartbeat</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
              {isLoadingDevices ? (
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
                      <div className="w-32 h-3.5 bg-gray-200 rounded" />
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
              ) : devicesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
                        <Cpu size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">
                        No hardware terminals found
                      </h3>
                      <p className="text-xs text-gray-500">
                        {deviceSearch
                          ? `No physical machines matched "${deviceSearch}". Try another query.`
                          : 'Hardware devices will appear here once workstations register.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                devicesList.map((dev) => {
                  const lastSeenMs = nowMs - new Date(dev.lastSeenAt).getTime();
                  const isOnlineNow = lastSeenMs < 1000 * 60 * 60;
                  const isWithin24h = lastSeenMs < 1000 * 60 * 60 * 24;
                  const isSoftDeleted = Boolean(dev.deletedAt);

                  return (
                    <tr
                      key={dev.id}
                      className={`hover:bg-gray-50/60 transition-colors group cursor-pointer ${
                        isSoftDeleted ? 'opacity-60 bg-gray-50/30' : ''
                      }`}
                      onClick={() => setDetailDevice(dev)}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors shrink-0">
                            <Cpu size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                              <span>{dev.deviceName}</span>
                              {isSoftDeleted && (
                                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-gray-200 text-gray-700 rounded">
                                  In Trash
                                </span>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-1.5 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-mono text-gray-400 text-[11px] truncate max-w-[150px]">
                                {dev.deviceId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUUID(dev.deviceId)}
                                className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors cursor-pointer"
                                title="Copy Device UUID"
                              >
                                {copiedUUID === dev.deviceId ? (
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
                          {dev.hardwareFingerprint}
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="space-y-0.5">
                          <div className="text-xs text-gray-800 font-medium">
                            {dev.osVersion || 'Unknown OS'}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            App v{dev.appVersion}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isOnlineNow && dev.status === 'ACTIVE'
                                  ? 'bg-emerald-500 animate-ping'
                                  : isWithin24h && dev.status === 'ACTIVE'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300'
                              }`}
                            />
                            <span className="text-[11px] font-medium text-gray-700">
                              {isOnlineNow && dev.status === 'ACTIVE'
                                ? 'Online Now'
                                : isWithin24h && dev.status === 'ACTIVE'
                                  ? 'Active Today'
                                  : 'Offline'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(dev.lastSeenAt).toLocaleString(
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
                        {dev.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : dev.status === 'SUSPECT' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle size={10} />
                            <span>Suspect</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert size={10} />
                            <span>Revoked</span>
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DeviceActionsDropdown
                          device={dev}
                          isDeleted={isSoftDeleted}
                          onViewDetails={(target) => setDetailDevice(target)}
                          onEdit={(target) => setEditDevice(target)}
                          onStatusChange={(target) => setStatusDevice(target)}
                          onRevoke={(target) => setRevokeDeviceTarget(target)}
                          onDelete={(target) => {
                            if (isSoftDeleted) {
                              setPurgeDeviceTarget(target);
                            } else {
                              setTrashDeviceTarget(target);
                            }
                          }}
                          onRestore={(target) => setRestoreDeviceTarget(target)}
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
          page={devicePage}
          totalPages={deviceMeta.totalPages}
          totalItems={deviceMeta.total}
          pageSize={deviceLimit}
          onPageChange={(p) => setDevicePage(p)}
          itemName="terminals"
        />
      </div>

      {/* Modal Orchestrations */}
      <DeviceDetailModal
        isOpen={Boolean(detailDevice)}
        device={detailDevice}
        onClose={() => setDetailDevice(null)}
      />

      <EditDeviceModal
        isOpen={Boolean(editDevice)}
        device={editDevice}
        onClose={() => setEditDevice(null)}
      />

      <DeviceStatusModal
        isOpen={Boolean(statusDevice)}
        device={statusDevice}
        onClose={() => setStatusDevice(null)}
      />

      {/* Revoke Device Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(revokeDeviceTarget)}
        title="Revoke Workstation Terminal"
        description={`Are you sure you want to revoke and blacklist "${revokeDeviceTarget?.deviceName}" (${revokeDeviceTarget?.deviceId})? This device will be forbidden from checking in or taking student exams.`}
        confirmLabel="Revoke Device"
        variant="critical"
        confirmPhrase="REVOKE"
        isPending={revokeDeviceMutation.isPending}
        onClose={() => setRevokeDeviceTarget(null)}
        onConfirm={() => {
          if (revokeDeviceTarget) {
            revokeDeviceMutation.mutate(
              {
                id: revokeDeviceTarget.id,
                data: {
                  reason:
                    'Revoked by administrator via Device Fleet Management',
                },
              },
              { onSuccess: () => setRevokeDeviceTarget(null) },
            );
          }
        }}
      />

      {/* Soft Delete (Move to Trash) Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(trashDeviceTarget)}
        title="Move Device to Recycle Bin"
        description={`Move workstation "${trashDeviceTarget?.deviceName}" (${trashDeviceTarget?.deviceId}) to the Recycle Bin? The device can be restored later or permanently purged.`}
        confirmLabel="Move to Trash"
        variant="danger"
        isPending={softDeleteDeviceMutation.isPending}
        onClose={() => setTrashDeviceTarget(null)}
        onConfirm={() => {
          if (trashDeviceTarget) {
            softDeleteDeviceMutation.mutate(trashDeviceTarget.id, {
              onSuccess: () => setTrashDeviceTarget(null),
            });
          }
        }}
      />

      {/* Restore Device Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(restoreDeviceTarget)}
        title="Restore Workstation from Trash"
        description={`Restore workstation "${restoreDeviceTarget?.deviceName}" back to the active fleet inventory?`}
        confirmLabel="Restore Terminal"
        variant="info"
        isPending={restoreDeviceMutation.isPending}
        onClose={() => setRestoreDeviceTarget(null)}
        onConfirm={() => {
          if (restoreDeviceTarget) {
            restoreDeviceMutation.mutate(restoreDeviceTarget.id, {
              onSuccess: () => setRestoreDeviceTarget(null),
            });
          }
        }}
      />

      {/* Permanent Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(purgeDeviceTarget)}
        title="Permanently Purge Hardware Device"
        description={`CAUTION: This will permanently delete workstation "${purgeDeviceTarget?.deviceName}" (${purgeDeviceTarget?.deviceId}) and its entire hardware history from the database. This action CANNOT be undone.`}
        confirmLabel="Purge Permanently"
        variant="critical"
        confirmPhrase="DELETE"
        isPending={permanentDeleteDeviceMutation.isPending}
        onClose={() => setPurgeDeviceTarget(null)}
        onConfirm={() => {
          if (purgeDeviceTarget) {
            permanentDeleteDeviceMutation.mutate(purgeDeviceTarget.id, {
              onSuccess: () => setPurgeDeviceTarget(null),
            });
          }
        }}
      />
    </div>
  );
};

