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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Sliders,
  Type,
  Download,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
import { useAuthStore } from '@/stores/auth.store';
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
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0eb] text-[#ff8a5c]">
              <FileText size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Educational Content & Passages
              </h1>
              <p className="text-xs text-gray-500">
                Manage practice exercises, bilingual typing lessons, official exam test sets, and scoring rules
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#f27b4d] rounded-xl transition-colors shadow-sm hover:shadow"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Content Item
          </button>
        </div>
      </div>

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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises by title or text snippet..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff8a5c] focus:ring-2 focus:ring-[#ff8a5c]/20 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Module Filter */}
          <div className="flex items-center gap-1">
            <Layers size={14} className="text-gray-400" />
            <select
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={selectedContentType}
            onChange={(e) => {
              setSelectedContentType(e.target.value as ContentType);
              setPage(1);
            }}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff8a5c]"
          >
            <option value="">All Content Types</option>
            <option value="PASSAGE">Practice Passage</option>
            <option value="EXAM_PAPER">Exam Paper</option>
            <option value="LESSON">Lesson</option>
            <option value="PRACTICE_SET">Practice Set</option>
            <option value="VOCATIONAL_COURSE">Vocational Course</option>
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff8a5c]"
          >
            <option value="">All Languages</option>
            <option value="en">English (en)</option>
            <option value="hi">Hindi (hi)</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value as ContentDifficulty);
              setPage(1);
            }}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff8a5c]"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
            <option value="EXAM">EXAM</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="difficulty">Difficulty</option>
              <option value="durationMinutes">Duration</option>
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
          <div className="overflow-x-auto custom-scrollbar">
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
                        {item.deletedAt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            In Trash
                          </span>
                        ) : item.status === 'PUBLISHED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Published
                          </span>
                        ) : item.status === 'DRAFT' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Archived
                          </span>
                        )}
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
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200/80 pt-4 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">{(meta.page - 1) * meta.limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(meta.page * meta.limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{meta.total}</span> items
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

