import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  Sliders,
  Trash2,
  RotateCcw,
  Code2,
  ArrowUpDown,
  Sparkles,
  Building2,
  Download,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import StatCard from '@/components/ui/StatCard';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { exportCsv } from '@/lib/exportCsv';
import {
  useModules,
  useModuleStats,
  useUpdateModuleStatus,
  useSoftDeleteModule,
  useRestoreModule,
  usePermanentDeleteModule,
} from '../api/moduleApi';
import type { TypingModule, ModuleStatus } from '../api/moduleApi';
import { ModuleCard } from '../components/ModuleCard';
import { CreateModuleModal } from '../components/CreateModuleModal';
import { EditModuleModal } from '../components/EditModuleModal';
import { ModuleDetailModal } from '../components/ModuleDetailModal';
import { ConfigureTenantModuleModal } from '../components/ConfigureTenantModuleModal';
import { ModuleActionsDropdown } from '../components/ModuleActionsDropdown';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/Modal';

type ModuleTab = 'ACTIVE' | 'INACTIVE' | 'ALL' | 'TRASH';
type ViewMode = 'CARDS' | 'TABLE';

export const ModulesPage: React.FC = () => {
  const { isSuperAdmin, isSupport } = usePermissions();
  // State
  const [activeTab, setActiveTab] = useState<ModuleTab>('ACTIVE');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'key' | 'version'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TypingModule | null>(null);
  const [inspectingModule, setInspectingModule] = useState<TypingModule | null>(null);
  const [overridingModule, setOverridingModule] = useState<TypingModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<TypingModule | null>(null);
  const [moduleToRestore, setModuleToRestore] = useState<TypingModule | null>(null);
  const [moduleToPurge, setModuleToPurge] = useState<TypingModule | null>(null);

  // Reset to the first page whenever the committed (debounced) search changes
  useOnDepChange(debouncedSearch, () => setPage(1));

  // Query Params
  const queryParams = useMemo(() => {
    let statusFilter: ModuleStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'INACTIVE') {
      statusFilter = 'INACTIVE';
    } else if (activeTab === 'TRASH') {
      includeDeleted = true;
    }

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter,
      includeDeleted,
      sortBy,
      sortOrder,
    };
  }, [page, limit, debouncedSearch, activeTab, sortBy, sortOrder]);

  // Queries
  const {
    data: modulesResponse,
    isLoading: isLoadingModules,
    isFetching: isFetchingModules,
    isError: isModulesError,
    error: modulesError,
    refetch: refetchModules,
  } = useModules(queryParams);

  const {
    data: moduleStats,
    isLoading: isLoadingStats,
    refetch: refetchModuleStats,
  } = useModuleStats();

  const handleRefreshAll = () => {
    refetchModuleStats();
    refetchModules();
  };

  // Mutations
  const updateStatusMutation = useUpdateModuleStatus();
  const softDeleteMutation = useSoftDeleteModule();
  const restoreMutation = useRestoreModule();
  const permanentDeleteMutation = usePermanentDeleteModule();

  const modules = modulesResponse?.data || [];
  const meta = modulesResponse?.meta;

  const handleExportCsv = () => {
    if (!modules.length) {
      toast.error('No typing modules available to export');
      return;
    }
    exportCsv(
      `typing-modules-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Module ID', accessor: 'id' },
        { header: 'Key Identifier', accessor: 'key' },
        { header: 'Module Name', accessor: 'name' },
        { header: 'Description', accessor: (mod) => mod.description || '' },
        { header: 'Engine Version', accessor: 'version' },
        { header: 'Status', accessor: 'status' },
        { header: 'Created At', accessor: (mod) => new Date(mod.createdAt).toISOString() },
        { header: 'Updated At', accessor: (mod) => new Date(mod.updatedAt).toISOString() },
      ],
      modules,
    );
    toast.success('Typing modules exported to CSV');
  };

  // Handlers
  const handleToggleStatus = (module: TypingModule) => {
    const newStatus: ModuleStatus = module.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateStatusMutation.mutate({
      id: module.id,
      data: { status: newStatus },
    });
  };

  const handleConfirmSoftDelete = async () => {
    if (!moduleToDelete) return;
    try {
      await softDeleteMutation.mutateAsync(moduleToDelete.id);
      setModuleToDelete(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmRestore = async () => {
    if (!moduleToRestore) return;
    try {
      await restoreMutation.mutateAsync(moduleToRestore.id);
      setModuleToRestore(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmPermanentPurge = async () => {
    if (!moduleToPurge) return;
    try {
      await permanentDeleteMutation.mutateAsync(moduleToPurge.id);
      setModuleToPurge(null);
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Typing Modules & Engines"
        subtitle="Configure core educational modules, multi-font keyboards, exam engines, and institution-level overrides"
        icon={<Layers className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Export modules list to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingModules}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Refresh Modules & Statistics"
            >
              <RefreshCw size={14} className={isFetchingModules ? 'animate-spin text-primary' : ''} />
              Refresh
            </button>

            {!isSuperAdmin ? (
              <div
                title="Typing modules are core system engines centrally managed by Super Admin. Read-only for school administrators."
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} />
                <span>Register Module (Locked)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm hover:shadow"
              >
                <Plus size={16} strokeWidth={2.5} />
                Register Module
              </button>
            )}
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Modules"
          value={moduleStats?.totalModules || 0}
          type="blue"
          icon={<Layers size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="All registered engines"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          active={activeTab === 'ALL'}
        />
        <StatCard
          title="Active Engines"
          value={moduleStats?.activeModules || 0}
          type="emerald"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Operational student modules"
          onClick={() => {
            setActiveTab('ACTIVE');
            setPage(1);
          }}
          active={activeTab === 'ACTIVE'}
        />
        <StatCard
          title="Inactive Modules"
          value={moduleStats?.inactiveModules || 0}
          type="coral"
          icon={<XCircle size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Disabled in client"
          onClick={() => {
            setActiveTab('INACTIVE');
            setPage(1);
          }}
          active={activeTab === 'INACTIVE'}
        />
        <StatCard
          title="Tenant Overrides"
          value={moduleStats?.totalInstitutionOverrides || 0}
          type="orange"
          icon={<Building2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Custom lab configurations"
        />
      </div>

      {/* Error Alert Banner with Retry */}
      {isModulesError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to load typing modules:{' '}
              {modulesError instanceof Error ? modulesError.message : 'Network error'}
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar border-b border-gray-200/80 pb-3">
        {[
          { id: 'ACTIVE', label: 'Active Modules', count: moduleStats?.activeModules },
          { id: 'INACTIVE', label: 'Inactive', count: moduleStats?.inactiveModules },
          { id: 'ALL', label: 'All Modules', count: moduleStats?.totalModules },
          { id: 'TRASH', label: 'Recycle Bin' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as ModuleTab);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary shadow-2xs'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search modules by name, key, description... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeChips={[
          ...(sortBy !== 'createdAt' || sortOrder !== 'desc'
            ? [
                {
                  id: 'sort',
                  label: 'Sort',
                  value: `${sortBy} (${sortOrder.toUpperCase()})`,
                  onRemove: () => {
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(searchTerm || sortBy !== 'createdAt' || sortOrder !== 'desc')}
        onClearFilters={() => {
          setSearchTerm('');
          setSortBy('createdAt');
          setSortOrder('desc');
        }}
        totalResults={modules.length}
        totalLabel="Typing Modules"
        filterElements={
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <FilterSelect
              icon={<ArrowUpDown size={13} />}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort by Column"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Module Name</option>
              <option value="key">Key Slug</option>
              <option value="version">Version</option>
            </FilterSelect>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-[38px] px-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-xs shrink-0 shadow-2xs transition-colors"
              title={`Sort ${sortOrder.toUpperCase()}`}
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        }
      />

      {/* Module Content */}
      {isLoadingModules ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-60 rounded-2xl bg-white border border-gray-200 p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
              <div className="h-8 bg-gray-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary flex items-center justify-center mb-3">
            <Layers size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Typing Modules Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
            {debouncedSearch
              ? `No modules matched your search filter "${debouncedSearch}".`
              : activeTab === 'TRASH'
              ? 'The recycle bin is currently empty.'
              : 'Register typing module capabilities to enable specialized typing engines and exam simulators.'}
          </p>
          {activeTab !== 'TRASH' &&
            (isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm"
              >
                <Plus size={15} strokeWidth={2.5} />
                Register First Typing Module
              </button>
            ) : (
              <p className="text-xs text-gray-400">
                Module registration is restricted to Super Admins.
              </p>
            ))}
        </div>
      ) : viewMode === 'CARDS' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onEdit={(m: TypingModule) => setEditingModule(m)}
              onToggleStatus={handleToggleStatus}
              onViewDetails={(m: TypingModule) => setInspectingModule(m)}
              onConfigureOverride={(m: TypingModule) => setOverridingModule(m)}
              onDelete={(m: TypingModule) => {
                if (activeTab === 'TRASH') {
                  setModuleToPurge(m);
                } else {
                  setModuleToDelete(m);
                }
              }}
              onRestore={activeTab === 'TRASH' ? (m: TypingModule) => setModuleToRestore(m) : undefined}
              isDeletedView={activeTab === 'TRASH'}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW WITH MOBILE DUAL-MODE */
        <div>
          <div className="md:hidden grid grid-cols-1 gap-4 mb-4">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onEdit={(m: TypingModule) => setEditingModule(m)}
                onToggleStatus={handleToggleStatus}
                onViewDetails={(m: TypingModule) => setInspectingModule(m)}
                onConfigureOverride={(m: TypingModule) => setOverridingModule(m)}
                onDelete={(m: TypingModule) => {
                  if (activeTab === 'TRASH') {
                    setModuleToPurge(m);
                  } else {
                    setModuleToDelete(m);
                  }
                }}
                onRestore={activeTab === 'TRASH' ? (m: TypingModule) => setModuleToRestore(m) : undefined}
                isDeletedView={activeTab === 'TRASH'}
              />
            ))}
          </div>
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Module Name & Key</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Config Parameters</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {modules.map((mod) => {
                  const configKeys = Object.keys(mod.configuration || {});

                  return (
                    <tr key={mod.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary flex items-center justify-center shrink-0">
                            <Layers size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{mod.name}</span>
                            <span className="font-mono text-[11px] text-gray-400">{mod.key}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-gray-600 line-clamp-1">
                          {mod.description || '—'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                          v{mod.version}.0
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Code2 size={13} className="text-gray-400" />
                          {configKeys.length} settings
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={mod.deletedAt ? 'TRASH' : mod.status}
                          size="sm"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <ModuleActionsDropdown
                          module={mod}
                          onViewDetails={(m) => setInspectingModule(m)}
                          onEdit={(m) => setEditingModule(m)}
                          onToggleStatus={handleToggleStatus}
                          onConfigureOverride={(m) => setOverridingModule(m)}
                          onDelete={(m) => {
                            if (activeTab === 'TRASH') {
                              setModuleToPurge(m);
                            } else {
                              setModuleToDelete(m);
                            }
                          }}
                          onRestore={activeTab === 'TRASH' ? (m) => setModuleToRestore(m) : undefined}
                          isDeletedView={activeTab === 'TRASH'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        page={page}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total || 0}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        itemName="modules"
      />

      {/* Modals */}
      <CreateModuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditModuleModal
        isOpen={!!editingModule}
        module={editingModule}
        onClose={() => setEditingModule(null)}
      />

      <ModuleDetailModal
        isOpen={!!inspectingModule}
        module={inspectingModule}
        onClose={() => setInspectingModule(null)}
      />

      <ConfigureTenantModuleModal
        isOpen={!!overridingModule}
        modules={modules}
        preselectedModule={overridingModule}
        onClose={() => setOverridingModule(null)}
      />

      {/* Confirmation: Soft Delete */}
      <ConfirmDialog
        isOpen={!!moduleToDelete}
        title="Move Module to Trash?"
        description={`Are you sure you want to move module "${moduleToDelete?.name}" (${moduleToDelete?.key}) to trash? Any associated typing content will remain intact.`}
        confirmLabel="Move to Trash"
        variant="warning"
        isPending={softDeleteMutation.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setModuleToDelete(null)}
      />

      {/* Confirmation: Restore */}
      <ConfirmDialog
        isOpen={!!moduleToRestore}
        title="Restore Typing Module?"
        description={`Do you want to restore module "${moduleToRestore?.name}" back to active status?`}
        confirmLabel="Restore Module"
        variant="info"
        isPending={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setModuleToRestore(null)}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmDialog
        isOpen={!!moduleToPurge}
        title="Permanently Purge Module?"
        description={`WARNING: This action is destructive and irreversible. Module "${moduleToPurge?.name}" (${moduleToPurge?.id}) will be permanently deleted from the database.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase="DELETE"
        isPending={permanentDeleteMutation.isPending}
        onConfirm={handleConfirmPermanentPurge}
        onClose={() => setModuleToPurge(null)}
      />
    </div>
  );
};

export default ModulesPage;

