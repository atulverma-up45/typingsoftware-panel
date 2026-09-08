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
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';

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
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
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
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Top Header */}
      <PageHeader
        title="Workstation Sync Logs & Telemetry"
        subtitle="Real-time audit log of offline terminal delta syncs, outbox processing, and idempotent records"
        icon={<RefreshCw size={20} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs min-h-[38px]"
              title="Export sync log records to CSV"
            >
              <Download size={14} className="text-gray-500" />
              <span>Export CSV</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCleanupOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs min-h-[38px]"
              >
                <Trash2 size={14} />
                <span>Prune Logs</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] shadow-2xs transition-colors min-h-[38px]"
            >
              <Play size={15} />
              <span>Simulate Sync</span>
            </button>
          </>
        }
      />

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
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search device ID, idempotency... (Press / to focus)"
        activeChips={[
          ...(selectedEntityType !== 'ALL'
            ? [
                {
                  id: 'entityType',
                  label: 'Entity',
                  value: selectedEntityType,
                  onRemove: () => {
                    setSelectedEntityType('ALL');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedOperation !== 'ALL'
            ? [
                {
                  id: 'operation',
                  label: 'Operation',
                  value: selectedOperation,
                  onRemove: () => {
                    setSelectedOperation('ALL');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedInstitutionId !== 'ALL'
            ? [
                {
                  id: 'institution',
                  label: 'Institution',
                  value:
                    institutions.find((i) => i.id === selectedInstitutionId)?.name ||
                    selectedInstitutionId,
                  onRemove: () => {
                    setSelectedInstitutionId('ALL');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          selectedEntityType !== 'ALL' ||
            selectedOperation !== 'ALL' ||
            selectedInstitutionId !== 'ALL' ||
            searchTerm
        )}
        onClearFilters={() => {
          setSelectedEntityType('ALL');
          setSelectedOperation('ALL');
          setSelectedInstitutionId('ALL');
          setSearchTerm('');
          setPage(1);
        }}
        totalResults={meta.total}
        totalLabel="Telemetry operations"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className="hidden sm:inline font-medium">Poll:</span>
              <FilterSelect
                value={refreshInterval === false ? 'off' : refreshInterval.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setRefreshInterval(val === 'off' ? false : parseInt(val, 10));
                }}
                className="text-xs"
                title="Telemetry auto-polling frequency"
              >
                <option value="off">Manual</option>
                <option value="10000">10s Auto</option>
                <option value="15000">15s Auto</option>
                <option value="30000">30s Auto</option>
              </FilterSelect>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="h-[38px] px-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 shrink-0 shadow-2xs"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#ff8a5c]' : ''} />
            </button>
          </div>
        }
        filterElements={
          <>
            {/* Entity Type Filter */}
            <FilterSelect
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(1);
              }}
              title="Filter by Entity Type"
            >
              <option value="ALL">All Entity Types</option>
              <option value="DEVICE_ACTIVITY">Device Activity</option>
              <option value="LOCAL_SETTING">Local Setting</option>
            </FilterSelect>

            {/* Operation Filter */}
            <FilterSelect
              value={selectedOperation}
              onChange={(e) => {
                setSelectedOperation(e.target.value);
                setPage(1);
              }}
              title="Filter by Operation"
            >
              <option value="ALL">All Operations</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </FilterSelect>

            {/* Institution Filter (Super Admin) */}
            {isSuperAdmin && (
              <FilterSelect
                icon={<Building2 size={13} />}
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setPage(1);
                }}
                title="Filter by Institution"
              >
                <option value="ALL">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </FilterSelect>
            )}
          </>
        }
      />

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
        <div>
          {/* Mobile Card List (< md screens, or when CARDS view is active) */}
          <div className={viewMode === 'CARDS' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5' : 'md:hidden divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'}>
            {operations.map((op) => (
              <div
                key={op.id}
                onClick={() => setInspectingOp(op)}
                className={`p-4 space-y-2.5 hover:bg-gray-50/70 transition-colors cursor-pointer ${viewMode === 'CARDS' ? 'bg-white rounded-2xl border border-gray-200 shadow-2xs' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Laptop size={16} className="text-[#ff8a5c] shrink-0" />
                    <span className="font-mono font-bold text-gray-900 text-xs truncate">{op.deviceId}</span>
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
                  {getOperationBadge(op.operation)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Entity</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {op.entityType === 'DEVICE_ACTIVITY' ? (
                        <Activity size={12} className="text-[#ff8a5c]" />
                      ) : (
                        <Sliders size={12} className="text-purple-500" />
                      )}
                      <span className="font-semibold text-gray-800 text-[11px] truncate block">{op.entityType}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Institution</span>
                    <span className="text-gray-700 text-[11px] truncate block mt-0.5">{op.institution?.name || op.institutionId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar size={12} />
                    <span>{new Date(op.processedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingOp(op);
                    }}
                    className="text-[#ff8a5c] font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <Eye size={12} /> Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md screens, hidden when in CARDS view) */}
          <div className={viewMode === 'CARDS' ? 'hidden' : 'hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'}>
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
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        itemName="sync records"
      />

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

