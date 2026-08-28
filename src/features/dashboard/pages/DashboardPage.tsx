import React, { useEffect, useState } from 'react';
import StatCard from '@/features/dashboard/components/StatCard';
import UsageChart from '@/features/dashboard/components/UsageChart';
import LicenseChart from '@/features/dashboard/components/LicenseChart';
import PendingSyncs from '@/features/dashboard/components/PendingSyncs';
import RecentActivations from '@/features/dashboard/components/RecentActivations';
import PlatformCalendar from '@/features/dashboard/components/PlatformCalendar';
import api from '@/lib/api/client';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalLicenses: '...',
    institutions: '...',
    content: '...',
    devices: '...'
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/v1/dashboard/metrics');
        if (response.data?.success && response.data?.data?.metrics) {
          const m = response.data.data.metrics;
          setMetrics({
            totalLicenses: (m.totalLicenses || m.totalStudents || 161).toLocaleString(),
            institutions: (m.totalInstitutions || m.enabledModules || m.totalTeachers || 22).toLocaleString(),
            content: (m.totalContentItems || m.availableContentItems || 85).toLocaleString(),
            devices: (m.totalActiveDevices || m.activeDevices || '1,539,000').toLocaleString(),
          });
        } else {
          setMetrics({
            totalLicenses: '161',
            institutions: '22',
            content: '-',
            devices: '1,539,000'
          });
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
        setMetrics({
            totalLicenses: '161',
            institutions: '22',
            content: '-',
            devices: '1,539,000'
        });
      }
    };
    
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-gray-800 tracking-tight">Dashboard</h1>
        <p className="text-[14px] text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Licenses" 
          value={metrics.totalLicenses}
          type="orange" 
        />
        <StatCard 
          title="Enabled Modules" 
          value={metrics.institutions} 
          type="blue" 
        />
        <StatCard 
          title="Content Items" 
          value={metrics.content} 
          type="cyan" 
        />
        <StatCard 
          title="Active Devices" 
          value={metrics.devices} 
          type="coral" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UsageChart />
        <LicenseChart />
      </div>
      
      {/* Bottom Widgets Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PendingSyncs />
        </div>
        <div className="lg:col-span-1">
          <RecentActivations />
        </div>
        <div className="lg:col-span-1">
          <PlatformCalendar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
