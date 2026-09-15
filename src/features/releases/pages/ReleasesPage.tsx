import React, { useState } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Cpu,
  Download,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { exportCsv } from '@/lib/exportCsv';
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
import { ReleaseStatsCards, type ReleaseStatusTab } from '../components/ReleaseStatsCards';
import { ReleaseTableView } from '../components/ReleaseTableView';
import { ReleaseModalsCoordinator } from '../components/ReleaseModalsCoordinator';
import { toast } from 'sonner';

type ViewMode = 'CARDS' | 'TABLE';

export const ReleasesPage: React.FC = () => {
  const { isSuperAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState<ReleaseStatusTab>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
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

  useOnDepChange(debouncedSearch, () => setPage(1));

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

  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useReleaseStats(isSuperAdmin);

  const handleRefreshAll = () => {
    if (isSuperAdmin) refetchStats();
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
    exportCsv(
      `software-releases-export-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { header: 'Release ID', accessor: 'id' },
        { header: 'Version', accessor: 'version' },
        { header: 'Platform', accessor: 'platform' },
        { header: 'Channel', accessor: 'channel' },
        { header: 'Mandatory', accessor: (rel) => (rel.mandatory ? 'YES' : 'NO') },
        { header: 'Min Supported Version', accessor: 'minSupportedVersion' },
        { header: 'File Size (Bytes)', accessor: 'fileSize' },
        { header: 'SHA-256 Checksum', accessor: 'checksum' },
        { header: 'Status', accessor: 'status' },
        { header: 'Created At', accessor: (rel) => new Date(rel.createdAt).toISOString() },
        { header: 'Published At', accessor: (rel) => (rel.publishedAt ? new Date(rel.publishedAt).toISOString() : '') },
      ],
      releases,
    );
    toast.success('Software releases exported to CSV');
  };

  const handleCopyHash = (id: string, hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    toast.success('SHA-256 checksum copied to clipboard');
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleDeleteConfirm = () => {
    if (releaseToDelete) {
      deleteMutation.mutate(releaseToDelete.id, {
        onSuccess: () => setReleaseToDelete(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Electron App Releases & OTAs"
        subtitle="Manage desktop binary builds, update channels, SHA-512 signatures, and rollout policies"
        icon={<Package className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Export releases to CSV"
            >
              <Download size={14} className="text-gray-500" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => setIsSimulatorModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            >
              <Cpu size={14} className="text-gray-500" />
              OTA Simulator
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white shadow-2xs"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>

            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-colors"
              >
                <Plus size={16} strokeWidth={2.5} />
                Deploy New Release
              </button>
            ) : (
              <div
                title="Release publishing is restricted to Super Admin."
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} />
                <span>Deploy Release (Super Admin)</span>
              </div>
            )}
          </>
        }
      />

      {/* Metric Cards */}
      <ReleaseStatsCards
        stats={stats}
        isLoadingStats={isLoadingStats}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
      />

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

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-fit overflow-x-auto custom-scrollbar">
        {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as ReleaseStatusTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab === 'ALL' ? 'All Builds' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search version, notes, checksum... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeChips={[
          ...(selectedChannel !== 'ALL'
            ? [
                {
                  id: 'channel',
                  label: 'Channel',
                  value: selectedChannel.toUpperCase(),
                  onRemove: () => setSelectedChannel('ALL'),
                },
              ]
            : []),
          ...(selectedPlatform !== 'ALL'
            ? [
                {
                  id: 'platform',
                  label: 'Platform',
                  value: selectedPlatform,
                  onRemove: () => setSelectedPlatform('ALL'),
                },
              ]
            : []),
          ...(sortBy !== 'createdAt'
            ? [
                {
                  id: 'sort',
                  label: 'Sort By',
                  value: sortBy,
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
        hasActiveFilters={Boolean(
          searchTerm ||
            selectedChannel !== 'ALL' ||
            selectedPlatform !== 'ALL' ||
            sortBy !== 'createdAt' ||
            sortOrder !== 'desc'
        )}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedChannel('ALL');
          setSelectedPlatform('ALL');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        totalResults={releases.length}
        totalLabel="Releases"
        filterElements={
          <>
            {/* Channel Filter */}
            <FilterSelect
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setPage(1);
              }}
              title="Filter by Release Channel"
            >
              <option value="ALL">All Channels</option>
              <option value="stable">Stable</option>
              <option value="beta">Beta</option>
            </FilterSelect>

            {/* Platform Filter */}
            <FilterSelect
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setPage(1);
              }}
              title="Filter by Target Platform"
            >
              <option value="ALL">All Platforms</option>
              <option value="windows-x64">Windows (x64)</option>
              <option value="windows-arm64">Windows (ARM64)</option>
              <option value="windows-x86">Windows (x86)</option>
            </FilterSelect>

            {/* Sorting */}
            <FilterSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort by Attribute"
            >
              <option value="createdAt">Date Created</option>
              <option value="version">Version</option>
              <option value="publishedAt">Publish Date</option>
              <option value="fileSize">File Size</option>
            </FilterSelect>
          </>
        }
      />

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
          {!searchTerm && selectedChannel === 'ALL' && selectedPlatform === 'ALL' &&
            (isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors"
              >
                <Plus size={15} strokeWidth={2.5} />
                Publish First Release
              </button>
            ) : (
              <p className="mt-4 text-xs text-gray-400">
                Release publishing is restricted to Super Admins.
              </p>
            ))}
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
        /* TABLE VIEW WITH MOBILE DUAL-MODE */
        <div>
          <div className="md:hidden grid grid-cols-1 gap-4 mb-4">
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
          <ReleaseTableView
            releases={releases}
            copiedHashId={copiedHashId}
            onCopyHash={handleCopyHash}
            onViewDetails={(r) => setInspectingRelease(r)}
            onEdit={(r) => setEditingRelease(r)}
            onStatusChange={(r) => setStatusRelease(r)}
            onPublish={(id) => publishMutation.mutate(id)}
            onDelete={(r) => setReleaseToDelete(r)}
          />
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        itemName="releases"
      />

      {/* Modals */}
      <ReleaseModalsCoordinator
        isCreateModalOpen={isCreateModalOpen}
        isSimulatorModalOpen={isSimulatorModalOpen}
        editingRelease={editingRelease}
        inspectingRelease={inspectingRelease}
        statusRelease={statusRelease}
        releaseToDelete={releaseToDelete}
        onCloseCreate={() => setIsCreateModalOpen(false)}
        onCloseSimulator={() => setIsSimulatorModalOpen(false)}
        onCloseEdit={() => setEditingRelease(null)}
        onCloseDetails={() => setInspectingRelease(null)}
        onCloseStatus={() => setStatusRelease(null)}
        onCloseDelete={() => setReleaseToDelete(null)}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  );
};

export default ReleasesPage;
