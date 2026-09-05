import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  FileEdit,
  Archive,
  Layers,
  Search,
  Plus,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Cpu,
  Laptop,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/features/dashboard/components/StatCard';
import {
  useReleases,
  useReleaseStats,
  usePublishRelease,
  useDeleteRelease,
} from '../api/releaseApi';
import type {
  Release,
  ReleaseChannel,
  ReleasePlatform,
  ReleaseStatus,
} from '../api/releaseApi';
import { ReleaseCard } from '../components/ReleaseCard';
import { CreateReleaseModal } from '../components/CreateReleaseModal';
import { EditReleaseModal } from '../components/EditReleaseModal';
import { ReleaseDetailModal } from '../components/ReleaseDetailModal';
import { ReleaseStatusModal } from '../components/ReleaseStatusModal';
import { ClientUpdateSimulatorModal } from '../components/ClientUpdateSimulatorModal';
import { ReleaseActionsDropdown } from '../components/ReleaseActionsDropdown';
import { ConfirmationModal } from '@/features/users/components/ConfirmationModal';
import { toast } from 'sonner';

type StatusTab = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
type ViewMode = 'CARDS' | 'TABLE';

export const ReleasesPage: React.FC = () => {
  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'version' | 'publishedAt' | 'fileSize'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [inspectingRelease, setInspectingRelease] = useState<Release | null>(null);
  const [statusRelease, setStatusRelease] = useState<Release | null>(null);
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Queries & Mutations
  const queryParams = {
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status: activeTab !== 'ALL' ? (activeTab as ReleaseStatus) : undefined,
    channel: selectedChannel !== 'ALL' ? (selectedChannel as ReleaseChannel) : undefined,
    platform: selectedPlatform !== 'ALL' ? (selectedPlatform as ReleasePlatform) : undefined,
    sortBy,
    sortOrder,
  };

  const {
    data: releasesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useReleases(queryParams);
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useReleaseStats();

  const handleRefreshAll = () => {
    refetchStats();
    refetch();
  };

  const publishMutation = usePublishRelease();
  const deleteMutation = useDeleteRelease();

  const releases = releasesData?.data || [];
  const meta = releasesData?.meta || { page: 1, limit: 12, total: 0, totalPages: 1 };
  const stats = statsData || {
    totalReleases: 0,
    publishedReleases: 0,
    draftReleases: 0,
    archivedReleases: 0,
    stableReleases: 0,
    betaReleases: 0,
  };

  const handleExportCsv = () => {
    if (!releases.length) {
      toast.error('No releases available to export');
      return;
    }
    const headers = [
      'Release ID',
      'Version',
      'Platform',
      'Channel',
      'Mandatory',
      'Min Supported Version',
      'File Size (Bytes)',
      'SHA-256 Checksum',
      'Status',
      'Created At',
    ];
    const rows = releases.map((rel) => [
      `"${rel.id}"`,
      `"${rel.version}"`,
      `"${rel.platform}"`,
      `"${rel.channel}"`,
      `"${rel.mandatory ? 'YES' : 'NO'}"`,
      `"${rel.minSupportedVersion}"`,
      `"${rel.fileSize}"`,
      `"${rel.checksum}"`,
      `"${rel.status}"`,
      `"${new Date(rel.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `software-releases-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Software releases exported to CSV');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyHash = (id: string, hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    toast.success('SHA-256 checksum copied');
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleDeleteConfirm = () => {
    if (!releaseToDelete) return;
    deleteMutation.mutate(releaseToDelete.id, {
      onSuccess: () => {
        setReleaseToDelete(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Package className="text-[#ff8a5c]" size={28} />
            Software Releases & Updates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage desktop software distribution binaries, auto-updater rules, and version channels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            title="Export software releases to CSV"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            title="Refresh Releases & Statistics"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#ff8a5c]' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsSimulatorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs"
          >
            <Laptop size={15} />
            Test Client Auto-Updater
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] shadow-xs transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Software Release
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Releases"
          value={stats.totalReleases}
          type="blue"
          icon={<Package size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Across all channels & arch"
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
          active={activeTab === 'ALL'}
        />
        <StatCard
          title="Production Live"
          value={stats.publishedReleases}
          type="emerald"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Actively serving workstations"
          onClick={() => {
            setActiveTab('PUBLISHED');
            setPage(1);
          }}
          active={activeTab === 'PUBLISHED'}
        />
        <StatCard
          title="Draft Packages"
          value={stats.draftReleases}
          type="orange"
          icon={<FileEdit size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Pending staging rollout"
          onClick={() => {
            setActiveTab('DRAFT');
            setPage(1);
          }}
          active={activeTab === 'DRAFT'}
        />
        <StatCard
          title="Archived Versions"
          value={stats.archivedReleases}
          type="coral"
          icon={<Archive size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Deprecated binaries"
          onClick={() => {
            setActiveTab('ARCHIVED');
            setPage(1);
          }}
          active={activeTab === 'ARCHIVED'}
        />
      </div>

      {/* Error Alert Banner with Retry */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>
              Failed to load software releases:{' '}
              {error instanceof Error ? error.message : 'Network error'}
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

      {/* Filter Toolbar & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-fit">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as StatusTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab === 'ALL' ? 'All Builds' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search and Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search version, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#ff8a5c]"
              />
            </div>

            {/* Channel Filter */}
            <select
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="ALL">All Channels</option>
              <option value="stable">Stable Only</option>
              <option value="beta">Beta Only</option>
            </select>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="ALL">All Platforms</option>
              <option value="windows-x64">Windows (x64)</option>
              <option value="windows-arm64">Windows (ARM64)</option>
              <option value="windows-x86">Windows (x86)</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="createdAt">Date Created</option>
              <option value="version">Version</option>
              <option value="publishedAt">Publish Date</option>
              <option value="fileSize">File Size</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Card View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-white border border-gray-100 p-5 shadow-2xs animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded-md w-1/3" />
                <div className="h-4 bg-gray-100 rounded-md w-2/3" />
                <div className="h-16 bg-gray-50 rounded-xl" />
              </div>
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Software Releases Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {searchTerm || selectedChannel !== 'ALL' || selectedPlatform !== 'ALL'
              ? 'No release builds match your applied filter criteria.'
              : 'Deploy your first client installer package to begin servicing workstation fleets.'}
          </p>
          {!searchTerm && selectedChannel === 'ALL' && selectedPlatform === 'ALL' && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] shadow-xs transition-colors"
            >
              <Plus size={15} strokeWidth={2.5} />
              Publish First Release
            </button>
          )}
        </div>
      ) : viewMode === 'CARDS' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {releases.map((rel) => (
            <ReleaseCard
              key={rel.id}
              release={rel}
              onEdit={(r) => setEditingRelease(r)}
              onStatusChange={(r) => setStatusRelease(r)}
              onPublish={(id) => publishMutation.mutate(id)}
              onViewDetails={(r) => setInspectingRelease(r)}
              onDelete={(r) => setReleaseToDelete(r)}
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
                  <th className="py-3 px-4">Version & Platform</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Size & Checksum</th>
                  <th className="py-3 px-4">Upgrade Policy</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {releases.map((rel) => (
                  <tr key={rel.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center shrink-0">
                          <Package size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">v{rel.version}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{rel.platform}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          rel.channel === 'stable'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {rel.channel.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          rel.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rel.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rel.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-gray-800">
                          {formatBytes(rel.fileSize)}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                          <span>{rel.checksum.slice(0, 10)}...</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyHash(rel.id, rel.checksum, e)}
                            className="text-gray-400 hover:text-[#ff8a5c]"
                            title="Copy SHA-256"
                          >
                            {copiedHashId === rel.id ? (
                              <Check size={11} className="text-emerald-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {rel.mandatory ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertTriangle size={10} />
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Optional</span>
                      )}
                      <div className="text-[10px] text-gray-400">Min: v{rel.minSupportedVersion}</div>
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      {rel.publishedAt ? (
                        <div>
                          <span className="font-medium text-gray-800">
                            {new Date(rel.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-gray-400">Not published</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const downloadUrl = `/api/uploads/files/${encodeURIComponent(rel.fileKey)}`;
                            window.open(downloadUrl, '_blank');
                          }}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download binary"
                        >
                          <Download size={14} />
                        </button>
                        <ReleaseActionsDropdown
                          release={rel}
                          onViewDetails={(r) => setInspectingRelease(r)}
                          onEdit={(r) => setEditingRelease(r)}
                          onStatusChange={(r) => setStatusRelease(r)}
                          onPublish={(id) => publishMutation.mutate(id)}
                          onDelete={(r) => setReleaseToDelete(r)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(page * limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{meta.total}</span> releases
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2 text-gray-700">
              Page {page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateReleaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditReleaseModal
        isOpen={!!editingRelease}
        onClose={() => setEditingRelease(null)}
        release={editingRelease}
      />

      <ReleaseDetailModal
        isOpen={!!inspectingRelease}
        onClose={() => setInspectingRelease(null)}
        release={inspectingRelease}
      />

      <ReleaseStatusModal
        isOpen={!!statusRelease}
        onClose={() => setStatusRelease(null)}
        release={statusRelease}
      />

      <ClientUpdateSimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={!!releaseToDelete}
        onClose={() => setReleaseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Software Release"
        description={`Are you sure you want to delete release v${releaseToDelete?.version || ''}? Workstations querying this version will no longer be able to download the installer.`}
        confirmText="Permanently Delete"
        variant="critical"
        requireConfirmationText="DELETE"
      />
    </div>
  );
};
export default ReleasesPage;

