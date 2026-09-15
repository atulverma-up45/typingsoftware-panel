import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  RefreshCw,
  Building2,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  AlertOctagon,
  Download,
  AlertCircle,
  Lock,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { exportCsv } from '@/lib/exportCsv';
import { usePermissions } from '@/lib/permissions';
import {
  useSubscriptions,
  useSubscriptionStats,
  useSoftDeleteSubscription,
  useRestoreSubscription,
  usePermanentDeleteSubscription,
} from '../api/subscriptionApi';
import type { Subscription, SubscriptionStatus } from '../api/subscriptionApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { usePlans } from '@/features/plans/api/planApi';
import { CreateSubscriptionModal } from '../components/CreateSubscriptionModal';
import { RenewSubscriptionModal } from '../components/RenewSubscriptionModal';
import { UpdateSubscriptionModal } from '../components/UpdateSubscriptionModal';
import { SubscriptionStatusModal } from '../components/SubscriptionStatusModal';
import { SubscriptionDetailModal } from '../components/SubscriptionDetailModal';
import { SubscriptionTableView } from '../components/SubscriptionTableView';
import { SubscriptionConfirmModals } from '../components/SubscriptionConfirmModals';
import { toast } from 'sonner';

type SubscriptionTab =
  | 'ALL'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'TRIAL'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'TRASH';

export const SubscriptionsPage: React.FC = () => {
  const { isSuperAdmin, isSupport, canMutateSubscriptions } = usePermissions();

  // Filters & State
  const [activeTab, setActiveTab] = useState<SubscriptionTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'expiresAt' | 'startsAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renewingSubscription, setRenewingSubscription] = useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [statusSubscription, setStatusSubscription] = useState<Subscription | null>(null);
  const [inspectingSubscription, setInspectingSubscription] = useState<Subscription | null>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const [subscriptionToRestore, setSubscriptionToRestore] = useState<Subscription | null>(null);
  const [subscriptionToPurge, setSubscriptionToPurge] = useState<Subscription | null>(null);

  // Reset to the first page whenever the committed (debounced) search changes
  useOnDepChange(debouncedSearch, () => setPage(1));

  // Query Params
  const queryParams = useMemo(() => {
    let statusFilter: SubscriptionStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'TRIAL') {
      statusFilter = 'TRIAL';
    } else if (activeTab === 'PAST_DUE') {
      statusFilter = 'PAST_DUE';
    } else if (activeTab === 'CANCELLED') {
      statusFilter = 'CANCELLED';
    } else if (activeTab === 'TRASH') {
      includeDeleted = true;
    }

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter,
      institutionId: selectedInstitutionId || undefined,
      planId: selectedPlanId || undefined,
      includeDeleted,
      sortBy: activeTab === 'EXPIRING' ? 'expiresAt' : sortBy,
      sortOrder: activeTab === 'EXPIRING' ? 'asc' : sortOrder,
    };
  }, [page, limit, debouncedSearch, activeTab, selectedInstitutionId, selectedPlanId, sortBy, sortOrder]);

  // Queries
  const {
    data: subscriptionsResponse,
    isLoading: isLoadingSubscriptions,
    isFetching: isFetchingSubscriptions,
    isError: isSubscriptionsError,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useSubscriptions(queryParams);

  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchSubscriptionStats,
  } = useSubscriptionStats(selectedInstitutionId || undefined);

  const handleRefreshAll = () => {
    refetchSubscriptionStats();
    refetchSubscriptions();
  };

  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const { data: plansData } = usePlans({ limit: 100 });

  const institutions = institutionsData?.data || [];
  const plans = plansData?.data || [];

  // Mutations
  const softDeleteMutation = useSoftDeleteSubscription();
  const restoreMutation = useRestoreSubscription();
  const permanentDeleteMutation = usePermanentDeleteSubscription();

  const subscriptions = subscriptionsResponse?.data || [];
  const meta = subscriptionsResponse?.meta;

  const handleExportCsv = () => {
    if (!subscriptions.length) {
      toast.error('No subscriptions available to export');
      return;
    }
    exportCsv(
      `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Subscription ID', accessor: 'id' },
        {
          header: 'Institution',
          accessor: (sub) =>
            sub.institution?.name || institutions.find((i) => i.id === sub.institutionId)?.name || sub.institutionId,
        },
        {
          header: 'Plan Name',
          accessor: (sub) => sub.plan?.name || plans.find((p) => p.id === sub.planId)?.name || sub.planId,
        },
        { header: 'Status', accessor: 'status' },
        { header: 'Starts At', accessor: (sub) => new Date(sub.startsAt).toISOString() },
        { header: 'Expires At', accessor: (sub) => new Date(sub.expiresAt).toISOString() },
        { header: 'Auto Renew', accessor: (sub) => (sub.autoRenew ? 'YES' : 'NO') },
        { header: 'Created At', accessor: (sub) => new Date(sub.createdAt).toISOString() },
      ],
      subscriptions,
    );
    toast.success('Subscriptions exported to CSV');
  };

  const handleConfirmSoftDelete = async () => {
    if (!subscriptionToDelete) return;
    try {
      await softDeleteMutation.mutateAsync(subscriptionToDelete.id);
      setSubscriptionToDelete(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmRestore = async () => {
    if (!subscriptionToRestore) return;
    try {
      await restoreMutation.mutateAsync(subscriptionToRestore.id);
      setSubscriptionToRestore(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmPermanentPurge = async () => {
    if (!subscriptionToPurge) return;
    try {
      await permanentDeleteMutation.mutateAsync(subscriptionToPurge.id);
      setSubscriptionToPurge(null);
    } catch {
      // Handled by hook
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Subscriptions & Contracts"
        subtitle="Institutional billing contracts, term validity periods, automated renewals, and license provisioning"
        icon={<DollarSign className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Export subscriptions list to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingSubscriptions}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Refresh Subscriptions & Statistics"
            >
              <RefreshCw size={14} className={isFetchingSubscriptions ? 'animate-spin text-primary' : ''} />
              Refresh
            </button>

            {isSupport ? (
              <div
                title="Support role is view-only. Subscription provisioning is restricted to administrators."
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} />
                <span>Provision (Locked)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm hover:shadow cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                Provision Subscription
              </button>
            )}
          </>
        }
      />

      {/* Commercial Health KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contracts"
          value={statsData?.totalSubscriptions || 0}
          type="blue"
          icon={<DollarSign size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="All Time Subscriptions"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          active={activeTab === 'ALL'}
        />
        <StatCard
          title="Active Contracts"
          value={statsData?.activeSubscriptions || 0}
          type="emerald"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="In Good Standing"
          onClick={() => {
            setActiveTab('ACTIVE');
            setPage(1);
          }}
          active={activeTab === 'ACTIVE'}
        />
        <StatCard
          title="Expiring in 30d"
          value={statsData?.expiringWithin30Days || 0}
          type="orange"
          icon={<Clock size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Renewal Due Soon"
          onClick={() => {
            setActiveTab('EXPIRING');
            setPage(1);
          }}
          active={activeTab === 'EXPIRING'}
        />
        <StatCard
          title="Past Due / Unpaid"
          value={statsData?.pastDueSubscriptions || 0}
          type="coral"
          icon={<AlertOctagon size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Grace Period & Lapsed"
          onClick={() => {
            setActiveTab('PAST_DUE');
            setPage(1);
          }}
          active={activeTab === 'PAST_DUE'}
        />
      </div>

      {/* Error Alert Banner with Retry */}
      {isSubscriptionsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to load subscriptions:{' '}
              {subscriptionsError instanceof Error ? subscriptionsError.message : 'Network error'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3">
          {[
            { id: 'ALL', label: 'All Contracts', count: statsData?.totalSubscriptions },
            { id: 'ACTIVE', label: 'Active', count: statsData?.activeSubscriptions },
            { id: 'EXPIRING', label: 'Expiring Soon (30d)', count: statsData?.expiringWithin30Days },
            { id: 'TRIAL', label: 'Trial', count: statsData?.trialSubscriptions },
            { id: 'PAST_DUE', label: 'Past Due', count: statsData?.pastDueSubscriptions },
            {
              id: 'CANCELLED',
              label: 'Cancelled / Expired',
              count: (statsData?.expiredSubscriptions || 0) + (statsData?.cancelledSubscriptions || 0),
            },
            { id: 'TRASH', label: 'Recycle Bin' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as SubscriptionTab);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary shadow-2xs font-semibold'
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

      {/* Search & Multifaceted Filter Bar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by institution name, contract ID... (Press / to focus)"
        activeChips={[
          ...(selectedInstitutionId
            ? [
                {
                  id: 'institution',
                  label: 'Institution',
                  value:
                    institutions.find((i) => i.id === selectedInstitutionId)?.name ||
                    selectedInstitutionId,
                  onRemove: () => {
                    setSelectedInstitutionId('');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedPlanId
            ? [
                {
                  id: 'plan',
                  label: 'Plan',
                  value: plans.find((p) => p.id === selectedPlanId)?.name || selectedPlanId,
                  onRemove: () => {
                    setSelectedPlanId('');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          selectedInstitutionId || selectedPlanId || searchTerm || sortBy !== 'createdAt' || sortOrder !== 'desc'
        )}
        onClearFilters={() => {
          setSelectedInstitutionId('');
          setSelectedPlanId('');
          setSearchTerm('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        totalResults={meta?.total}
        totalLabel="Subscriptions"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterElements={
          <>
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
                <option value="">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </FilterSelect>
            )}

            <FilterSelect
              icon={<Layers size={13} />}
              value={selectedPlanId}
              onChange={(e) => {
                setSelectedPlanId(e.target.value);
                setPage(1);
              }}
              title="Filter by Plan Tier"
            >
              <option value="">All Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </FilterSelect>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <FilterSelect
                icon={<ArrowUpDown size={13} />}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'expiresAt' | 'startsAt' | 'status')}
                title="Sort by Column"
              >
                <option value="createdAt">Created Date</option>
                <option value="expiresAt">Expiration Date</option>
                <option value="startsAt">Start Date</option>
                <option value="status">Status</option>
              </FilterSelect>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-[38px] px-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-xs shrink-0 shadow-2xs transition-colors cursor-pointer"
                title={`Sort ${sortOrder.toUpperCase()}`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </>
        }
      />

      {/* Subscriptions Table / Cards rendering */}
      {isLoadingSubscriptions ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary flex items-center justify-center mb-3">
            <DollarSign size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Subscriptions Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
            {debouncedSearch
              ? `No subscription contracts matched search "${debouncedSearch}".`
              : activeTab === 'TRASH'
              ? 'The recycle bin is currently empty.'
              : 'Provision commercial subscription contracts to grant computer labs software licenses.'}
          </p>
          {activeTab !== 'TRASH' &&
            (canMutateSubscriptions ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                Provision First Subscription
              </button>
            ) : (
              <p className="text-xs text-gray-400">
                Subscription provisioning is restricted to administrators.
              </p>
            ))}
        </div>
      ) : (
        <SubscriptionTableView
          subscriptions={subscriptions}
          now={now}
          activeTab={activeTab}
          viewMode={viewMode}
          onViewDetails={(s) => setInspectingSubscription(s)}
          onRenew={(s) => setRenewingSubscription(s)}
          onEdit={(s) => setEditingSubscription(s)}
          onChangeStatus={(s) => setStatusSubscription(s)}
          onDelete={(s) => {
            if (activeTab === 'TRASH') {
              setSubscriptionToPurge(s);
            } else {
              setSubscriptionToDelete(s);
            }
          }}
          onRestore={activeTab === 'TRASH' ? (s) => setSubscriptionToRestore(s) : undefined}
        />
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
        itemName="subscriptions"
      />

      {/* Modals */}
      <CreateSubscriptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        preselectedInstitutionId={selectedInstitutionId || undefined}
      />

      <RenewSubscriptionModal
        isOpen={!!renewingSubscription}
        subscription={renewingSubscription}
        onClose={() => setRenewingSubscription(null)}
      />

      <UpdateSubscriptionModal
        isOpen={!!editingSubscription}
        subscription={editingSubscription}
        onClose={() => setEditingSubscription(null)}
      />

      <SubscriptionStatusModal
        isOpen={!!statusSubscription}
        subscription={statusSubscription}
        onClose={() => setStatusSubscription(null)}
      />

      <SubscriptionDetailModal
        isOpen={!!inspectingSubscription}
        subscription={inspectingSubscription}
        onClose={() => setInspectingSubscription(null)}
        onRenew={(s) => setRenewingSubscription(s)}
      />

      <SubscriptionConfirmModals
        subscriptionToDelete={subscriptionToDelete}
        onCloseDelete={() => setSubscriptionToDelete(null)}
        onConfirmDelete={handleConfirmSoftDelete}
        isDeleting={softDeleteMutation.isPending}

        subscriptionToRestore={subscriptionToRestore}
        onCloseRestore={() => setSubscriptionToRestore(null)}
        onConfirmRestore={handleConfirmRestore}
        isRestoring={restoreMutation.isPending}

        subscriptionToPurge={subscriptionToPurge}
        onClosePurge={() => setSubscriptionToPurge(null)}
        onConfirmPurge={handleConfirmPermanentPurge}
        isPurging={permanentDeleteMutation.isPending}
      />
    </div>
  );
};

export default SubscriptionsPage;
