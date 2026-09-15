import React, { useState } from 'react';
import {
  RefreshCw,
  Play,
  Trash2,
  Download,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import { useSyncOperations, useSyncStats } from '../api/syncApi';
import type { SyncOperation } from '../api/syncApi';
import { SyncOperationDetailModal } from '../components/SyncOperationDetailModal';
import { SyncDiagnosticSimulatorModal } from '../components/SyncDiagnosticSimulatorModal';
import { SyncCleanupModal } from '../components/SyncCleanupModal';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { exportCsv } from '@/lib/exportCsv';
import { SyncStatsCards } from '../components/SyncStatsCards';
import { SyncTableView } from '../components/SyncTableView';
import { SyncCard } from '../components/SyncCard';

export const SyncPage: React.FC = () => {
  const { isSuperAdmin } = usePermissions();

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedOperation, setSelectedOperation] = useState<string>('ALL');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('ALL');
  const [sortBy] = useState<'processedAt' | 'deviceId' | 'entityType'>('processedAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [refreshInterval, setRefreshInterval] = useState<number | false>(15000); // 15s default

  // Modals
  const [inspectingOp, setInspectingOp] = useState<SyncOperation | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useOnDepChange(debouncedSearch, () => setPage(1));

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
    exportCsv(
      `workstation-sync-logs-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Sync ID', accessor: 'id' },
        { header: 'Idempotency Key', accessor: 'idempotencyKey' },
        { header: 'Device ID', accessor: 'deviceId' },
        { header: 'Entity Type', accessor: 'entityType' },
        { header: 'Entity ID', accessor: 'entityId' },
        { header: 'Operation', accessor: 'operation' },
        {
          header: 'Institution',
          accessor: (op) =>
            op.institution?.name || institutions.find((i) => i.id === op.institutionId)?.name || op.institutionId,
        },
        { header: 'Processed At', accessor: (op) => new Date(op.processedAt).toISOString() },
      ],
      operations,
    );
    toast.success('Sync operations exported to CSV');
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Offline Sync Ingest Engine"
        subtitle="Forensic telemetry for local-first SQLite delta reconciliations, idempotency, and offline synchronization"
        icon={<RefreshCw className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Export sync mutations to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
                title="Simulate workstation sync handshake"
              >
                <Play size={14} className="text-emerald-600" />
                Sync Simulator
              </button>
            )}

            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCleanupOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs"
                title="Purge obsolete sync history"
              >
                <Trash2 size={14} />
                Prune Logs
              </button>
            ) : (
              <div
                title="Sync maintenance is restricted to Super Admin."
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={14} />
                <span>Prune Logs</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRefreshAll}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white shadow-2xs"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </>
        }
      />

      {/* Metric Stat Cards */}
      <SyncStatsCards stats={stats} isLoadingStats={isLoadingStats} />

      {/* Error Alert Banner with Retry */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to load sync telemetry: {error instanceof Error ? error.message : 'Network error'}
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

      {/* Filter & Search Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by Device ID or Idempotency Key... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeChips={[
          ...(selectedEntityType !== 'ALL'
            ? [
                {
                  id: 'entity',
                  label: 'Entity',
                  value: selectedEntityType,
                  onRemove: () => setSelectedEntityType('ALL'),
                },
              ]
            : []),
          ...(selectedOperation !== 'ALL'
            ? [
                {
                  id: 'operation',
                  label: 'Op',
                  value: selectedOperation,
                  onRemove: () => setSelectedOperation('ALL'),
                },
              ]
            : []),
          ...(selectedInstitutionId !== 'ALL'
            ? [
                {
                  id: 'inst',
                  label: 'Center',
                  value: institutions.find((i) => i.id === selectedInstitutionId)?.name || selectedInstitutionId,
                  onRemove: () => setSelectedInstitutionId('ALL'),
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          searchTerm ||
            selectedEntityType !== 'ALL' ||
            selectedOperation !== 'ALL' ||
            selectedInstitutionId !== 'ALL'
        )}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedEntityType('ALL');
          setSelectedOperation('ALL');
          setSelectedInstitutionId('ALL');
          setPage(1);
        }}
        totalResults={meta.total}
        totalLabel="Mutations"
        filterElements={
          <>
            {/* Live Polling Interval */}
            <FilterSelect
              value={refreshInterval === false ? 'OFF' : String(refreshInterval)}
              onChange={(e) => {
                const val = e.target.value;
                setRefreshInterval(val === 'OFF' ? false : Number(val));
              }}
              title="Live Polling Refresh Interval"
            >
              <option value="5000">Poll: 5s (Live)</option>
              <option value="15000">Poll: 15s (Default)</option>
              <option value="30000">Poll: 30s</option>
              <option value="OFF">Polling Paused</option>
            </FilterSelect>

            {/* Entity Filter */}
            <FilterSelect
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(1);
              }}
              title="Filter by Entity Type"
            >
              <option value="ALL">All Entity Types</option>
              <option value="DEVICE_ACTIVITY">DEVICE_ACTIVITY</option>
              <option value="INSTITUTION_OVERRIDE">INSTITUTION_OVERRIDE</option>
              <option value="CONTENT_METADATA">CONTENT_METADATA</option>
            </FilterSelect>

            {/* Operation Filter */}
            <FilterSelect
              value={selectedOperation}
              onChange={(e) => {
                setSelectedOperation(e.target.value);
                setPage(1);
              }}
              title="Filter by Mutation Type"
            >
              <option value="ALL">All Operations</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </FilterSelect>

            {/* Institution Filter (Super Admin only) */}
            {isSuperAdmin && (
              <FilterSelect
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
              <SyncCard
                key={op.id}
                operation={op}
                copiedId={copiedId}
                isCardsGrid={viewMode === 'CARDS'}
                onCopy={handleCopy}
                onInspect={(target) => setInspectingOp(target)}
              />
            ))}
          </div>

          {/* Desktop Table (>= md screens, hidden when in CARDS view) */}
          {viewMode !== 'CARDS' && (
            <SyncTableView
              operations={operations}
              copiedId={copiedId}
              onCopy={handleCopy}
              onInspect={(op) => setInspectingOp(op)}
            />
          )}
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
