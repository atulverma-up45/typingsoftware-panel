import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Activity,
  Laptop,
  Layers,
  Search,
  Sliders,
  Play,
  Trash2,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Check,
  Lock,
  Download,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
import { useSyncOperations, useSyncStats } from '../api/syncApi';
import type { SyncOperation } from '../api/syncApi';
import { SyncOperationDetailModal } from '../components/SyncOperationDetailModal';
import { SyncDiagnosticSimulatorModal } from '../components/SyncDiagnosticSimulatorModal';
import { SyncCleanupModal } from '../components/SyncCleanupModal';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export const SyncPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedOperation, setSelectedOperation] = useState<string>('ALL');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'processedAt' | 'deviceId' | 'entityType'>('processedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [refreshInterval, setRefreshInterval] = useState<number | false>(15000); // 15s default

  // Modals
  const [inspectingOp, setInspectingOp] = useState<SyncOperation | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const institutions = institutionsData?.data || [];

  const queryParams = {
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    entityType: selectedEntityType !== 'ALL' ? selectedEntityType : undefined,
    operation: selectedOperation !== 'ALL' ? selectedOperation : undefined,
    institutionId:
      isSuperAdmin && selectedInstitutionId !== 'ALL' ? selectedInstitutionId : undefined,
    sortBy,
    sortOrder,
  };

  const {
    data: syncsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSyncOperations(queryParams, refreshInterval);
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useSyncStats(refreshInterval);

  const handleRefreshAll = () => {
    refetchStats();
    refetch();
  };

  const operations = syncsData?.data || [];
  const meta = syncsData?.meta || { page: 1, limit: 15, total: 0, totalPages: 1 };
  const stats = statsData || {
    totalSyncOperations: 0,
    syncsLast24Hours: 0,
    distinctDevicesSynced: 0,
  };

  const handleExportCsv = () => {
    if (!operations.length) {
      toast.error('No sync operations to export');
      return;
    }
    const headers = [
      'Sync ID',
      'Idempotency Key',
      'Device ID',
      'Entity Type',
      'Entity ID',
      'Operation',
      'Institution',
      'Processed At',
    ];
    const rows = operations.map((op) => [
      `"${op.id}"`,
      `"${op.idempotencyKey}"`,
      `"${op.deviceId}"`,
      `"${op.entityType}"`,
      `"${op.entityId}"`,
      `"${op.operation}"`,
      `"${op.institution?.name || institutions.find((i) => i.id === op.institutionId)?.name || op.institutionId}"`,
      `"${new Date(op.processedAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `workstation-sync-logs-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sync operations exported to CSV');
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOperationBadge = (op: string) => {
    switch (op) {
      case 'CREATE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            DELETE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
            {op}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <RefreshCw className="text-[#ff8a5c]" size={28} />
            Workstation Sync Logs & Telemetry
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time audit log of offline terminal delta syncs, outbox processing, and idempotent records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            title="Export sync log records to CSV"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsCleanupOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
            >
              <Trash2 size={15} />
              Prune Stale Logs
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] shadow-xs transition-colors"
          >
            <Play size={15} />
            Simulate Terminal Sync
          </button>
        </div>
      </div>

      {/* KPI Telemetry Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Sync Operations"
          value={stats.totalSyncOperations.toLocaleString()}
          type="blue"
          icon={<RefreshCw size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Recorded idempotency records"
        />
        <StatCard
          title="Active In Last 24 Hours"
          value={stats.syncsLast24Hours.toLocaleString()}
          type="emerald"
          icon={<Activity size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Recent delta sync activity"
        />
        <StatCard
          title="Distinct Workstations"
          value={stats.distinctDevicesSynced.toLocaleString()}
          type="orange"
          icon={<Laptop size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Unique hardware terminals synced"
        />
      </div>

      {/* Error Alert Banner with Retry */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to synchronize workstation telemetry logs:{' '}
              {error instanceof Error ? error.message : 'Network error'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Privacy Guarantee Alert */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-900">
        <Lock size={18} className="text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold">Student Privacy Enforced by Architecture:</span> Student profiles, practice records, and test scoring data remain strictly on local workstation storage and are never uploaded or synced to the cloud database. Only operational activity and configuration changes are recorded.
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search device ID, idempotency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
            />
          </div>

          {/* Entity Type Filter */}
          <select
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
          >
            <option value="ALL">All Entity Types</option>
            <option value="DEVICE_ACTIVITY">Device Activity</option>
            <option value="LOCAL_SETTING">Local Setting</option>
          </select>

          {/* Operation Filter */}
          <select
            value={selectedOperation}
            onChange={(e) => {
              setSelectedOperation(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
          >
            <option value="ALL">All Operations</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Institution Filter (Super Admin) */}
          {isSuperAdmin && (
            <select
              value={selectedInstitutionId}
              onChange={(e) => {
                setSelectedInstitutionId(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c] max-w-[180px]"
            >
              <option value="ALL">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Live Polling Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>Auto-poll:</span>
            <select
              value={refreshInterval === false ? 'off' : refreshInterval.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setRefreshInterval(val === 'off' ? false : parseInt(val, 10));
              }}
              className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-gray-50"
            >
              <option value="off">Manual</option>
              <option value="10000">10s</option>
              <option value="15000">15s</option>
              <option value="30000">30s</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center animate-pulse">
          <div className="h-6 bg-gray-200 rounded-md w-1/4 mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded-md w-1/2 mx-auto" />
        </div>
      ) : operations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
            <RefreshCw size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Sync Operations Recorded</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {searchTerm || selectedEntityType !== 'ALL' || selectedOperation !== 'ALL'
              ? 'No sync operations match your applied filter parameters.'
              : 'Workstations will appear here as they connect and perform delta synchronization.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-4">Institution Scope</th>
                  <th className="py-3 px-4">Processed Timestamp</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {operations.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Device ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Laptop size={15} className="text-gray-400 shrink-0" />
                        <span className="font-mono font-semibold text-gray-800">
                          {op.deviceId}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(`dev_${op.id}`, op.deviceId, e)}
                          className="text-gray-400 hover:text-[#ff8a5c]"
                          title="Copy Device ID"
                        >
                          {copiedId === `dev_${op.id}` ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Entity Type */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        {op.entityType === 'DEVICE_ACTIVITY' ? (
                          <Activity size={13} className="text-[#ff8a5c]" />
                        ) : (
                          <Sliders size={13} className="text-purple-500" />
                        )}
                        <span>{op.entityType}</span>
                      </div>
                    </td>

                    {/* Operation */}
                    <td className="py-3 px-4">{getOperationBadge(op.operation)}</td>

                    {/* Idempotency Key */}
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500 max-w-[180px] truncate">
                      <div className="flex items-center gap-1">
                        <span className="truncate">{op.idempotencyKey}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(`key_${op.id}`, op.idempotencyKey, e)}
                          className="text-gray-400 hover:text-[#ff8a5c] shrink-0"
                          title="Copy Idempotency Key"
                        >
                          {copiedId === `key_${op.id}` ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="py-3 px-4 text-gray-600">
                      {op.institution ? (
                        <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                          <Building2 size={13} className="text-blue-500 shrink-0" />
                          <span className="truncate font-medium">{op.institution.name}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-gray-400">
                          {op.institutionId}
                        </span>
                      )}
                    </td>

                    {/* Processed Timestamp */}
                    <td className="py-3 px-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400 shrink-0" />
                        <span>{new Date(op.processedAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingOp(op)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="View sync record forensics"
                      >
                        <Eye size={13} />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(page * limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{meta.total}</span> sync records
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2 text-gray-700">
              Page {page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <SyncOperationDetailModal
        isOpen={!!inspectingOp}
        onClose={() => setInspectingOp(null)}
        operation={inspectingOp}
      />

      <SyncDiagnosticSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      <SyncCleanupModal
        isOpen={isCleanupOpen}
        onClose={() => setIsCleanupOpen(false)}
      />
    </div>
  );
};
export default SyncPage;

