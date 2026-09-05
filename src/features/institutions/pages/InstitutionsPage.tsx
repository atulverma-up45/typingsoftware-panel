import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Mail,
  Phone,
  Shield,
  Palette,
  Power,
  RotateCcw,
  AlertOctagon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import {
  useInstitutions,
  useGlobalInstitutionStats,
  useSoftDeleteInstitution,
  useRestoreInstitution,
  usePermanentDeleteInstitution,
} from '../api/institutionApi';
import type {
  Institution,
  InstitutionStatus,
} from '../api/institutionApi';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { EditInstitutionModal } from '../components/EditInstitutionModal';
import { InstitutionStatusModal } from '../components/InstitutionStatusModal';
import { BrandingEditorModal } from '../components/BrandingEditorModal';
import { InstitutionDetailModal } from '../components/InstitutionDetailModal';
import { InstitutionActionsDropdown } from '../components/InstitutionActionsDropdown';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type TabType = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'TRASH';

export const InstitutionsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'status' | 'slug'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search input (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Derive query parameters based on tab
  const queryParams = useMemo(() => {
    let statusFilter: InstitutionStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else if (activeTab === 'SUSPENDED') {
      statusFilter = 'SUSPENDED';
    } else if (activeTab === 'TRASH') {
      statusFilter = 'DELETED';
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

  // API Queries
  const {
    data: institutionsData,
    isLoading: isLoadingInstitutions,
    isFetching: isFetchingInstitutions,
    refetch: refetchInstitutions,
  } = useInstitutions(queryParams);

  const { data: globalStats, isLoading: isLoadingStats } = useGlobalInstitutionStats(isSuperAdmin);

  // Mutations
  const softDeleteMutation = useSoftDeleteInstitution();
  const restoreMutation = useRestoreInstitution();
  const permanentDeleteMutation = usePermanentDeleteInstitution();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [statusInstitution, setStatusInstitution] = useState<Institution | null>(null);
  const [brandingInstitution, setBrandingInstitution] = useState<Institution | null>(null);
  const [detailInstitution, setDetailInstitution] = useState<Institution | null>(null);

  // Confirmation Modals State
  const [softDeleteTarget, setSoftDeleteTarget] = useState<Institution | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Institution | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Institution | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedId(slug);
    toast.success(`Copied @${slug}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const institutionsList = institutionsData?.data || [];
  const meta = institutionsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Institutions Directory</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#fff0eb] text-[#ff8a5c] rounded-full border border-[#ff8a5c]/20">
              Multi-Tenant
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage authorized coaching centers, tenant domains, white-label client styling, and lab allocations
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Provision Institution</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Overview Cards (Super Admin) */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Institutions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Centers
              </span>
              <div className="text-2xl font-bold text-gray-900">
                {isLoadingStats ? '—' : globalStats?.totalInstitutions ?? meta.total}
              </div>
              <span className="text-[11px] text-gray-400">Onboarded client tenants</span>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap size={24} />
            </div>
          </div>

          {/* Active Centers */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Active & Operational
              </span>
              <div className="text-2xl font-bold text-emerald-600">
                {isLoadingStats ? '—' : globalStats?.activeInstitutions ?? 0}
              </div>
              <span className="text-[11px] text-emerald-600/80 font-medium">
                Live authentications enabled
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Suspended */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Suspended Centers
              </span>
              <div className="text-2xl font-bold text-amber-600">
                {isLoadingStats ? '—' : globalStats?.suspendedInstitutions ?? 0}
              </div>
              <span className="text-[11px] text-amber-600/80 font-medium">
                Pending renewal or review
              </span>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
          </div>

          {/* Recycle Bin / Trash */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recycle Bin
              </span>
              <div className="text-2xl font-bold text-rose-600">
                {isLoadingStats ? '—' : globalStats?.deletedInstitutions ?? 0}
              </div>
              <span className="text-[11px] text-gray-400">Soft-deleted centers</span>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
              <Trash2 size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter & Tabs Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 self-start">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ALL');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All Centers
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ACTIVE');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('SUSPENDED');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'SUSPENDED'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Suspended
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('TRASH');
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'TRASH'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Trash2 size={13} />
                  <span>Recycle Bin</span>
                  {globalStats && globalStats.deletedInstitutions > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                      {globalStats.deletedInstitutions}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, slug, email..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
                />
              </div>

              {/* Sort By Field */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff8a5c]/30 focus:border-[#ff8a5c]"
              >
                <option value="createdAt">Date Onboarded</option>
                <option value="name">Institution Name</option>
                <option value="status">Status</option>
                <option value="slug">Tenant Slug</option>
              </select>

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={15} />
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => refetchInstitutions()}
                disabled={isFetchingInstitutions}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title="Refresh Table"
              >
                <RefreshCw
                  size={15}
                  className={isFetchingInstitutions ? 'animate-spin text-[#ff8a5c]' : ''}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Center & Tenant Slug</th>
                <th className="py-3.5 px-6">Official Contact</th>
                <th className="py-3.5 px-6">Operational Status</th>
                <th className="py-3.5 px-6">Onboarded</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
              {isLoadingInstitutions ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                        <div className="space-y-1.5">
                          <div className="w-36 h-4 bg-gray-200 rounded" />
                          <div className="w-20 h-3 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-32 h-3.5 bg-gray-200 rounded mb-1" />
                      <div className="w-24 h-3 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-20 h-5 bg-gray-200 rounded-full" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-24 h-3.5 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="w-6 h-6 bg-gray-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : institutionsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
                        <Building2 size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">No institutions found</h3>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? `No institutions matched "${searchTerm}". Try another search term.`
                          : activeTab === 'TRASH'
                          ? 'Recycle bin is completely empty.'
                          : 'Get started by provisioning your first typing training institution.'}
                      </p>
                      {isSuperAdmin && !searchTerm && activeTab !== 'TRASH' && (
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
                        >
                          <Plus size={14} />
                          <span>Provision Center</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                institutionsList.map((inst) => {
                  const isDeleted = !!inst.deletedAt;

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDetailInstitution(inst)}
                    >
                      {/* Name & Slug */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center border border-gray-200 group-hover:border-[#ff8a5c]/40 group-hover:bg-[#fff0eb] group-hover:text-[#ff8a5c] transition-all shrink-0">
                            {inst.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-[#ff8a5c] transition-colors flex items-center gap-2">
                              <span>{inst.name}</span>
                              {inst.phone && (
                                <span className="text-[10px] text-gray-400 hidden sm:inline">
                                  • {inst.phone}
                                </span>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-1.5 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-mono text-gray-400 text-[11px]">
                                @{inst.slug}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopySlug(inst.slug)}
                                className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                                title="Copy slug"
                              >
                                {copiedId === inst.slug ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <a
                            href={`mailto:${inst.email}`}
                            className="text-gray-800 font-medium hover:text-[#ff8a5c] flex items-center gap-1.5 transition-colors truncate max-w-[200px]"
                          >
                            <Mail size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{inst.email}</span>
                          </a>
                          {inst.address && (
                            <div className="text-[11px] text-gray-400 truncate max-w-[220px]">
                              {inst.address}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        {isDeleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Trash2 size={11} />
                            <span>In Trash</span>
                          </span>
                        ) : inst.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Onboarded Date */}
                      <td className="py-3.5 px-6 text-gray-500 text-[11px]">
                        {new Date(inst.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <InstitutionActionsDropdown
                          institution={inst}
                          isSuperAdmin={isSuperAdmin}
                          onView={(target) => setDetailInstitution(target)}
                          onEdit={(target) => setEditingInstitution(target)}
                          onBranding={(target) => setBrandingInstitution(target)}
                          onChangeStatus={(target) => setStatusInstitution(target)}
                          onSoftDelete={(target) => setSoftDeleteTarget(target)}
                          onRestore={(target) => setRestoreTarget(target)}
                          onPermanentDelete={(target) => setPermanentDeleteTarget(target)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-gray-800">
                {Math.min(page * limit, meta.total)}
              </span>{' '}
              of <span className="font-semibold text-gray-800">{meta.total}</span> institutions
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                Page {page} of {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals Orchestration */}

      {/* 1. Provision New Institution */}
      <CreateInstitutionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* 2. Edit Institution Profile */}
      <EditInstitutionModal
        isOpen={!!editingInstitution}
        institution={editingInstitution}
        onClose={() => setEditingInstitution(null)}
      />

      {/* 3. Change Status */}
      <InstitutionStatusModal
        isOpen={!!statusInstitution}
        institution={statusInstitution}
        onClose={() => setStatusInstitution(null)}
      />

      {/* 4. White-Label Branding Studio */}
      <BrandingEditorModal
        isOpen={!!brandingInstitution}
        institution={brandingInstitution}
        onClose={() => setBrandingInstitution(null)}
      />

      {/* 5. 3-Tab Detailed Inspector Dossier */}
      <InstitutionDetailModal
        isOpen={!!detailInstitution}
        institution={detailInstitution}
        onClose={() => setDetailInstitution(null)}
        onOpenEdit={(inst) => setEditingInstitution(inst)}
        onOpenBranding={(inst) => setBrandingInstitution(inst)}
      />

      {/* 6. Soft Delete (Move to Trash) Confirmation */}
      <ConfirmationModal
        isOpen={!!softDeleteTarget}
        title="Move Institution to Trash?"
        description={`Are you sure you want to move "${softDeleteTarget?.name}" to the recycle bin? Its active authentications will be temporarily disabled, but you can restore it at any time.`}
        confirmText="Move to Trash"
        variant="danger"
        isLoading={softDeleteMutation.isPending}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={() => {
          if (!softDeleteTarget) return;
          softDeleteMutation.mutate(softDeleteTarget.id, {
            onSuccess: () => setSoftDeleteTarget(null),
          });
        }}
      />

      {/* 7. Restore from Trash Confirmation */}
      <ConfirmationModal
        isOpen={!!restoreTarget}
        title="Restore Institution from Trash?"
        description={`Restore "${restoreTarget?.name}" back to Active status? The center will immediately regain access to its licenses and tenant configurations.`}
        confirmText="Restore Institution"
        variant="info"
        isLoading={restoreMutation.isPending}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate(restoreTarget.id, {
            onSuccess: () => setRestoreTarget(null),
          });
        }}
      />

      {/* 8. Permanent Purge Confirmation (with typed slug safety!) */}
      <ConfirmationModal
        isOpen={!!permanentDeleteTarget}
        title="Permanently Purge Institution?"
        description={`This action is permanent and IRREVERSIBLE. All student records, licenses, device links, and branding assets for "${permanentDeleteTarget?.name}" will be wiped out completely.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText={permanentDeleteTarget?.slug}
        isLoading={permanentDeleteMutation.isPending}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteMutation.mutate(permanentDeleteTarget.id, {
            onSuccess: () => setPermanentDeleteTarget(null),
          });
        }}
      />
    </div>
  );
};
export default InstitutionsPage;
