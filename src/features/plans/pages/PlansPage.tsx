import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  CheckCircle2,
  Archive,
  Trash2,
  RotateCcw,
  IndianRupee,
  Laptop,
  Clock,
  ArrowUpDown,
  Sparkles,
  Filter,
  Download,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import StatCard from '@/components/ui/StatCard';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import {
  usePlans,
  usePlanStats,
  useCreatePlan,
  useUpdatePlanStatus,
  useSoftDeletePlan,
  useRestorePlan,
  usePermanentDeletePlan,
} from '../api/planApi';
import type { Plan, PlanStatus } from '../api/planApi';
import { PlanCard } from '../components/PlanCard';
import { CreatePlanModal } from '../components/CreatePlanModal';
import { EditPlanModal } from '../components/EditPlanModal';
import { PlanDetailModal } from '../components/PlanDetailModal';
import { PlanActionsDropdown } from '../components/PlanActionsDropdown';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/Modal';

type PlanTab = 'ACTIVE' | 'ARCHIVED' | 'ALL' | 'TRASH';
type ViewMode = 'CARDS' | 'TABLE';

export const PlansPage: React.FC = () => {
  const { isSuperAdmin } = usePermissions();
  // State
  const [activeTab, setActiveTab] = useState<PlanTab>('ACTIVE');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'price' | 'maxActivations' | 'durationDays'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [inspectingPlan, setInspectingPlan] = useState<Plan | null>(null);
  const [planToArchive, setPlanToArchive] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [planToRestore, setPlanToRestore] = useState<Plan | null>(null);
  const [planToPurge, setPlanToPurge] = useState<Plan | null>(null);

  // Reset to the first page whenever the committed (debounced) search changes
  useOnDepChange(debouncedSearch, () => setPage(1));

  // Query Params
  const queryParams = useMemo(() => {
    let statusFilter: PlanStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'ARCHIVED') {
      statusFilter = 'ARCHIVED';
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
    data: plansResponse,
    isLoading: isLoadingPlans,
    isFetching: isFetchingPlans,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans,
  } = usePlans(queryParams);

  const {
    data: planStats,
    isLoading: isLoadingStats,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = usePlanStats();

  const handleRefreshAll = () => {
    refetchPlans();
    refetchStats();
  };

  // Mutations
  const updateStatusMutation = useUpdatePlanStatus();
  const softDeleteMutation = useSoftDeletePlan();
  const restoreMutation = useRestorePlan();
  const permanentDeleteMutation = usePermanentDeletePlan();

  const plans = plansResponse?.data || [];
  const meta = plansResponse?.meta;

  const handleExportCsv = () => {
    if (!plans || plans.length === 0) {
      toast.error('No commercial plans available to export');
      return;
    }

    const headers = [
      'Plan ID',
      'Name',
      'Price (INR)',
      'Duration (Days)',
      'Max Activations',
      'Status',
      'English Typing',
      'Hindi Typing',
      'Govt Exams',
      'Student Mgmt',
      'Advanced Reports',
      'Custom Branding',
      'Offline Grace Days',
      'Created At',
    ];

    const rows = plans.map((p) => {
      const f = p.features || {};
      return [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        (p.price / 100).toFixed(2),
        p.durationDays,
        p.maxActivations,
        p.deletedAt ? 'TRASH' : p.status,
        f.englishTyping ? 'Yes' : 'No',
        f.hindiTyping ? 'Yes' : 'No',
        f.governmentExams ? 'Yes' : 'No',
        f.studentManagement ? 'Yes' : 'No',
        f.advancedReports ? 'Yes' : 'No',
        f.customBranding ? 'Yes' : 'No',
        f.offlineGraceDays ?? 0,
        p.createdAt,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commercial-plans-${activeTab.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${plans.length} commercial plans to CSV`);
  };

  // Handlers
  const handleToggleStatus = (plan: Plan) => {
    const newStatus: PlanStatus = plan.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    updateStatusMutation.mutate({
      id: plan.id,
      data: { status: newStatus },
    });
  };

  const handleConfirmSoftDelete = async () => {
    if (!planToDelete) return;
    try {
      await softDeleteMutation.mutateAsync(planToDelete.id);
      setPlanToDelete(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleConfirmRestore = async () => {
    if (!planToRestore) return;
    try {
      await restoreMutation.mutateAsync(planToRestore.id);
      setPlanToRestore(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleConfirmPermanentPurge = async () => {
    if (!planToPurge) return;
    try {
      await permanentDeleteMutation.mutateAsync(planToPurge.id);
      setPlanToPurge(null);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Commercial Plans & Tiers"
        subtitle="Manage commercial subscription packaging, pricing models, workstation seat caps, and software feature sets"
        icon={<Layers className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingPlans}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            >
              <RefreshCw size={14} className={isFetchingPlans ? 'animate-spin text-primary' : ''} />
              Refresh
            </button>

            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm hover:shadow"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Commercial Tier
              </button>
            ) : (
              <div
                title="Super Admin privileges required to define commercial plan packages."
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} />
                <span>Create Tier (Super Admin)</span>
              </div>
            )}
          </>
        }
      />

      {/* Error Alert Banner */}
      {(isPlansError || isStatsError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-sm text-red-700 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <span>
              {((plansError as any)?.message || (statsError as any)?.message) ||
                'Failed to load commercial plan tiers. Please retry.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 rounded-xl transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Tiers"
          value={planStats?.totalPlans || 0}
          type="purple"
          isLoading={isLoadingStats}
          icon={<Layers size={24} className="text-white" />}
          subtitle="All created catalog plans"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          active={activeTab === 'ALL'}
        />

        <StatCard
          title="Active Catalog"
          value={planStats?.activePlans || 0}
          type="emerald"
          isLoading={isLoadingStats}
          icon={<CheckCircle2 size={24} className="text-white" />}
          subtitle="Assignable commercial tiers"
          onClick={() => {
            setActiveTab('ACTIVE');
            setPage(1);
          }}
          active={activeTab === 'ACTIVE'}
        />

        <StatCard
          title="Archived Tiers"
          value={planStats?.archivedPlans || 0}
          type="coral"
          isLoading={isLoadingStats}
          icon={<Archive size={24} className="text-white" />}
          subtitle="Deprecated / legacy tiers"
          onClick={() => {
            setActiveTab('ARCHIVED');
            setPage(1);
          }}
          active={activeTab === 'ARCHIVED'}
        />

        <StatCard
          title="Avg Plan Price"
          value={
            isLoadingStats
              ? '...'
              : `₹${((planStats?.averagePrice || 0) / 100).toLocaleString('en-IN', {
                  maximumFractionDigits: 0,
                })}`
          }
          type="orange"
          isLoading={isLoadingStats}
          icon={<IndianRupee size={24} className="text-white" />}
          subtitle="Mean catalog pricing"
        />

        <StatCard
          title="Avg Workstations"
          value={
            isLoadingStats
              ? '...'
              : planStats?.averageMaxActivations
              ? Math.round(planStats.averageMaxActivations)
              : 0
          }
          type="blue"
          isLoading={isLoadingStats}
          icon={<Laptop size={24} className="text-white" />}
          subtitle="Seats quota per plan"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar border-b border-gray-200/80 pb-3">
        {[
          { id: 'ACTIVE', label: 'Active Tiers', count: planStats?.activePlans },
          { id: 'ARCHIVED', label: 'Archived', count: planStats?.archivedPlans },
          { id: 'ALL', label: 'All Plans', count: planStats?.totalPlans },
          { id: 'TRASH', label: 'Recycle Bin' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as PlanTab);
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
        searchPlaceholder="Search plans by name, description... (Press / to focus)"
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
        totalResults={plans.length}
        totalLabel="Pricing Plans"
        filterElements={
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <FilterSelect
              icon={<ArrowUpDown size={13} />}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort by Column"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Plan Name</option>
              <option value="price">Price</option>
              <option value="maxActivations">Workstation Seats</option>
              <option value="durationDays">Duration (Days)</option>
            </FilterSelect>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-[38px] px-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-xs shrink-0 shadow-2xs transition-colors"
              title={`Sorting ${sortOrder.toUpperCase()}`}
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        }
      />

      {/* Plans Content */}
      {isLoadingPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-white border border-gray-200 p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-10 bg-gray-100 rounded-xl mt-4" />
              </div>
              <div className="h-8 bg-gray-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary flex items-center justify-center mb-3">
            <Layers size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Commercial Plans Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
            {debouncedSearch
              ? `No plan tiers matched your search filter "${debouncedSearch}".`
              : activeTab === 'TRASH'
              ? 'The recycle bin is currently empty.'
              : 'Create commercial subscription packages for typing institutions to subscribe to.'}
          </p>
          {activeTab !== 'TRASH' &&
            (isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm"
              >
                <Plus size={15} strokeWidth={2.5} />
                Create First Commercial Tier
              </button>
            ) : (
              <p className="text-xs text-gray-400">
                Plan management is restricted to Super Admins.
              </p>
            ))}
        </div>
      ) : viewMode === 'CARDS' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={(p) => setEditingPlan(p)}
              onToggleStatus={handleToggleStatus}
              onViewDetails={(p) => setInspectingPlan(p)}
              onDelete={(p) => {
                if (activeTab === 'TRASH') {
                  setPlanToPurge(p);
                } else {
                  setPlanToDelete(p);
                }
              }}
              onRestore={activeTab === 'TRASH' ? (p) => setPlanToRestore(p) : undefined}
              isDeletedView={activeTab === 'TRASH'}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW WITH MOBILE DUAL-MODE */
        <div>
          <div className="md:hidden grid grid-cols-1 gap-4 mb-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onViewDetails={(p) => setInspectingPlan(p)}
                onEdit={(p) => setEditingPlan(p)}
                onToggleStatus={handleToggleStatus}
                onDelete={(p) => {
                  if (activeTab === 'TRASH') {
                    setPlanToPurge(p);
                  } else {
                    setPlanToDelete(p);
                  }
                }}
                onRestore={activeTab === 'TRASH' ? (p) => setPlanToRestore(p) : undefined}
                isDeletedView={activeTab === 'TRASH'}
              />
            ))}
          </div>
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Tier Identity</th>
                  <th className="py-3 px-4">Price / Term</th>
                  <th className="py-3 px-4">Station Quota</th>
                  <th className="py-3 px-4">Features</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {plans.map((plan) => {
                  const priceFormatted = (plan.price / 100).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  });
                  const f = plan.features || {};

                  return (
                    <tr key={plan.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary flex items-center justify-center shrink-0">
                            <Layers size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{plan.name}</span>
                            <span className="text-[11px] text-gray-400 font-mono">{plan.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900">₹{priceFormatted}</span>
                        <span className="text-[11px] text-gray-500 block">
                          / {plan.durationDays} Days
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-orange-50 text-orange-800 px-2 py-0.5 rounded-md border border-orange-100">
                          <Laptop size={13} className="text-primary" />
                          {plan.maxActivations} PCs
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {f.englishTyping && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              English
                            </span>
                          )}
                          {f.hindiTyping && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              Hindi
                            </span>
                          )}
                          {f.governmentExams && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              Exams
                            </span>
                          )}
                          {f.customBranding && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              Branding
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={plan.deletedAt ? 'TRASH' : plan.status}
                          size="sm"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <PlanActionsDropdown
                          plan={plan}
                          onEdit={(p) => setEditingPlan(p)}
                          onToggleStatus={handleToggleStatus}
                          onViewDetails={(p) => setInspectingPlan(p)}
                          onDelete={(p) => {
                            if (activeTab === 'TRASH') {
                              setPlanToPurge(p);
                            } else {
                              setPlanToDelete(p);
                            }
                          }}
                          onRestore={activeTab === 'TRASH' ? (p) => setPlanToRestore(p) : undefined}
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
        itemName="plans"
      />

      {/* Modals */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditPlanModal
        isOpen={!!editingPlan}
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
      />

      <PlanDetailModal
        isOpen={!!inspectingPlan}
        plan={inspectingPlan}
        onClose={() => setInspectingPlan(null)}
      />

      {/* Confirmation: Soft Delete / Move to Trash */}
      <ConfirmDialog
        isOpen={!!planToDelete}
        title="Move Commercial Plan to Trash?"
        description={`Are you sure you want to move tier "${planToDelete?.name}" to trash? Existing active customer subscriptions will remain unaffected, but this plan will be removed from standard catalogs.`}
        confirmLabel="Move to Trash"
        variant="warning"
        isPending={softDeleteMutation.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setPlanToDelete(null)}
      />

      {/* Confirmation: Restore */}
      <ConfirmDialog
        isOpen={!!planToRestore}
        title="Restore Commercial Plan?"
        description={`Do you want to restore tier "${planToRestore?.name}" back to active status?`}
        confirmLabel="Restore Plan"
        variant="info"
        isPending={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setPlanToRestore(null)}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmDialog
        isOpen={!!planToPurge}
        title="Permanently Purge Commercial Plan?"
        description={`WARNING: This action is destructive and irreversible. Tier "${planToPurge?.name}" (${planToPurge?.id}) will be permanently deleted from the database.`}
        confirmLabel="Permanently Purge"
        variant="critical"
        confirmPhrase="DELETE"
        isPending={permanentDeleteMutation.isPending}
        onConfirm={handleConfirmPermanentPurge}
        onClose={() => setPlanToPurge(null)}
      />
    </div>
  );
};

export default PlansPage;
