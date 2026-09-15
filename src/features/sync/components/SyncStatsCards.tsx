import React from 'react';
import { RefreshCw, Activity, Laptop } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { SyncMetrics } from '../api/syncApi';

interface SyncStatsCardsProps {
  stats: SyncMetrics;
  isLoadingStats: boolean;
}

export const SyncStatsCards: React.FC<SyncStatsCardsProps> = ({
  stats,
  isLoadingStats,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Total Operations"
        value={stats.totalSyncOperations}
        type="blue"
        icon={<RefreshCw size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Processed delta sync mutations"
      />
      <StatCard
        title="Last 24 Hours"
        value={stats.syncsLast24Hours}
        type="emerald"
        icon={<Activity size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Real-time ingest volume"
      />
      <StatCard
        title="Connected Workstations"
        value={stats.distinctDevicesSynced}
        type="orange"
        icon={<Laptop size={24} className="text-white" />}
        isLoading={isLoadingStats}
        subtitle="Unique endpoints synchronizing"
      />
    </div>
  );
};

