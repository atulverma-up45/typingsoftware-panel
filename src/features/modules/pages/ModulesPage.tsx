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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Building2,
  Download,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
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
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type ModuleTab = 'ACTIVE' | 'INACTIVE' | 'ALL' | 'TRASH';
type ViewMode = 'CARDS' | 'TABLE';

export const ModulesPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<ModuleTab>('ACTIVE');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    const headers = [
      'Module ID',
      'Key Identifier',
      'Module Name',
      'Description',
      'Engine Version',
      'Status',
      'Created At',
      'Updated At',
    ];
    const rows = modules.map((mod) => [
      `"${mod.id}"`,
      `"${mod.key}"`,
      `"${mod.name}"`,
      `"${(mod.description || '').replace(/"/g, '""')}"`,
      `"${mod.version}"`,
      `"${mod.status}"`,
      `"${new Date(mod.createdAt).toISOString()}"`,
      `"${new Date(mod.updatedAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `typing-modules-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Layers size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Typing Modules & Engines
              </h1>
              <p className="text-xs text-gray-500">
                Configure core educational modules, multi-font keyboards, exam engines, and institution-level overrides
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            <RefreshCw size={14} className={isFetchingModules ? 'animate-spin text-[#ff8a5c]' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm hover:shadow"
          >
            <Plus size={16} strokeWidth={2.5} />
            Register Module
          </button>
        </div>
      </div>

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

      {/* Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
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
                  ? 'bg-[#fff0eb] text-[#ff8a5c] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-[#ff8a5c] text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View Mode & Sizing */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-white text-[#ff8a5c] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-white text-[#ff8a5c] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search modules by name, key, description..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ArrowUpDown size={14} className="text-gray-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Module Name</option>
              <option value="key">Key Slug</option>
              <option value="version">Version</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold text-xs"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

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
          <div className="w-14 h-14 rounded-2xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center mb-3">
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
          {activeTab !== 'TRASH' && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              Register First Typing Module
            </button>
          )}
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
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
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
                          <div className="w-8 h-8 rounded-lg bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
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
                        {mod.deletedAt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            In Trash
                          </span>
                        ) : mod.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Inactive
                          </span>
                        )}
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
      )}

      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200/80 pt-4 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">{(meta.page - 1) * meta.limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(meta.page * meta.limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{meta.total}</span> modules
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-semibold text-gray-800">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

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
      <ConfirmationModal
        isOpen={!!moduleToDelete}
        title="Move Module to Trash?"
        description={`Are you sure you want to move module "${moduleToDelete?.name}" (${moduleToDelete?.key}) to trash? Any associated typing content will remain intact.`}
        confirmText="Move to Trash"
        variant="warning"
        isLoading={softDeleteMutation.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setModuleToDelete(null)}
      />

      {/* Confirmation: Restore */}
      <ConfirmationModal
        isOpen={!!moduleToRestore}
        title="Restore Typing Module?"
        description={`Do you want to restore module "${moduleToRestore?.name}" back to active status?`}
        confirmText="Restore Module"
        variant="info"
        isLoading={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setModuleToRestore(null)}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmationModal
        isOpen={!!moduleToPurge}
        title="Permanently Purge Module?"
        description={`WARNING: This action is destructive and irreversible. Module "${moduleToPurge?.name}" (${moduleToPurge?.id}) will be permanently deleted from the database.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText="DELETE"
        isLoading={permanentDeleteMutation.isPending}
        onConfirm={handleConfirmPermanentPurge}
        onClose={() => setModuleToPurge(null)}
      />
    </div>
  );
};

export default ModulesPage;

