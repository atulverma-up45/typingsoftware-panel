import React from 'react';
import { Package, CheckCircle2, FileEdit, Archive } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { ReleaseStats } from '../api/releaseApi';

export type ReleaseStatusTab = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

interface ReleaseStatsCardsProps {
  stats: ReleaseStats;
  isLoadingStats: boolean;
  activeTab: ReleaseStatusTab;
  onTabChange: (tab: ReleaseStatusTab) => void;
}

export const ReleaseStatsCards: React.FC<ReleaseStatsCardsProps> = ({
  stats,
  isLoadingStats,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Builds"
        value={stats.totalReleases}
        type="blue"
        icon={<Package size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Across all channels & arch"
        onClick={() => onTabChange('ALL')}
        active={activeTab === 'ALL'}
      />
      <StatCard
        title="Production Live"
        value={stats.publishedReleases}
        type="emerald"
        icon={<CheckCircle2 size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Actively serving workstations"
        onClick={() => onTabChange('PUBLISHED')}
        active={activeTab === 'PUBLISHED'}
      />
      <StatCard
        title="Draft Packages"
        value={stats.draftReleases}
        type="orange"
        icon={<FileEdit size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Pending staging rollout"
        onClick={() => onTabChange('DRAFT')}
        active={activeTab === 'DRAFT'}
      />
      <StatCard
        title="Archived Versions"
        value={stats.archivedReleases}
        type="coral"
        icon={<Archive size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Deprecated binaries"
        onClick={() => onTabChange('ARCHIVED')}
        active={activeTab === 'ARCHIVED'}
      />
    </div>
  );
};

