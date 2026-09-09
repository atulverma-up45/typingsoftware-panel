import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Layers,
  Languages,
  Clock,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Filter,
  Sliders,
  Type,
  Download,
  AlertCircle,
  Lock,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/lib/permissions';
import {
  useContentList,
  useContentStats,
  useSoftDeleteContent,
  useRestoreContent,
  usePermanentDeleteContent,
} from '../api/contentApi';
import type {
  ContentItem,
  ContentType,
  ContentDifficulty,
  ContentStatus,
} from '../api/contentApi';
import { useModules } from '@/features/modules/api/moduleApi';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { CreateContentModal } from '../components/CreateContentModal';
import { EditContentModal } from '../components/EditContentModal';
import { ContentDetailModal } from '../components/ContentDetailModal';
import { ContentStatusModal } from '../components/ContentStatusModal';
import { ContentActionsDropdown } from '../components/ContentActionsDropdown';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type ContentTab = 'PUBLISHED' | 'DRAFT' | 'ALL' | 'TRASH';

export const ContentPage: React.FC = () => {
  const { isSuperAdmin, isSupport } = usePermissions();

  // Filters & State
  const [activeTab, setActiveTab] = useState<ContentTab>('PUBLISHED');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | ''>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ContentDifficulty | ''>('');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'difficulty' | 'version' | 'durationMinutes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [inspectingItem, setInspectingItem] = useState<ContentItem | null>(null);
  const [statusItem, setStatusItem] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [itemToRestore, setItemToRestore] = useState<ContentItem | null>(null);
  const [itemToPurge, setItemToPurge] = useState<ContentItem | null>(null);

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
    let statusFilter: ContentStatus | undefined = undefined;
    let includeDeleted = false;

    if (activeTab === 'PUBLISHED') {
      statusFilter = 'PUBLISHED';
    } else if (activeTab === 'DRAFT') {
      statusFilter = 'DRAFT';
    } else if (activeTab === 'TRASH') {
      includeDeleted = true;
    }

    return {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      moduleId: selectedModuleId || undefined,
      contentType: (selectedContentType as ContentType) || undefined,
      language: selectedLanguage || undefined,
      difficulty: (selectedDifficulty as ContentDifficulty) || undefined,
      status: statusFilter,
      institutionId: selectedInstitutionId || undefined,
      includeDeleted,
      sortBy,
      sortOrder,
    };
  }, [
    page,
    limit,
    debouncedSearch,
    activeTab,
    selectedModuleId,
    selectedContentType,
    selectedLanguage,
    selectedDifficulty,
    selectedInstitutionId,
    sortBy,
    sortOrder,
  ]);

  // Queries
  const {
    data: contentResponse,
    isLoading: isLoadingContent,
    isFetching: isFetchingContent,
    isError: isContentError,
    error: contentError,
    refetch: refetchContent,
  } = useContentList(queryParams);

  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useContentStats();

  const handleRefreshAll = () => {
    refetchStats();
    refetchContent();
  };

  const { data: modulesData } = useModules({ limit: 100, status: 'ACTIVE' });
  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });

  const modules = modulesData?.data || [];
  const institutions = institutionsData?.data || [];

  // Mutations
  const softDeleteMutation = useSoftDeleteContent();
  const restoreMutation = useRestoreContent();
  const permanentDeleteMutation = usePermanentDeleteContent();

  const contentItems = contentResponse?.data || [];
  const meta = contentResponse?.meta;

  const handleExportCsv = () => {
    if (!contentItems.length) {
      toast.error('No content items available to export');
      return;
    }
    const headers = [
      'Content ID',
      'Title',
      'Content Type',
      'Language',
      'Difficulty',
      'Duration (Mins)',
      'Module',
      'Institution',
      'Status',
      'Created At',
      'Updated At',
    ];
    const rows = contentItems.map((item) => [
      `"${item.id}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.contentType}"`,
      `"${item.language}"`,
      `"${item.difficulty}"`,
      `"${item.durationMinutes}"`,
      `"${item.module?.name || modules.find((m) => m.id === item.moduleId)?.name || item.moduleId}"`,
      `"${item.institution?.name || institutions.find((i) => i.id === item.institutionId)?.name || 'Global'}"`,
      `"${item.status}"`,
      `"${new Date(item.createdAt).toISOString()}"`,
      `"${new Date(item.updatedAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `content-passages-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Content items exported to CSV');
  };

  // Handlers
  const handleConfirmSoftDelete = async () => {
    if (!itemToDelete) return;
    try {
      await softDeleteMutation.mutateAsync(itemToDelete.id);
      setItemToDelete(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmRestore = async () => {
    if (!itemToRestore) return;
    try {
      await restoreMutation.mutateAsync(itemToRestore.id);
      setItemToRestore(null);
    } catch {
      // Handled by hook
    }
  };

  const handleConfirmPermanentPurge = async () => {
    if (!itemToPurge) return;
    try {
      await permanentDeleteMutation.mutateAsync(itemToPurge.id);
      setItemToPurge(null);
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Educational Content & Passages"
        subtitle="Manage practice exercises, bilingual typing lessons, official exam test sets, and scoring rules"
        icon={<FileText className="text-[#ff8a5c]" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Export educational content to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingContent}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Refresh Content & Statistics"
            >
              <RefreshCw size={14} className={isFetchingContent ? 'animate-spin text-[#ff8a5c]' : ''} />
              Refresh
            </button>

            {!isSuperAdmin ? (
              <div
                title="Curriculum typing passages are centrally managed by Super Admin. Read-only for school administrators and support."
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} />
                <span>Create Content (Locked)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm hover:shadow"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Content
              </button>
            )}
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Content Items"
          value={statsData?.totalContentItems || 0}
          type="blue"
          icon={<FileText size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="All Exercises & Lessons"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          active={activeTab === 'ALL'}
        />
        <StatCard
          title="Published Passages"
          value={statsData?.publishedItems || 0}
          type="emerald"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Live in Desktop Clients"
          onClick={() => {
            setActiveTab('PUBLISHED');
            setPage(1);
          }}
          active={activeTab === 'PUBLISHED'}
        />
        <StatCard
          title="Draft Content"
          value={statsData?.draftItems || 0}
          type="orange"
          icon={<Clock size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Pending Instructor Review"
          onClick={() => {
            setActiveTab('DRAFT');
            setPage(1);
          }}
          active={activeTab === 'DRAFT'}
        />
        <StatCard
          title="Archived / Retired"
          value={statsData?.archivedItems || 0}
          type="coral"
          icon={<Trash2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Recycle Bin & Old Versions"
          onClick={() => {
            setActiveTab('TRASH');
            setPage(1);
          }}
          active={activeTab === 'TRASH'}
        />
      </div>

      {/* Error Alert Banner with Retry */}
      {isContentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to load educational content:{' '}
              {contentError instanceof Error ? contentError.message : 'Network error'}
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
            { id: 'PUBLISHED', label: 'Published Passages', count: statsData?.publishedItems },
            { id: 'DRAFT', label: 'Drafts', count: statsData?.draftItems },
            { id: 'ALL', label: 'All Content', count: statsData?.totalContentItems },
            { id: 'TRASH', label: 'Recycle Bin' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as ContentTab);
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
        searchPlaceholder="Search exercises by title or text snippet... (Press / to focus)"
        activeChips={[
          ...(selectedModuleId
            ? [
                {
                  id: 'module',
                  label: 'Module',
                  value: modules.find((m) => m.id === selectedModuleId)?.name || selectedModuleId,
                  onRemove: () => {
                    setSelectedModuleId('');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedContentType
            ? [
                {
                  id: 'type',
                  label: 'Type',
                  value: selectedContentType,
                  onRemove: () => {
                    setSelectedContentType('');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedLanguage
            ? [
                {
                  id: 'language',
                  label: 'Language',
                  value: selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage,
                  onRemove: () => {
                    setSelectedLanguage('');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedDifficulty
            ? [
                {
                  id: 'difficulty',
                  label: 'Difficulty',
                  value: selectedDifficulty,
                  onRemove: () => {
                    setSelectedDifficulty('');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          selectedModuleId ||
            selectedContentType ||
            selectedLanguage ||
            selectedDifficulty ||
            searchTerm ||
            sortBy !== 'createdAt' ||
            sortOrder !== 'desc'
        )}
        onClearFilters={() => {
          setSelectedModuleId('');
          setSelectedContentType('');
          setSelectedLanguage('');
          setSelectedDifficulty('');
          setSearchTerm('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        totalResults={meta?.total}
        totalLabel="Exercises"
        filterElements={
          <>
            {/* Module Filter */}
            <FilterSelect
              icon={<Layers size={13} />}
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setPage(1);
              }}
              title="Filter by Module"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </FilterSelect>

            {/* Type Filter */}
            <FilterSelect
              value={selectedContentType}
              onChange={(e) => {
                setSelectedContentType(e.target.value as ContentType);
                setPage(1);
              }}
              title="Filter by Content Type"
            >
              <option value="">All Content Types</option>
              <option value="PASSAGE">Practice Passage</option>
              <option value="EXAM_PAPER">Exam Paper</option>
              <option value="LESSON">Lesson</option>
              <option value="PRACTICE_SET">Practice Set</option>
              <option value="VOCATIONAL_COURSE">Vocational Course</option>
            </FilterSelect>

            {/* Language Filter */}
            <FilterSelect
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setPage(1);
              }}
              title="Filter by Language"
            >
              <option value="">All Languages</option>
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
            </FilterSelect>

            {/* Difficulty Filter */}
            <FilterSelect
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value as ContentDifficulty);
                setPage(1);
              }}
              title="Filter by Difficulty"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
              <option value="EXAM">EXAM</option>
            </FilterSelect>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <FilterSelect
                icon={<ArrowUpDown size={13} />}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                title="Sort by Attribute"
              >
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="durationMinutes">Duration</option>
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

      {/* Content Table */}
      {isLoadingContent ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center mb-3">
            <FileText size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Content Items Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
            {debouncedSearch
              ? `No content items matched search "${debouncedSearch}".`
              : activeTab === 'TRASH'
              ? 'The recycle bin is currently empty.'
              : 'Create typing exercise passages and official exam papers for students.'}
          </p>
          {activeTab !== 'TRASH' && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              Draft First Content Item
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          {/* Mobile Card List or Cards Grid Mode */}
          <div className={viewMode === 'CARDS' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-3.5 sm:p-4' : 'md:hidden divide-y divide-gray-100'}>
            {contentItems.map((item) => {
              const payload = item.payload || {};
              const words =
                payload.wordsCount ||
                (payload.text ? payload.text.trim().split(/\s+/).filter(Boolean).length : 0);
              const isHindi = item.language?.startsWith('hi');

              return (
                <div
                  key={item.id}
                  onClick={() => setInspectingItem(item)}
                  className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isHindi
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {item.language.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {item.module?.name || modules.find((m) => m.id === item.moduleId)?.name || 'Module'} • v{item.version}.0
                        </span>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <ContentActionsDropdown
                        item={item}
                        onViewDetails={(i) => setInspectingItem(i)}
                        onEdit={(i) => setEditingItem(i)}
                        onChangeStatus={(i) => setStatusItem(i)}
                        onDelete={(i) => {
                          if (activeTab === 'TRASH') {
                            setItemToPurge(i);
                          } else {
                            setItemToDelete(i);
                          }
                        }}
                        onRestore={activeTab === 'TRASH' ? (i) => setItemToRestore(i) : undefined}
                        isDeletedView={activeTab === 'TRASH'}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.difficulty === 'EASY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.difficulty === 'MEDIUM'
                          ? 'bg-blue-100 text-blue-800'
                          : item.difficulty === 'HARD'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {item.difficulty}
                    </span>

                    <span className="text-gray-500 font-medium flex items-center gap-1 text-[11px]">
                      <Clock size={12} className="text-gray-400" />
                      {item.durationMinutes} min
                    </span>

                    <span className="text-gray-600 font-medium text-[11px] bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {words} words
                    </span>

                    <div className="ml-auto">
                      <StatusBadge
                        status={item.deletedAt ? 'TRASH' : item.status}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className={viewMode === 'CARDS' ? 'hidden' : 'hidden md:block overflow-x-auto custom-scrollbar'}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Format</th>
                  <th className="py-3 px-4">Module Category</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Difficulty / Duration</th>
                  <th className="py-3 px-4">Words Count</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {contentItems.map((item) => {
                  const payload = item.payload || {};
                  const words =
                    payload.wordsCount ||
                    (payload.text ? payload.text.trim().split(/\s+/).filter(Boolean).length : 0);

                  const isHindi = item.language?.startsWith('hi');

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Title & Format */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900">{item.title}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isHindi
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                {item.language.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {item.contentType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Module Category */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800 block">
                          {item.module?.name || item.moduleId}
                        </span>
                        <span className="font-mono text-[11px] text-gray-400">
                          {item.module?.key || 'module'}
                        </span>
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        {item.institutionId ? (
                          <span className="inline-flex items-center gap-1 font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                            <Building2 size={12} />
                            {item.institution?.name || 'Custom Tenant'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                            <Sparkles size={12} />
                            Global Platform
                          </span>
                        )}
                      </td>

                      {/* Difficulty / Duration */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.difficulty === 'EASY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.difficulty === 'MEDIUM'
                                ? 'bg-blue-100 text-blue-800'
                                : item.difficulty === 'HARD'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {item.difficulty}
                          </span>
                          <span className="text-gray-500 font-medium flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {item.durationMinutes} min
                          </span>
                        </div>
                      </td>

                      {/* Words Count */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800">
                          {words} Words
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={item.deletedAt ? 'TRASH' : item.status}
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <ContentActionsDropdown
                          item={item}
                          onViewDetails={(i) => setInspectingItem(i)}
                          onEdit={(i) => setEditingItem(i)}
                          onChangeStatus={(i) => setStatusItem(i)}
                          onDelete={(i) => {
                            if (activeTab === 'TRASH') {
                              setItemToPurge(i);
                            } else {
                              setItemToDelete(i);
                            }
                          }}
                          onRestore={activeTab === 'TRASH' ? (i) => setItemToRestore(i) : undefined}
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
        itemName="content items"
      />

      {/* Modals */}
      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditContentModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
      />

      <ContentDetailModal
        isOpen={!!inspectingItem}
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
      />

      <ContentStatusModal
        isOpen={!!statusItem}
        item={statusItem}
        onClose={() => setStatusItem(null)}
      />

      {/* Confirmation: Soft Delete */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        title="Move Content to Trash?"
        description={`Are you sure you want to move exercise "${itemToDelete?.title}" to trash? Historical student test scores will be preserved.`}
        confirmText="Move to Trash"
        variant="warning"
        isLoading={softDeleteMutation.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setItemToDelete(null)}
      />

      {/* Confirmation: Restore */}
      <ConfirmationModal
        isOpen={!!itemToRestore}
        title="Restore Content Item?"
        description={`Do you want to restore exercise "${itemToRestore?.title}" back to published catalog?`}
        confirmText="Restore Content"
        variant="info"
        isLoading={restoreMutation.isPending}
        onConfirm={handleConfirmRestore}
        onClose={() => setItemToRestore(null)}
      />

      {/* Confirmation: Permanent Purge */}
      <ConfirmationModal
        isOpen={!!itemToPurge}
        title="Permanently Purge Content Item?"
        description={`WARNING: This action is permanent and cannot be undone. Content item "${itemToPurge?.title}" (${itemToPurge?.id}) will be permanently deleted from database records.`}
        confirmText="Permanently Purge"
        variant="critical"
        requireConfirmationText="DELETE"
        isLoading={permanentDeleteMutation.isPending}
        onConfirm={handleConfirmPermanentPurge}
        onClose={() => setItemToPurge(null)}
      />
    </div>
  );
};

export default ContentPage;

