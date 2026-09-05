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
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
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
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type PlanTab = 'ACTIVE' | 'ARCHIVED' | 'ALL' | 'TRASH';
type ViewMode = 'CARDS' | 'TABLE';

export const PlansPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<PlanTab>('ACTIVE');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    refetch: refetchPlans,
  } = usePlans(queryParams);

  const { data: planStats, isLoading: isLoadingStats } = usePlanStats();

  // Mutations
  const updateStatusMutation = useUpdatePlanStatus();
  const softDeleteMutation = useSoftDeletePlan();
  const restoreMutation = useRestorePlan();
  const permanentDeleteMutation = usePermanentDeletePlan();

  const plans = plansResponse?.data || [];
  const meta = plansResponse?.meta;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <Layers size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Commercial Plans & Tiers
              </h1>
              <p className="text-xs text-gray-500">
                Manage commercial subscription packaging, pricing models, workstation seat caps, and software feature sets
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetchPlans()}
            disabled={isFetchingPlans}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={isFetchingPlans ? 'animate-spin text-[#ff8a5c]' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm hover:shadow"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Commercial Tier
          </button>
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Total Tiers
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900">
              {isLoadingStats ? '...' : planStats?.totalPlans || 0}
            </span>
            <span className="text-xs text-gray-400">All Created</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Active Catalog
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600">
              {isLoadingStats ? '...' : planStats?.activePlans || 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Assignable</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Archived Tiers
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-600">
              {isLoadingStats ? '...' : planStats?.archivedPlans || 0}
            </span>
            <span className="text-xs text-gray-400">Deprecated</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Avg Plan Price
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900">
              {isLoadingStats
                ? '...'
                : `₹${((planStats?.averagePrice || 0) / 100).toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })}`}
            </span>
            <span className="text-xs text-gray-400">Per Tier</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Avg Workstations
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-blue-600">
              {isLoadingStats ? '...' : planStats?.averageMaxActivations || 0}
            </span>
            <span className="text-xs text-blue-600 font-medium">PCs / License</span>
          </div>
        </div>
      </div>

      {/* Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
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
            placeholder="Search plans by name, description..."
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
              <option value="name">Plan Name</option>
              <option value="price">Price</option>
              <option value="maxActivations">Workstation Seats</option>
              <option value="durationDays">Duration (Days)</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              title={`Sorting ${sortOrder.toUpperCase()}`}
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

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
          <div className="w-14 h-14 rounded-2xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center mb-3">
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
          {activeTab !== 'TRASH' && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              Create First Commercial Tier
            </button>
          )}
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
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
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
                          <div className="w-8 h-8 rounded-lg bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
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
                          <Laptop size={13} className="text-[#ff8a5c]" />
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
                        {plan.deletedAt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            In Trash
                          </span>
                        ) : plan.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Archived
                          </span>
                        )}
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
      )}

      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200/80 pt-4 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">{(meta.page - 1) * meta.limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(meta.page * meta.limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{meta.total}</span> plans
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
      <ConfirmationModal
        isOpen={!!planToDelete}
        title="Move Commercial Plan to Trash?"
        description={`Are you sure you want to move tier "${planToDelete?.name}" to trash? Existing active customer subscriptions will remain unaffected, but this plan will be removed from standard catalogs.`}
        confirmText="Move to Trash"
        variant="warning"
        isLoading={softDeleteMutation.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setPlanToDelete(null)}
      />

      {/* Confirmation: Restore */}
      <ConfirmationModal
        isOpen={!!planToRestore}
        title="Restore Commercial Plan?"
        description={`Do you want to restore tier "${planToRestore?.name}" back to active status?`}
        confirmText="Restore Plan"
        variant="info"
        isLoading={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setPlanToRestore(null)}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmationModal
        isOpen={!!planToPurge}
        title="Permanently Purge Commercial Plan?"
        description={`WARNING: This action is destructive and irreversible. Tier "${planToPurge?.name}" (${planToPurge?.id}) will be permanently deleted from the database.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText="DELETE"
        isLoading={permanentDeleteMutation.isPending}
        onConfirm={handleConfirmPermanentPurge}
        onClose={() => setPlanToPurge(null)}
      />
    </div>
  );
};

export default PlansPage;
