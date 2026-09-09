import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Layers,
  Calendar,
  Key,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Trash2,
  RotateCcw,
  RotateCw,
  ArrowUpDown,
  Filter,
  AlertOctagon,
  Sparkles,
  Download,
  AlertCircle,
  Lock,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { useAuthStore } from '@/stores/auth.store';
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
import { SubscriptionActionsDropdown } from '../components/SubscriptionActionsDropdown';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
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
  const { isSuperAdmin, isSupport } = usePermissions();

  // Filters & State
  const [activeTab, setActiveTab] = useState<SubscriptionTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    const headers = [
      'Subscription ID',
      'Institution',
      'Plan Name',
      'Status',
      'Starts At',
      'Expires At',
      'Auto Renew',
      'Created At',
    ];
    const rows = subscriptions.map((sub) => [
      `"${sub.id}"`,
      `"${sub.institution?.name || institutions.find((i) => i.id === sub.institutionId)?.name || sub.institutionId}"`,
      `"${sub.plan?.name || plans.find((p) => p.id === sub.planId)?.name || sub.planId}"`,
      `"${sub.status}"`,
      `"${new Date(sub.startsAt).toISOString()}"`,
      `"${new Date(sub.expiresAt).toISOString()}"`,
      `"${sub.autoRenew ? 'YES' : 'NO'}"`,
      `"${new Date(sub.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Subscriptions exported to CSV');
  };

  // Handlers
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
        icon={<DollarSign className="text-[#ff8a5c]" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Export subscriptions list to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingSubscriptions}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Refresh Subscriptions & Statistics"
            >
              <RefreshCw size={14} className={isFetchingSubscriptions ? 'animate-spin text-[#ff8a5c]' : ''} />
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm hover:shadow"
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
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                <option value="">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </FilterSelect>
            )}

            {/* Plan Tier Filter */}
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

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <FilterSelect
                icon={<ArrowUpDown size={13} />}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
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
                className="h-[38px] px-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-xs shrink-0 shadow-2xs transition-colors"
                title={`Sort ${sortOrder.toUpperCase()}`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </>
        }
      />

      {/* Subscriptions Table */}
      {isLoadingSubscriptions ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center mb-3">
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
          {activeTab !== 'TRASH' && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              Provision First Subscription
            </button>
          )}
        </div>
      ) : viewMode === 'CARDS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {subscriptions.map((sub) => {
              const expiryDate = new Date(sub.expiresAt);
              const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays <= 0;
              const isExpiringSoon = diffDays > 0 && diffDays <= 30;

              const licenses = sub.licenses || [];
              const totalCapacity = licenses.reduce((sum, lic) => sum + (lic.maxActivations || 0), 0);
              const totalActive = licenses.reduce(
                (sum, lic) =>
                  sum +
                  ((lic.activations || []).filter((a: any) => a.status === 'ACTIVE').length || 0),
                0
              );

              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff8a5c] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-100">
                          {sub.institution?.name?.slice(0, 2).toUpperCase() || 'IN'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 text-sm block truncate">
                            {sub.institution?.name || sub.institutionId}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono block truncate">
                            {sub.id}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={sub.deletedAt ? 'TRASH' : sub.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 mb-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Tier</span>
                        <span className="font-semibold text-gray-800">{sub.plan?.name || sub.planId}</span>
                        <span className="text-[10px] text-gray-500 block">
                          ₹{((sub.plan?.price || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Seat Usage</span>
                        <div className="flex items-center gap-1 font-semibold text-gray-800">
                          <Laptop size={12} className="text-[#ff8a5c]" />
                          <span>{totalActive} / {totalCapacity || sub.plan?.maxActivations || 5} PCs</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block">
                          {licenses.length} {licenses.length === 1 ? 'License' : 'Licenses'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={13} className="text-gray-400" />
                        <span>
                          Expires {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        {isExpired ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Expired
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {diffDays}d left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {diffDays}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/80">
                    {!sub.deletedAt && (isExpiringSoon || isExpired) && (
                      <button
                        type="button"
                        onClick={() => setRenewingSubscription(sub)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#ff8a5c] bg-[#fff0eb] hover:bg-[#ffe2d6] rounded-xl border border-[#ff8a5c]/30 transition-colors shadow-2xs"
                      >
                        <RotateCw size={12} />
                        Renew
                      </button>
                    )}
                    <SubscriptionActionsDropdown
                      subscription={sub}
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
                      isDeletedView={activeTab === 'TRASH'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          {/* Mobile Card View (< md screens) */}
          <div className="md:hidden divide-y divide-gray-100">
            {subscriptions.map((sub) => {
              const expiryDate = new Date(sub.expiresAt);
              const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays <= 0;
              const isExpiringSoon = diffDays > 0 && diffDays <= 30;

              const licenses = sub.licenses || [];
              const totalCapacity = licenses.reduce((sum, lic) => sum + (lic.maxActivations || 0), 0);
              const totalActive = licenses.reduce(
                (sum, lic) =>
                  sum +
                  ((lic.activations || []).filter((a: any) => a.status === 'ACTIVE').length || 0),
                0
              );

              return (
                <div key={sub.id} className="p-4 space-y-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff8a5c] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-100">
                        {sub.institution?.name?.slice(0, 2).toUpperCase() || 'IN'}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 text-sm block truncate">
                          {sub.institution?.name || sub.institutionId}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono block truncate">
                          {sub.id}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={sub.deletedAt ? 'TRASH' : sub.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Tier</span>
                      <span className="font-semibold text-gray-800">{sub.plan?.name || sub.planId}</span>
                      <span className="text-[10px] text-gray-500 block">
                        ₹{((sub.plan?.price || 0) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Seat Usage</span>
                      <div className="flex items-center gap-1 font-semibold text-gray-800">
                        <Laptop size={12} className="text-[#ff8a5c]" />
                        <span>{totalActive} / {totalCapacity || sub.plan?.maxActivations || 5} PCs</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        {licenses.length} {licenses.length === 1 ? 'License' : 'Licenses'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      <span>
                        Expires {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      {isExpired ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Expired
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {diffDays}d left
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {diffDays}d left
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100/80">
                    {!sub.deletedAt && (isExpiringSoon || isExpired) && (
                      <button
                        type="button"
                        onClick={() => setRenewingSubscription(sub)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#ff8a5c] bg-[#fff0eb] hover:bg-[#ffe2d6] rounded-xl border border-[#ff8a5c]/30 transition-colors shadow-2xs"
                      >
                        <RotateCw size={12} />
                        Renew
                      </button>
                    )}
                    <SubscriptionActionsDropdown
                      subscription={sub}
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
                      isDeletedView={activeTab === 'TRASH'}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (md+ screens) */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Institution</th>
                  <th className="py-3 px-4">Commercial Tier</th>
                  <th className="py-3 px-4">Contract Period</th>
                  <th className="py-3 px-4">Seat Allocation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {subscriptions.map((sub) => {
                  const expiryDate = new Date(sub.expiresAt);
                  const startDate = new Date(sub.startsAt);
                  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays <= 0;
                  const isExpiringSoon = diffDays > 0 && diffDays <= 30;

                  const licenses = sub.licenses || [];
                  const totalCapacity = licenses.reduce((sum, lic) => sum + (lic.maxActivations || 0), 0);
                  const totalActive = licenses.reduce(
                    (sum, lic) =>
                      sum +
                      ((lic.activations || []).filter((a: any) => a.status === 'ACTIVE').length || 0),
                    0
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Customer Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff8a5c] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-100">
                            {sub.institution?.name?.slice(0, 2).toUpperCase() || 'IN'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {sub.institution?.name || sub.institutionId}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <span>/{sub.institution?.slug || 'tenant'}</span>
                              <span>•</span>
                              <span className="font-mono">{sub.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tier Column */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{sub.plan?.name || sub.planId}</span>
                        <span className="text-[11px] text-gray-500 block">
                          ₹{((sub.plan?.price || 0) / 100).toLocaleString('en-IN')} / {sub.plan?.durationDays || 365}d
                        </span>
                      </td>

                      {/* Period Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <span className="text-gray-800">
                            {startDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit',
                            })}{' '}
                            -{' '}
                            {expiryDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="mt-1">
                          {isExpired ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Expired {Math.abs(diffDays)}d ago
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Expiring in {diffDays}d
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {diffDays} days left
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Seat Allocation Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Laptop size={14} className="text-[#ff8a5c]" />
                          <span>
                            <strong>{totalActive}</strong> / {totalCapacity || sub.plan?.maxActivations || 5} PCs
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {licenses.length} {licenses.length === 1 ? 'License' : 'Licenses'} Issued
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={sub.deletedAt ? 'TRASH' : sub.status}
                          size="sm"
                        />
                        {sub.autoRenew && !sub.deletedAt && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Auto-Renew On
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Renew Shortcut for expiring or expired contracts */}
                          {!sub.deletedAt && (isExpiringSoon || isExpired) && (
                            <button
                              type="button"
                              onClick={() => setRenewingSubscription(sub)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#ff8a5c] bg-[#fff0eb] hover:bg-[#ffe2d6] rounded-lg border border-[#ff8a5c]/30 transition-colors shadow-2xs"
                              title="Quick Renew Contract"
                            >
                              <RotateCw size={12} />
                              Renew
                            </button>
                          )}

                          <SubscriptionActionsDropdown
                            subscription={sub}
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
                            isDeletedView={activeTab === 'TRASH'}
                          />
                        </div>
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

      {/* Confirmation: Soft Delete */}
      <ConfirmationModal
        isOpen={!!subscriptionToDelete}
        title="Move Subscription to Trash?"
        description={`Are you sure you want to cancel / move subscription "${subscriptionToDelete?.id}" to trash? Associated client licenses may be impacted.`}
        confirmText="Move to Trash"
        variant="warning"
        isLoading={softDeleteMutation.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setSubscriptionToDelete(null)}
      />

      {/* Confirmation: Restore */}
      <ConfirmationModal
        isOpen={!!subscriptionToRestore}
        title="Restore Subscription Contract?"
        description={`Do you want to restore subscription "${subscriptionToRestore?.id}" back to active status?`}
        confirmText="Restore Contract"
        variant="info"
        isLoading={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setSubscriptionToRestore(null)}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmationModal
        isOpen={!!subscriptionToPurge}
        title="Permanently Purge Subscription?"
        description={`WARNING: This action is permanent and cannot be undone. Subscription contract "${subscriptionToPurge?.id}" will be purged from database records.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText="DELETE"
        isLoading={permanentDeleteMutation.isPending}
        onConfirm={handleConfirmPermanentPurge}
        onClose={() => setSubscriptionToPurge(null)}
      />
    </div>
  );
};

export default SubscriptionsPage;
