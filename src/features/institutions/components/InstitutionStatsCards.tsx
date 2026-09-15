import React from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { GlobalInstitutionStats } from '../api/institutionApi';

export type InstitutionTabType = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'TRASH';

interface InstitutionStatsCardsProps {
  stats?: GlobalInstitutionStats;
  totalInstitutions: number;
  isLoading: boolean;
  activeTab: InstitutionTabType;
  onTabChange: (tab: InstitutionTabType) => void;
}

export const InstitutionStatsCards: React.FC<InstitutionStatsCardsProps> = ({
  stats,
  totalInstitutions,
  isLoading,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="Total Centers"
        value={isLoading ? '—' : stats?.totalInstitutions ?? totalInstitutions}
        type="orange"
        icon={<GraduationCap size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Onboarded client tenants"
        onClick={() => onTabChange('ALL')}
        active={activeTab === 'ALL'}
      />
      <StatCard
        title="Active Centers"
        value={isLoading ? '—' : stats?.activeInstitutions ?? 0}
        type="blue"
        icon={<CheckCircle2 size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Live authentications enabled"
        onClick={() => onTabChange('ACTIVE')}
        active={activeTab === 'ACTIVE'}
      />
      <StatCard
        title="Suspended Centers"
        value={isLoading ? '—' : stats?.suspendedInstitutions ?? 0}
        type="coral"
        icon={<AlertCircle size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Pending renewal or review"
        onClick={() => onTabChange('SUSPENDED')}
        active={activeTab === 'SUSPENDED'}
      />
      <StatCard
        title="Recycle Bin"
        value={isLoading ? '—' : stats?.deletedInstitutions ?? 0}
        type="cyan"
        icon={<Trash2 size={24} className="text-white" />}
        isLoading={isLoading}
        subtitle="Soft-deleted client centers"
        onClick={() => onTabChange('TRASH')}
        active={activeTab === 'TRASH'}
      />
    </div>
  );
};

