import React, { useState, useMemo, useEffect } from 'react';
import {
  Monitor,
  Radio,
  CheckCircle2,
  PauseCircle,
  AlertOctagon,
  Search,
  RefreshCw,
  Building2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Cpu,
  Clock,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Layers,
  AlertCircle,
  Download,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
import { useAuthStore } from '@/stores/auth.store';
import {
  useActivations,
  useActivationStats,
} from '../api/activationApi';
import type { Activation, ActivationStatus } from '../api/activationApi';
import {
  useDevices,
  useDeviceStats,
  useSoftDeleteDevice,
  useRestoreDevice,
  usePermanentDeleteDevice,
  useRevokeDevice,
} from '../api/deviceApi';
import type { Device, DeviceStatus } from '../api/deviceApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { DeactivateSeatModal } from '../components/DeactivateSeatModal';
import { ReactivateSeatModal } from '../components/ReactivateSeatModal';
import { RevokeActivationModal } from '../components/RevokeActivationModal';
import { ActivationDetailModal } from '../components/ActivationDetailModal';
import { ActivationActionsDropdown } from '../components/ActivationActionsDropdown';

import { DeviceActionsDropdown } from '../components/DeviceActionsDropdown';
import { DeviceDetailModal } from '../components/DeviceDetailModal';
import { DeviceStatusModal } from '../components/DeviceStatusModal';
import { EditDeviceModal } from '../components/EditDeviceModal';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type ViewMode = 'SEATS' | 'DEVICES';
type SeatTabType = 'ALL' | 'ACTIVE' | 'RECENT_24H' | 'DEACTIVATED' | 'REVOKED';
type DeviceTabType = 'ALL' | 'ACTIVE' | 'SUSPECT' | 'REVOKED' | 'TRASH';

export const ActivationsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Primary Dual-View Switch
  const [viewMode, setViewMode] = useState<ViewMode>('SEATS');

  // Common Institution Filter (Super Admin)
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const institutions = institutionsData?.data || [];

  // ---------------------------------------------------------------------------
  // 1. SEAT ACTIVATIONS STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [seatTab, setSeatTab] = useState<SeatTabType>('ALL');
  const [seatSearch, setSeatSearch] = useState('');
  const [debouncedSeatSearch, setDebouncedSeatSearch] = useState('');
  const [seatPage, setSeatPage] = useState(1);
  const [seatLimit] = useState(10);
  const [seatSortBy, setSeatSortBy] = useState<'lastSeenAt' | 'firstActivatedAt' | 'deviceName' | 'status'>('lastSeenAt');
  const [seatSortOrder, setSeatSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSeatSearch(seatSearch);
      setSeatPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [seatSearch]);

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
  }, [seatPage, seatLimit, debouncedSeatSearch, seatTab, selectedInstitutionId, seatSortBy, seatSortOrder]);

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
  } = useActivationStats(
    selectedInstitutionId || undefined
  );

  const handleRefreshSeats = () => {
    refetchActivationStats();
    refetchActivations();
  };

  const [deactivatingActivation, setDeactivatingActivation] = useState<Activation | null>(null);
  const [reactivatingActivation, setReactivatingActivation] = useState<Activation | null>(null);
  const [revokingActivation, setRevokingActivation] = useState<Activation | null>(null);
  const [detailActivation, setDetailActivation] = useState<Activation | null>(null);

  const rawActivationsList = activationsData?.data || [];
  const seatMeta = activationsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const activationsList = useMemo(() => {
    if (seatTab === 'RECENT_24H') {
      const past24h = Date.now() - 24 * 60 * 60 * 1000;
      return rawActivationsList.filter((act) => {
        const lastSeen = new Date(act.lastSeenAt).getTime();
        return act.status === 'ACTIVE' && lastSeen >= past24h;
      });
    }
    return rawActivationsList;
  }, [rawActivationsList, seatTab]);

  // ---------------------------------------------------------------------------
  // 2. HARDWARE DEVICE FLEET STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [deviceTab, setDeviceTab] = useState<DeviceTabType>('ALL');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [debouncedDeviceSearch, setDebouncedDeviceSearch] = useState('');
  const [devicePage, setDevicePage] = useState(1);
  const [deviceLimit] = useState(10);
  const [deviceSortBy, setDeviceSortBy] = useState<'lastSeenAt' | 'deviceName' | 'createdAt' | 'status'>('lastSeenAt');
  const [deviceSortOrder, setDeviceSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDeviceSearch(deviceSearch);
      setDevicePage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [deviceSearch]);

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
  }, [devicePage, deviceLimit, debouncedDeviceSearch, deviceTab, selectedInstitutionId, deviceSortBy, deviceSortOrder]);

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
  } = useDeviceStats(
    selectedInstitutionId || undefined
  );

  const handleRefreshDevices = () => {
    refetchDeviceStats();
    refetchDevices();
  };

  // Device Mutations
  const softDeleteDeviceMutation = useSoftDeleteDevice();
  const restoreDeviceMutation = useRestoreDevice();
  const permanentDeleteDeviceMutation = usePermanentDeleteDevice();
  const revokeDeviceMutation = useRevokeDevice();

  // Device Modals
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [statusDevice, setStatusDevice] = useState<Device | null>(null);
  const [revokeDeviceTarget, setRevokeDeviceTarget] = useState<Device | null>(null);
  const [trashDeviceTarget, setTrashDeviceTarget] = useState<Device | null>(null);
  const [restoreDeviceTarget, setRestoreDeviceTarget] = useState<Device | null>(null);
  const [purgeDeviceTarget, setPurgeDeviceTarget] = useState<Device | null>(null);

  const devicesList = devicesData?.data || [];
  const deviceMeta = devicesData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Copy tracking
  const [copiedUUID, setCopiedUUID] = useState<string | null>(null);
  const handleCopyUUID = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiedUUID(uuid);
    toast.success('Device UUID copied to clipboard');
    setTimeout(() => setCopiedUUID(null), 2000);
  };

  const handleExportSeatsCsv = () => {
    if (!rawActivationsList.length) {
      toast.error('No workstation seat records available to export');
      return;
    }
    const headers = [
      'Activation ID',
      'Device Name',
      'Hardware Fingerprint',
      'License Key',
      'Institution',
      'App Version',
      'OS Version',
      'Status',
      'First Activated At',
      'Last Seen At',
    ];
    const rows = rawActivationsList.map((act) => [
      `"${act.id}"`,
      `"${act.deviceName || ''}"`,
      `"${act.hardwareFingerprint || ''}"`,
      `"${act.license?.licenseKey || act.licenseId || ''}"`,
      `"${act.institution?.name || institutions.find((i) => i.id === act.institutionId)?.name || act.institutionId || ''}"`,
      `"${act.appVersion || ''}"`,
      `"${act.osVersion || ''}"`,
      `"${act.status}"`,
      `"${act.firstActivatedAt ? new Date(act.firstActivatedAt).toISOString() : ''}"`,
      `"${act.lastSeenAt ? new Date(act.lastSeenAt).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `workstation-seats-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Workstation seat records exported to CSV');
  };

  const handleExportDevicesCsv = () => {
    if (!devicesList.length) {
      toast.error('No hardware device records available to export');
      return;
    }
    const headers = [
      'Record ID',
      'Device Name',
      'Device UUID',
      'Hardware Fingerprint',
      'Institution',
      'App Version',
      'OS Version',
      'Status',
      'First Registered At',
      'Last Ping At',
    ];
    const rows = devicesList.map((dev) => [
      `"${dev.id}"`,
      `"${dev.deviceName || ''}"`,
      `"${dev.deviceId || ''}"`,
      `"${dev.hardwareFingerprint || ''}"`,
      `"${dev.institution?.name || institutions.find((i) => i.id === dev.institutionId)?.name || dev.institutionId || ''}"`,
      `"${dev.appVersion || ''}"`,
      `"${dev.osVersion || ''}"`,
      `"${dev.status}"`,
      `"${dev.firstActivatedAt ? new Date(dev.firstActivatedAt).toISOString() : ''}"`,
      `"${dev.lastSeenAt ? new Date(dev.lastSeenAt).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `hardware-fleet-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Hardware fleet inventory exported to CSV');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header & View Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Workstation & Hardware Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#fff0eb] text-[#ff8a5c] rounded-full border border-[#ff8a5c]/20">
              {viewMode === 'SEATS' ? 'Seat Activations' : 'Physical Hardware Fleet'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time telemetry, license slot governance, and physical desktop hardware fleet inventory
          </p>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode('SEATS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'SEATS'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers size={14} className={viewMode === 'SEATS' ? 'text-[#ff8a5c]' : ''} />
            <span>License Seat Slots</span>
            {activationStats && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-gray-100 text-gray-700 rounded-full">
                {activationStats.totalActivations}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('DEVICES')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'DEVICES'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Cpu size={14} className={viewMode === 'DEVICES' ? 'text-[#ff8a5c]' : ''} />
            <span>Hardware Fleet Inventory</span>
            {deviceStats && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-gray-100 text-gray-700 rounded-full">
                {deviceStats.totalDevices}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* VIEW 1: LICENSE SEAT ACTIVATIONS                                        */}
      {/* ======================================================================= */}
      {viewMode === 'SEATS' && (
        <div className="space-y-6">
          {/* Seat Activations KPI Cards */}
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
                  {activationsError instanceof Error ? activationsError.message : 'Network error'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshSeats}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {/* Seat Activations Table Container */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setSeatTab('ALL');
                      setSeatPage(1);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                      seatTab === 'REVOKED'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Revoked
                  </button>
                </div>

                {/* Search & Selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  {isSuperAdmin && (
                    <select
                      value={selectedInstitutionId}
                      onChange={(e) => {
                        setSelectedInstitutionId(e.target.value);
                        setSeatPage(1);
                        setDevicePage(1);
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

                  <div className="relative min-w-[220px] sm:min-w-[260px]">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={seatSearch}
                      onChange={(e) => setSeatSearch(e.target.value)}
                      placeholder="Search PC name, UUID, fingerprint..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                    />
                  </div>

                  <select
                    value={seatSortBy}
                    onChange={(e) => setSeatSortBy(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  >
                    <option value="lastSeenAt">Last Heartbeat</option>
                    <option value="firstActivatedAt">First Activated</option>
                    <option value="deviceName">Station Name</option>
                    <option value="status">Status</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setSeatSortOrder(seatSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                    title={`Sort ${seatSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <ArrowUpDown size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSeatsCsv}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                    title="Export currently loaded workstations to CSV"
                  >
                    <Download size={14} className="text-gray-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshSeats}
                    disabled={isFetchingActivations}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                    title="Refresh Table & Metrics"
                  >
                    <RefreshCw
                      size={15}
                      className={isFetchingActivations ? 'animate-spin text-[#ff8a5c]' : ''}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
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
                            {seatSearch
                              ? `No workstations matched "${seatSearch}". Try another search term.`
                              : 'Desktop client activations will appear here as lab computers connect.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activationsList.map((act) => {
                      const lastSeenMs = Date.now() - new Date(act.lastSeenAt).getTime();
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
                                <div className="font-semibold text-gray-900 text-sm group-hover:text-[#ff8a5c] transition-colors flex items-center gap-2">
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
                                {new Date(act.lastSeenAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
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
            {seatMeta.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                <div>
                  Showing <span className="font-semibold text-gray-800">{(seatPage - 1) * seatLimit + 1}</span> to{' '}
                  <span className="font-semibold text-gray-800">
                    {Math.min(seatPage * seatLimit, seatMeta.total)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-800">{seatMeta.total}</span> workstations
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSeatPage((p) => Math.max(1, p - 1))}
                    disabled={seatPage <= 1}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                    Page {seatPage} of {seatMeta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSeatPage((p) => Math.min(seatMeta.totalPages, p + 1))}
                    disabled={seatPage >= seatMeta.totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* VIEW 2: PHYSICAL HARDWARE DEVICE FLEET                                  */}
      {/* ======================================================================= */}
      {viewMode === 'DEVICES' && (
        <div className="space-y-6">
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
                (deviceStats?.suspectDevices ?? 0) + (deviceStats?.revokedDevices ?? 0)
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
                  {devicesError instanceof Error ? devicesError.message : 'Network error'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshDevices}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {/* Device Fleet Table Container */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceTab('ALL');
                      setDevicePage(1);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      deviceTab === 'TRASH'
                        ? 'bg-white text-gray-800 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Trash2 size={12} />
                    <span>Recycle Bin</span>
                  </button>
                </div>

                {/* Search & Selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  {isSuperAdmin && (
                    <select
                      value={selectedInstitutionId}
                      onChange={(e) => {
                        setSelectedInstitutionId(e.target.value);
                        setDevicePage(1);
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

                  <div className="relative min-w-[220px] sm:min-w-[260px]">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      placeholder="Search device name, UUID, OS, fingerprint..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                    />
                  </div>

                  <select
                    value={deviceSortBy}
                    onChange={(e) => setDeviceSortBy(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                  >
                    <option value="lastSeenAt">Last Ping</option>
                    <option value="deviceName">Station Name</option>
                    <option value="createdAt">First Registered</option>
                    <option value="status">Status</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setDeviceSortOrder(deviceSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                    title={`Sort ${deviceSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <ArrowUpDown size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportDevicesCsv}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                    title="Export currently loaded hardware fleet to CSV"
                  >
                    <Download size={14} className="text-gray-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshDevices}
                    disabled={isFetchingDevices}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                    title="Refresh Fleet Table & Metrics"
                  >
                    <RefreshCw
                      size={15}
                      className={isFetchingDevices ? 'animate-spin text-[#ff8a5c]' : ''}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Hardware Terminal / Room</th>
                    <th className="py-3.5 px-6">Hardware Fingerprint</th>
                    <th className="py-3.5 px-6">Institution</th>
                    <th className="py-3.5 px-6">OS & App Version</th>
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
                          <div className="w-32 h-4 bg-gray-200 rounded" />
                        </td>
                        <td className="py-4 px-6">
                          <div className="w-20 h-4 bg-gray-200 rounded" />
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
                      <td colSpan={7} className="py-16 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
                            <Cpu size={24} />
                          </div>
                          <h3 className="text-sm font-bold text-gray-800">No hardware devices found</h3>
                          <p className="text-xs text-gray-500">
                            {deviceSearch
                              ? `No hardware devices matched "${deviceSearch}".`
                              : deviceTab === 'TRASH'
                              ? 'No deleted terminals in Recycle Bin.'
                              : 'Physical client PCs will register hardware fingerprints automatically upon desktop app launch.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    devicesList.map((dev) => {
                      const lastSeenMs = Date.now() - new Date(dev.lastSeenAt).getTime();
                      const isOnlineNow = lastSeenMs < 1000 * 60 * 60;
                      const isWithin24h = lastSeenMs < 1000 * 60 * 60 * 24;
                      const isSoftDeleted = !!dev.deletedAt;

                      return (
                        <tr
                          key={dev.id}
                          className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          onClick={() => setDetailDevice(dev)}
                        >
                          {/* Workstation PC & Device UUID */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-xl transition-colors shrink-0 ${
                                  isSoftDeleted
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                                }`}
                              >
                                <Cpu size={18} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm group-hover:text-[#ff8a5c] transition-colors flex items-center gap-2">
                                  <span>{dev.deviceName}</span>
                                  {isSoftDeleted && (
                                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-100 text-rose-700 rounded">
                                      TRASHED
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
                                    className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                                    title="Copy Device UUID"
                                  >
                                    {copiedUUID === dev.deviceId ? (
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
                              {dev.hardwareFingerprint}
                            </div>
                          </td>

                          {/* Institution */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-1.5 font-medium text-gray-800 text-xs">
                              <Building2 size={13} className="text-gray-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {dev.institution?.name || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* OS & App Version */}
                          <td className="py-3.5 px-6">
                            <div className="space-y-0.5">
                              <div className="font-medium text-gray-800 text-xs">{dev.osVersion || 'Unknown OS'}</div>
                              <div className="text-[10px] text-gray-400 font-mono">App v{dev.appVersion}</div>
                            </div>
                          </td>

                          {/* Last Seen Heartbeat */}
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
                                {new Date(dev.lastSeenAt).toLocaleString(undefined, {
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

                          {/* Actions */}
                          <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
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

            {/* Pagination Footer */}
            {deviceMeta.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                <div>
                  Showing <span className="font-semibold text-gray-800">{(devicePage - 1) * deviceLimit + 1}</span> to{' '}
                  <span className="font-semibold text-gray-800">
                    {Math.min(devicePage * deviceLimit, deviceMeta.total)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-800">{deviceMeta.total}</span> terminals
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDevicePage((p) => Math.max(1, p - 1))}
                    disabled={devicePage <= 1}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                    Page {devicePage} of {deviceMeta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDevicePage((p) => Math.min(deviceMeta.totalPages, p + 1))}
                    disabled={devicePage >= deviceMeta.totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL ORCHESTRATIONS (SEATS)                                            */}
      {/* ======================================================================= */}
      <DeactivateSeatModal
        isOpen={!!deactivatingActivation}
        activation={deactivatingActivation}
        onClose={() => setDeactivatingActivation(null)}
      />

      <ReactivateSeatModal
        isOpen={!!reactivatingActivation}
        activation={reactivatingActivation}
        onClose={() => setReactivatingActivation(null)}
      />

      <RevokeActivationModal
        isOpen={!!revokingActivation}
        activation={revokingActivation}
        onClose={() => setRevokingActivation(null)}
      />

      <ActivationDetailModal
        isOpen={!!detailActivation}
        activation={detailActivation}
        onClose={() => setDetailActivation(null)}
        onOpenDeactivate={(act) => setDeactivatingActivation(act)}
        onOpenReactivate={(act) => setReactivatingActivation(act)}
        onOpenRevoke={(act) => setRevokingActivation(act)}
      />

      {/* ======================================================================= */}
      {/* MODAL ORCHESTRATIONS (DEVICES)                                          */}
      {/* ======================================================================= */}
      <DeviceDetailModal
        isOpen={!!detailDevice}
        device={detailDevice}
        onClose={() => setDetailDevice(null)}
      />

      <EditDeviceModal
        isOpen={!!editDevice}
        device={editDevice}
        onClose={() => setEditDevice(null)}
      />

      <DeviceStatusModal
        isOpen={!!statusDevice}
        device={statusDevice}
        onClose={() => setStatusDevice(null)}
      />

      {/* Revoke Device Confirmation */}
      <ConfirmationModal
        isOpen={!!revokeDeviceTarget}
        title="Revoke Workstation Terminal"
        description={`Are you sure you want to revoke and blacklist "${revokeDeviceTarget?.deviceName}" (${revokeDeviceTarget?.deviceId})? This device will be forbidden from checking in or taking student exams.`}
        confirmText="Revoke Device"
        variant="critical"
        requireConfirmationText="REVOKE"
        isLoading={revokeDeviceMutation.isPending}
        onClose={() => setRevokeDeviceTarget(null)}
        onConfirm={() => {
          if (revokeDeviceTarget) {
            revokeDeviceMutation.mutate(
              { id: revokeDeviceTarget.id, data: { reason: 'Revoked by administrator via Device Fleet Management' } },
              { onSuccess: () => setRevokeDeviceTarget(null) }
            );
          }
        }}
      />

      {/* Soft Delete (Move to Trash) Confirmation */}
      <ConfirmationModal
        isOpen={!!trashDeviceTarget}
        title="Move Device to Recycle Bin"
        description={`Move workstation "${trashDeviceTarget?.deviceName}" (${trashDeviceTarget?.deviceId}) to the Recycle Bin? The device can be restored later or permanently purged.`}
        confirmText="Move to Trash"
        variant="danger"
        isLoading={softDeleteDeviceMutation.isPending}
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
      <ConfirmationModal
        isOpen={!!restoreDeviceTarget}
        title="Restore Workstation from Trash"
        description={`Restore workstation "${restoreDeviceTarget?.deviceName}" back to the active fleet inventory?`}
        confirmText="Restore Terminal"
        variant="info"
        isLoading={restoreDeviceMutation.isPending}
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
      <ConfirmationModal
        isOpen={!!purgeDeviceTarget}
        title="Permanently Purge Hardware Device"
        description={`CAUTION: This will permanently delete workstation "${purgeDeviceTarget?.deviceName}" (${purgeDeviceTarget?.deviceId}) and its entire hardware history from the database. This action CANNOT be undone.`}
        confirmText="Purge Permanently"
        variant="critical"
        requireConfirmationText="DELETE"
        isLoading={permanentDeleteDeviceMutation.isPending}
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

export default ActivationsPage;
