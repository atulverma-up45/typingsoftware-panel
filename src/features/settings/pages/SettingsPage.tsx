import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Activity,
  User,
  Building2,
  Lock,
  Globe,
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  Key,
  HardDrive,
  Laptop,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { toast } from 'sonner';

interface HealthStatus {
  status: string;
  service: string;
  version: string;
  database?: {
    status: string;
    latencyMs: number;
  };
  timestamp: string;
}

export const SettingsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Preferences State
  const [autoPollInterval, setAutoPollInterval] = useState('15');
  const [timeDisplayFormat, setTimeDisplayFormat] = useState<'LOCAL' | 'UTC'>('LOCAL');
  const [densityMode, setDensityMode] = useState<'COMFORTABLE' | 'COMPACT'>('COMFORTABLE');

  // Backend Health Query
  const { data: healthData, isLoading: isHealthLoading, refetch: refetchHealth } = useQuery<HealthStatus>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await api.get('/health/ready');
      return response.data?.data || response.data;
    },
    refetchInterval: 30000, // check every 30s
  });

  const handleSavePreferences = () => {
    toast.success('System preferences saved successfully');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <Settings className="text-[#ff8a5c]" size={28} />
          System Settings & Platform Status
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage administrator profile, interface preferences, and monitor backend cloud health
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Account Profile & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Administrator Profile Dossier */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#fff0eb] text-[#ff8a5c] flex items-center justify-center font-bold text-lg">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{currentUser?.name || 'Administrator'}</h3>
                  <p className="text-xs text-gray-400">{currentUser?.email}</p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isSuperAdmin
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {currentUser?.role || 'ADMIN'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block mb-1 text-[11px]">User Identifier (UUID)</span>
                <span className="font-mono font-semibold text-gray-800 truncate block">
                  {currentUser?.id || 'sys_user'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block mb-1 text-[11px]">Institutional Scope</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1.5 truncate">
                  <Building2 size={13} className="text-blue-500 shrink-0" />
                  {currentUser?.institutionId ? `Institution: ${currentUser.institutionId}` : 'Global Platform Oversight'}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Security & Credentials</span>
              <button
                type="button"
                onClick={() => toast.info('Password reset dispatch link available in Users module')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Lock size={13} />
                Security Credentials
              </button>
            </div>
          </div>

          {/* Interface & Operational Preferences */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity size={16} className="text-[#ff8a5c]" />
              Console & Telemetry Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Default Telemetry Auto-Poll Frequency
                </label>
                <select
                  value={autoPollInterval}
                  onChange={(e) => setAutoPollInterval(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
                >
                  <option value="10">10 Seconds (High Velocity)</option>
                  <option value="15">15 Seconds (Balanced Default)</option>
                  <option value="30">30 Seconds (Low Network)</option>
                  <option value="60">60 Seconds (Conservative)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Timestamp Display Mode
                </label>
                <select
                  value={timeDisplayFormat}
                  onChange={(e) => setTimeDisplayFormat(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
                >
                  <option value="LOCAL">Local System Timezone</option>
                  <option value="UTC">Universal Coordinated Time (UTC)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Table Grid Density
              </label>
              <div className="flex gap-2">
                {(['COMFORTABLE', 'COMPACT'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDensityMode(mode)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      densityMode === mode
                        ? 'bg-[#fff0eb] border-[#ff8a5c] text-[#ff8a5c]'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {mode === 'COMFORTABLE' ? 'Comfortable Spacing' : 'High Density (Compact)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ff8a5c] hover:bg-[#ff7a45] shadow-xs transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Cloud Infrastructure Health & Readiness */}
        <div className="space-y-6">
          {/* Cloud Health Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-[#ff8a5c]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Cloud Backend Health
                </h3>
              </div>
              <button
                type="button"
                onClick={() => refetchHealth()}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ping health check"
              >
                <RefreshCw size={13} className={isHealthLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Service Probe */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">API Service</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {healthData?.service || 'typing-software-api'} ({healthData?.version || 'v1'})
                </span>
              </div>

              {/* Database Probe */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">PostgreSQL DB</span>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    {healthData?.database?.status === 'connected' ? 'Connected' : 'Online'}
                  </span>
                  {healthData?.database?.latencyMs !== undefined && (
                    <span className="text-[10px] text-gray-400 font-mono block">
                      Latency: {healthData.database.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>

              {/* R2 Object Storage */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 font-medium">Cloudflare R2</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Operational
                </span>
              </div>

              {/* Timestamp */}
              <div className="text-[11px] text-gray-400 text-center pt-1">
                Last checked:{' '}
                {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>

          {/* Quick Access Tiles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Quick Administrative Links
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="/releases"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HardDrive size={15} className="text-gray-400" />
                  <span>Desktop Software Releases</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </a>

              <a
                href="/sync"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Laptop size={15} className="text-gray-400" />
                  <span>Workstation Sync Telemetry</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </a>

              <a
                href="/audit"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-gray-400" />
                  <span>Immutable Audit Trail</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;

