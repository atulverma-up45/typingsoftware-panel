import React from 'react';
import {
  Shield,
  Key,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Monitor,
  Download,
  Lock,
} from 'lucide-react';
import type { LicenseStats } from '../api/licenseApi';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';

export type TabType = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'SUSPENDED' | 'REVOKED' | 'TRASH';

export interface LicenseStatsHeaderProps {
  licenseStats: LicenseStats | undefined;
  isLoadingStats: boolean;
  totalLicenses: number;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isErrorLicenses: boolean;
  licensesError: unknown;
  onRetry: () => void;
  onExportCsv: () => void;
  onRefreshAll: () => void;
  isFetchingLicenses: boolean;
  isSupport: boolean;
  onOpenGenerateModal: () => void;
}

export const LicenseStatsHeader: React.FC<LicenseStatsHeaderProps> = ({
  licenseStats,
  isLoadingStats,
  totalLicenses,
  activeTab,
  onTabChange,
  isErrorLicenses,
  licensesError,
  onRetry,
  onExportCsv,
  onRefreshAll,
  isFetchingLicenses,
  isSupport,
  onOpenGenerateModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Workstation Licenses"
        subtitle="Manage cryptographic workstation keys, seat capacities, offline verification rules, and active client heartbeats"
        icon={<Shield size={20} />}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary rounded-full border border-primary/20">
            Fleet Authority
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={onExportCsv}
              title="Export licenses as CSV"
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors font-medium text-xs flex items-center gap-1.5 min-h-[38px] cursor-pointer"
            >
              <Download size={14} className="text-gray-500" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={onRefreshAll}
              title="Refresh licenses"
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={isFetchingLicenses ? 'animate-spin text-primary' : ''}
              />
            </button>
            {isSupport ? (
              <div
                title="Support role is view-only. Key generation is restricted to administrators."
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-400 bg-gray-100 rounded-xl shadow-2xs flex items-center gap-1.5 min-h-[38px] cursor-not-allowed select-none pointer-events-none opacity-60"
              >
                <Lock size={15} className="text-gray-400" />
                <span>Generate Key (Locked)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenGenerateModal}
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer"
              >
                <Plus size={16} />
                <span>Generate License Key</span>
              </button>
            )}
          </>
        }
      />

      {/* Network Error Alert Banner */}
      {isErrorLicenses && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-4 text-rose-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Failed to load workstation licenses</p>
              <p className="text-xs text-rose-600 mt-0.5">
                {(licensesError as Error)?.message || 'An error occurred while connecting to the backend API.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-100/50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Fleet Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Keys"
          value={isLoadingStats ? '—' : licenseStats?.totalLicenses ?? totalLicenses}
          type="orange"
          icon={<Key size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Minted licenses"
          onClick={() => onTabChange('ALL')}
          active={activeTab === 'ALL'}
        />
        <StatCard
          title="Active & Valid"
          value={isLoadingStats ? '—' : licenseStats?.activeLicenses ?? 0}
          type="blue"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Authorizing lab PCs"
          onClick={() => onTabChange('ACTIVE')}
          active={activeTab === 'ACTIVE'}
        />
        <StatCard
          title="Seat Capacity"
          value={isLoadingStats ? '—' : licenseStats?.totalWorkstationSeatCapacity ?? 0}
          type="coral"
          icon={<Monitor size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Aggregated stations"
        />
        <StatCard
          title="Expiring <30d"
          value={isLoadingStats ? '—' : licenseStats?.expiringWithin30Days ?? 0}
          type="cyan"
          icon={<Clock size={24} className="text-white" />}
          isLoading={isLoadingStats}
          subtitle="Needs renewal review"
          onClick={() => onTabChange('EXPIRING')}
          active={activeTab === 'EXPIRING'}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => onTabChange('ALL')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          All Licenses
        </button>
        <button
          type="button"
          onClick={() => onTabChange('ACTIVE')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => onTabChange('EXPIRING')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
            activeTab === 'EXPIRING'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Expiring Soon</span>
          {licenseStats && licenseStats.expiringWithin30Days > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
              {licenseStats.expiringWithin30Days}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('SUSPENDED')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            activeTab === 'SUSPENDED'
              ? 'bg-white text-gray-800 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Suspended
        </button>
        <button
          type="button"
          onClick={() => onTabChange('REVOKED')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            activeTab === 'REVOKED'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Revoked
        </button>
        <button
          type="button"
          onClick={() => onTabChange('TRASH')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'TRASH'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Trash2 size={13} />
          <span>Recycle Bin</span>
        </button>
      </div>
    </div>
  );
};

