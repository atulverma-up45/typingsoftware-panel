import React from 'react';
import { Layers, CheckCircle2, Archive, IndianRupee, Laptop } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { PlanStats } from '../api/planApi';

export type PlanTab = 'ACTIVE' | 'ARCHIVED' | 'ALL' | 'TRASH';

interface PlanStatsCardsProps {
  planStats?: PlanStats;
  isLoadingStats: boolean;
  activeTab: PlanTab;
  onTabChange: (tab: PlanTab) => void;
}

export const PlanStatsCards: React.FC<PlanStatsCardsProps> = ({
  planStats,
  isLoadingStats,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Tiers"
        value={planStats?.totalPlans || 0}
        type="purple"
        isLoading={isLoadingStats}
        icon={<Layers size={24} className="text-white" />}
        subtitle="All created catalog plans"
        onClick={() => onTabChange('ALL')}
        active={activeTab === 'ALL'}
      />

      <StatCard
        title="Active Catalog"
        value={planStats?.activePlans || 0}
        type="emerald"
        isLoading={isLoadingStats}
        icon={<CheckCircle2 size={24} className="text-white" />}
        subtitle="Assignable commercial tiers"
        onClick={() => onTabChange('ACTIVE')}
        active={activeTab === 'ACTIVE'}
      />

      <StatCard
        title="Archived Tiers"
        value={planStats?.archivedPlans || 0}
        type="coral"
        isLoading={isLoadingStats}
        icon={<Archive size={24} className="text-white" />}
        subtitle="Deprecated / legacy tiers"
        onClick={() => onTabChange('ARCHIVED')}
        active={activeTab === 'ARCHIVED'}
      />

      <StatCard
        title="Avg Plan Price"
        value={
          isLoadingStats
            ? '...'
            : `₹${((planStats?.averagePrice || 0) / 100).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}`
        }
        type="orange"
        isLoading={isLoadingStats}
        icon={<IndianRupee size={24} className="text-white" />}
        subtitle="Mean catalog pricing"
      />

      <StatCard
        title="Avg Workstations"
        value={
          isLoadingStats
            ? '...'
            : planStats?.averageMaxActivations
            ? Math.round(planStats.averageMaxActivations)
            : 0
        }
        type="blue"
        isLoading={isLoadingStats}
        icon={<Laptop size={24} className="text-white" />}
        subtitle="Mean PCs per license"
      />
    </div>
  );
};

