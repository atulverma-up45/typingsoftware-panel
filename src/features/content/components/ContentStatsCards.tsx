import React from 'react';
import { FileText, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { ContentStats } from '../api/contentApi';

export type ContentTab = 'PUBLISHED' | 'DRAFT' | 'ALL' | 'TRASH';

interface ContentStatsCardsProps {
  statsData?: ContentStats;
  isLoading: boolean;
  activeTab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
}

export const ContentStatsCards: React.FC<ContentStatsCardsProps> = ({
  statsData,
  isLoading,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Content Items"
        value={statsData?.totalContentItems || 0}
        type="blue"
        icon={<FileText size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="All Exercises & Lessons"
        onClick={() => onTabChange('ALL')}
        active={activeTab === 'ALL'}
      />
      <StatCard
        title="Published Passages"
        value={statsData?.publishedItems || 0}
        type="emerald"
        icon={<CheckCircle2 size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Live in Desktop Clients"
        onClick={() => onTabChange('PUBLISHED')}
        active={activeTab === 'PUBLISHED'}
      />
      <StatCard
        title="Draft Content"
        value={statsData?.draftItems || 0}
        type="orange"
        icon={<Clock size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Pending Instructor Review"
        onClick={() => onTabChange('DRAFT')}
        active={activeTab === 'DRAFT'}
      />
      <StatCard
        title="Archived / Retired"
        value={statsData?.archivedItems || 0}
        type="coral"
        icon={<Trash2 size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Recycle Bin & Old Versions"
        onClick={() => onTabChange('TRASH')}
        active={activeTab === 'TRASH'}
      />
    </div>
  );
};

