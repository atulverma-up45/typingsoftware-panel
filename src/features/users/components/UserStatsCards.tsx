import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { UserStats } from '../api/userApi';

interface UserStatsCardsProps {
  statsData?: { data?: UserStats };
  isLoadingStats: boolean;
  activeTab: 'all' | 'active' | 'suspended' | 'trash';
  roleFilter: string;
  statusFilter: string;
  isSuperAdmin: boolean;
  onTabChange: (tab: 'all' | 'active' | 'suspended' | 'trash') => void;
  onToggleAdminFilter: () => void;
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  statsData,
  isLoadingStats,
  activeTab,
  roleFilter,
  statusFilter,
  isSuperAdmin,
  onTabChange,
  onToggleAdminFilter,
}) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      <StatCard
        title="Total Users"
        value={statsData?.data?.total ?? 0}
        type="orange"
        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
        isLoading={isLoadingStats}
        subtitle="All directory accounts"
        onClick={() => onTabChange('all')}
        active={activeTab === 'all' && !roleFilter && !statusFilter}
      />
      <StatCard
        title="Active Accounts"
        value={statsData?.data?.active ?? 0}
        type="blue"
        icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
        isLoading={isLoadingStats}
        subtitle="Verified & active staff"
        onClick={() => onTabChange('active')}
        active={activeTab === 'active'}
      />
      <StatCard
        title="Suspended / Banned"
        value={(statsData?.data?.suspended ?? 0) + (statsData?.data?.banned ?? 0)}
        type="coral"
        icon={<UserX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
        isLoading={isLoadingStats}
        subtitle="Restricted or locked"
        onClick={() => onTabChange('suspended')}
        active={activeTab === 'suspended'}
      />
      <StatCard
        title={isSuperAdmin ? 'Administrators' : 'Staff Members'}
        value={
          (statsData?.data?.admins ?? 0) +
          (isSuperAdmin ? statsData?.data?.superAdmins ?? 0 : 0)
        }
        type="cyan"
        icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
        isLoading={isLoadingStats}
        subtitle="Privileged accounts"
        onClick={onToggleAdminFilter}
        active={roleFilter === 'ADMIN'}
      />
    </div>
  );
};
