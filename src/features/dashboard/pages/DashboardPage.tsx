import React from 'react';
import StatCard from '@/features/dashboard/components/StatCard';
import UsageChart from '@/features/dashboard/components/UsageChart';
import LicenseChart from '@/features/dashboard/components/LicenseChart';
import PendingSyncs from '@/features/dashboard/components/PendingSyncs';
import RecentActivations from '@/features/dashboard/components/RecentActivations';
import ActivityFeed from '@/features/dashboard/components/ActivityFeed';
import SubscriptionChart from '@/features/dashboard/components/SubscriptionChart';
import TopInstitutions from '@/features/dashboard/components/TopInstitutions';
import { useDashboardMetrics } from '../api/dashboardApi';
import { useAuthStore } from '@/stores/auth.store';
import {
  RefreshCw,
  Building,
  Shield,
  Laptop,
  BookOpen,
  ArrowRight,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const {
    data: metricsPayload,
    isLoading: isLoadingMetrics,
    isFetching: isFetchingMetrics,
    refetch: refetchMetrics,
  } = useDashboardMetrics(isSuperAdmin ? null : currentUser?.institutionId);

  const metrics = metricsPayload?.metrics;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-gray-800 tracking-tight">System Dashboard</h1>
            {!isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#ff8a5c] border border-orange-200 flex items-center gap-1.5">
                <Building size={13} />
                Institute Portal
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-500 mt-1">
            {isSuperAdmin
              ? 'Platform-wide telemetry, licensing health, workstation synchronization, and security activity.'
              : `Operational telemetry and workstation management for your educational institution.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchMetrics()}
            title="Refresh metrics"
            className="p-2.5 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 shadow-2xs transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw
              size={16}
              className={isFetchingMetrics ? 'animate-spin text-[#ff8a5c]' : ''}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Scoping notice for Institute Admins */}
      {!isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-[#ff8a5c]">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Institution Scope Active</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Telemetry scoped to ID:{' '}
                <span className="font-mono text-gray-900 font-medium">
                  {currentUser?.institutionId || 'Unassigned'}
                </span>
                . Data outside your institution is securely isolated.
              </p>
            </div>
          </div>
          <Link
            to="/users"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#ff8a5c] hover:text-[#f77947] hover:underline"
          >
            Manage Team <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Top KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin ? (
          <>
            <StatCard
              title="Total Licenses Issued"
              value={metrics?.totalLicenses?.toLocaleString() ?? '0'}
              type="orange"
              isLoading={isLoadingMetrics}
              subtitle="Active enterprise seats"
            />
            <StatCard
              title="Enrolled Institutions"
              value={metrics?.totalInstitutions?.toLocaleString() ?? '0'}
              type="blue"
              isLoading={isLoadingMetrics}
              subtitle="Registered academies & schools"
            />
            <StatCard
              title="Published Content"
              value={metrics?.totalContentItems?.toLocaleString() ?? '0'}
              type="cyan"
              isLoading={isLoadingMetrics}
              subtitle="Lessons, exams & passages"
            />
            <StatCard
              title="Active Workstations"
              value={metrics?.totalActiveDevices?.toLocaleString() ?? '0'}
              type="coral"
              isLoading={isLoadingMetrics}
              subtitle="Connected client terminals"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Assigned Licenses"
              value={metrics?.totalLicenses?.toLocaleString() ?? '0'}
              type="orange"
              isLoading={isLoadingMetrics}
              subtitle="Student workstation capacity"
            />
            <StatCard
              title="Active Workstations"
              value={metrics?.activeDevices?.toLocaleString() ?? '0'}
              type="blue"
              isLoading={isLoadingMetrics}
              subtitle="Online lab computers"
            />
            <StatCard
              title="Enabled Typing Modules"
              value={metrics?.enabledModules?.toLocaleString() ?? '0'}
              type="cyan"
              isLoading={isLoadingMetrics}
              subtitle="Active curriculums & courses"
            />
            <StatCard
              title="Available Content"
              value={metrics?.availableContentItems?.toLocaleString() ?? '0'}
              type="coral"
              isLoading={isLoadingMetrics}
              subtitle="Practice lessons & tests"
            />
          </>
        )}
      </div>

      {/* Middle Visualizations Row */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <UsageChart />
          </div>
          <div className="lg:col-span-1">
            <SubscriptionChart enabled={isSuperAdmin} />
          </div>
          <div className="lg:col-span-1">
            <LicenseChart enabled={isSuperAdmin} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <UsageChart />
          </div>
          {/* Institutional Fast-Action Panel */}
          <div className="lg:col-span-1 bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-[400px]">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff8a5c] flex items-center justify-center border border-orange-100">
                  <Laptop size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Lab Operations</h3>
                  <p className="text-xs text-gray-400">Quick institutional management</p>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <Link
                  to="/activations"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 transition-all text-xs font-semibold text-gray-700 hover:text-gray-900 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Laptop size={15} className="text-[#ff8a5c]" />
                    <span>Workstations Directory</span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-gray-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/modules"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 transition-all text-xs font-semibold text-gray-700 hover:text-gray-900 group"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen size={15} className="text-blue-500" />
                    <span>Curriculum Modules</span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-gray-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/releases"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 transition-all text-xs font-semibold text-gray-700 hover:text-gray-900 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Download size={15} className="text-emerald-500" />
                    <span>Client Software Downloads</span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-gray-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 text-xs text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Need Software Deployment?</p>
              <p className="text-[11px] leading-relaxed">
                Download the desktop client installer and distribute it across student workstations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {isSuperAdmin && (
          <div className="lg:col-span-1">
            <TopInstitutions enabled={isSuperAdmin} />
          </div>
        )}
        <div className={isSuperAdmin ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <PendingSyncs />
        </div>
        <div className="lg:col-span-1">
          <RecentActivations />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
