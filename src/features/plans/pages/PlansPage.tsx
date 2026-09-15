import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  RefreshCw,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { exportCsv } from '@/lib/exportCsv';
import {
  usePlans,
  usePlanStats,
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
import { PlanStatsCards, type PlanTab } from '../components/PlanStatsCards';
import { PlanTableView } from '../components/PlanTableView';
import { PlanConfirmModals } from '../components/PlanConfirmModals';
import { toast } from 'sonner';

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
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [planToRestore, setPlanToRestore] = useState<Plan | null>(null);
  const [planToPurge, setPlanToPurge] = useState<Plan | null>(null);

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

    exportCsv(
      `commercial-plans-${activeTab.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Plan ID', accessor: 'id' },
        { header: 'Plan Name', accessor: 'name' },
        { header: 'Price (INR)', accessor: (p) => (p.price / 100).toFixed(2) },
        { header: 'Duration (Days)', accessor: 'durationDays' },
        { header: 'Station Seats', accessor: 'maxActivations' },
        { header: 'Status', accessor: 'status' },
        { header: 'English Typing', accessor: (p) => (p.features?.englishTyping ? 'YES' : 'NO') },
        { header: 'Hindi Typing', accessor: (p) => (p.features?.hindiTyping ? 'YES' : 'NO') },
        { header: 'Govt Exams', accessor: (p) => (p.features?.governmentExams ? 'YES' : 'NO') },
        { header: 'Custom Branding', accessor: (p) => (p.features?.customBranding ? 'YES' : 'NO') },
        { header: 'Created Date', accessor: (p) => new Date(p.createdAt).toISOString() },
      ],
      plans,
    );
    toast.success('Commercial plans exported to CSV');
  };

  const handleToggleStatus = (plan: Plan) => {
    const nextStatus: PlanStatus = plan.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    updateStatusMutation.mutate({ id: plan.id, data: { status: nextStatus } });
  };

  const handleConfirmSoftDelete = async () => {
    if (!planToDelete) return;
    try {
      await softDeleteMutation.mutateAsync(planToDelete.id);
      setPlanToDelete(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmRestore = async () => {
    if (!planToRestore) return;
    try {
      await restoreMutation.mutateAsync(planToRestore.id);
      setPlanToRestore(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmPermanentPurge = async () => {
    if (!planToPurge) return;
    try {
      await permanentDeleteMutation.mutateAsync(planToPurge.id);
      setPlanToPurge(null);
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Commercial Plan Catalog"
        subtitle="Manage billing tiers, station limits, bilingual syllabus allowances, and subscription pricing"
        icon={<Layers className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Export pricing tiers to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingPlans}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Refresh Plan Catalog"
            >
              <RefreshCw size={14} className={isFetchingPlans ? 'animate-spin text-primary' : ''} />
              Refresh
            </button>

            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm hover:shadow"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Plan Tier
              </button>
            ) : (
              <div
                title="Plan pricing tiers are configured exclusively by Super Admin."
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
      <PlanStatsCards
        planStats={planStats}
        isLoadingStats={isLoadingStats}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3">
          {[
            { id: 'ACTIVE', label: 'Active Catalog', count: planStats?.activePlans },
            { id: 'ARCHIVED', label: 'Archived / Deprecated', count: planStats?.archivedPlans },
            { id: 'ALL', label: 'All Tiers', count: planStats?.totalPlans },
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
      </div>

      {/* Multifaceted Filter Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search plans by name or description... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m as ViewMode)}
        activeChips={[
          ...(sortBy !== 'createdAt'
            ? [
                {
                  id: 'sort',
                  label: 'Sort By',
                  value: sortBy.toUpperCase(),
                  onRemove: () => setSortBy('createdAt'),
                },
              ]
            : []),
          ...(sortOrder !== 'desc'
            ? [
                {
                  id: 'order',
                  label: 'Order',
                  value: sortOrder.toUpperCase(),
                  onRemove: () => setSortOrder('desc'),
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(searchTerm || sortBy !== 'createdAt' || sortOrder !== 'desc')}
        onClearFilters={() => {
          setSearchTerm('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm"
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
          <PlanTableView
            plans={plans}
            isDeletedView={activeTab === 'TRASH'}
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
          />
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

      <PlanConfirmModals
        planToDelete={planToDelete}
        planToRestore={planToRestore}
        planToPurge={planToPurge}
        isSoftDeletePending={softDeleteMutation.isPending}
        isRestorePending={restoreMutation.isPending}
        isPermanentDeletePending={permanentDeleteMutation.isPending}
        onCloseDelete={() => setPlanToDelete(null)}
        onCloseRestore={() => setPlanToRestore(null)}
        onClosePurge={() => setPlanToPurge(null)}
        onConfirmSoftDelete={handleConfirmSoftDelete}
        onConfirmRestore={handleConfirmRestore}
        onConfirmPermanentPurge={handleConfirmPermanentPurge}
      />
    </div>
  );
};

export default PlansPage;
