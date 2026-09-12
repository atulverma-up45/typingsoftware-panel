import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  Radio,
  History,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Users,
  Download,
  ShieldAlert,
  Sparkles,
  Plane,
  Crosshair,
  Compass,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import {
  useAuthTrackingOverview,
  useLiveSessions,
  useGlobalLoginHistory,
  useThreatRadar,
  useLocationClusters,
  useKillSession,
  useKillAllUserSessions,
  usePruneExpiredSessions,
  type LiveSessionItem,
  type GlobalLoginHistoryItem,
} from '../api/authTrackingApi';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';

export default function AuthTrackingPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'threats' | 'locations' | 'history'>('sessions');

  // Sessions query state
  const [sessionSearch, setSessionSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionViewMode, setSessionViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // History query state
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyViewMode, setHistoryViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Interactive Confirmation Modal state
  const [sessionToRevoke, setSessionToRevoke] = useState<LiveSessionItem | null>(null);
  const [userToNuke, setUserToNuke] = useState<{ userId: string; userName: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Queries
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
  } = useAuthTrackingOverview();

  const {
    data: threatsData,
    isLoading: isLoadingThreats,
    refetch: refetchThreats,
  } = useThreatRadar();

  const {
    data: locationsData,
    isLoading: isLoadingLocations,
    refetch: refetchLocations,
  } = useLocationClusters();

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isFetching: isFetchingSessions,
    refetch: refetchSessions,
  } = useLiveSessions({
    page: sessionPage,
    limit: 15,
    search: sessionSearch ? sessionSearch.trim() : undefined,
    deviceType: deviceFilter || undefined,
  });

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
    refetch: refetchHistory,
  } = useGlobalLoginHistory({
    page: historyPage,
    limit: 20,
    search: historySearch ? historySearch.trim() : undefined,
    status: statusFilter || undefined,
  });

  // Mutations
  const { mutate: killSession, isPending: isKillingSession } = useKillSession();
  const { mutate: killAllUserSessions, isPending: isKillingAll } = useKillAllUserSessions();
  const { mutate: pruneExpired, isPending: isPruning } = usePruneExpiredSessions();

  const overview = overviewData?.data;
  const threats = threatsData?.data;
  const locations = locationsData?.data || [];
  const sessions: LiveSessionItem[] = sessionsData?.data || [];
  const sessionsTotal = sessionsData?.meta?.total || 0;
  const sessionsTotalPages = Math.ceil(sessionsTotal / 15) || 1;

  const history: GlobalLoginHistoryItem[] = historyData?.data || [];
  const historyTotal = historyData?.meta?.total || 0;
  const historyTotalPages = Math.ceil(historyTotal / 20) || 1;

  const totalActiveThreats = threats?.summary?.totalThreats ?? 0;

  const handleRefreshAll = () => {
    refetchOverview();
    refetchThreats();
    refetchLocations();
    refetchSessions();
    refetchHistory();
  };

  const handleCopy = (id: string, text: string | null | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const exportSessionsToCSV = () => {
    if (sessions.length === 0) return;
    const headers = [
      'Session ID',
      'User ID',
      'User Name',
      'User Email',
      'User Role',
      'Institution ID',
      'IP Address',
      'Device Type',
      'OS',
      'Browser',
      'City',
      'Country',
      'Created At',
      'Last Active',
    ];
    const rows = sessions.map((s) => [
      `"${s.id}"`,
      `"${s.userId}"`,
      `"${(s.userName || '').replace(/"/g, '""')}"`,
      `"${s.userEmail || ''}"`,
      `"${s.userRole}"`,
      `"${s.institutionId || ''}"`,
      `"${s.ipAddress || ''}"`,
      `"${s.deviceType || ''}"`,
      `"${s.os || ''}"`,
      `"${s.browser || ''}"`,
      `"${s.city || ''}"`,
      `"${s.country || ''}"`,
      `"${s.createdAt}"`,
      `"${s.updatedAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `live-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'Record ID',
      'Status',
      'Failure Reason',
      'User Name',
      'User Email',
      'IP Address',
      'Device Type',
      'OS',
      'Browser',
      'City',
      'Country',
      'Timestamp',
    ];
    const rows = history.map((h) => [
      `"${h.id}"`,
      `"${h.status}"`,
      `"${h.failureReason || ''}"`,
      `"${(h.userName || '').replace(/"/g, '""')}"`,
      `"${h.userEmail || ''}"`,
      `"${h.ipAddress || ''}"`,
      `"${h.deviceType || ''}"`,
      `"${h.os || ''}"`,
      `"${h.browser || ''}"`,
      `"${h.city || ''}"`,
      `"${h.country || ''}"`,
      `"${h.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auth-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Top Header */}
      <PageHeader
        title="Auth & Device Security Center"
        subtitle="Real-time platform session telemetry, geo-velocity threat radar, and forensic authentication auditing"
        icon={<Radio className="text-primary" size={24} />}
        actions={
          <>
            <button
              type="button"
              onClick={() => pruneExpired()}
              disabled={isPruning}
              title="Prune dead expired sessions older than 7 days"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs h-[38px] disabled:opacity-50"
            >
              <Sparkles size={14} className={isPruning ? 'animate-spin text-primary' : 'text-amber-500'} />
              <span>Prune Dead Sessions</span>
            </button>

            <button
              type="button"
              onClick={activeTab === 'sessions' ? exportSessionsToCSV : exportHistoryToCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs h-[38px]"
              title="Export report to CSV"
            >
              <Download size={14} className="text-gray-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingSessions || isFetchingHistory}
              className="h-[38px] px-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs flex items-center justify-center"
              title="Refresh telemetry metrics"
            >
              <RefreshCw
                size={14}
                className={isFetchingSessions || isFetchingHistory ? 'animate-spin text-primary' : ''}
              />
            </button>
          </>
        }
      />

      {/* KPI Telemetry StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Live Active Devices"
          value={overview?.totalActiveSessions ?? 0}
          type="blue"
          icon={<Radio size={24} className="text-white" />}
          isLoading={isLoadingOverview}
          subtitle="Tokens currently valid"
          onClick={() => setActiveTab('sessions')}
          active={activeTab === 'sessions'}
        />
        <StatCard
          title="Unique Users Online"
          value={overview?.uniqueActiveUsers ?? 0}
          type="emerald"
          icon={<Users size={24} className="text-white" />}
          isLoading={isLoadingOverview}
          subtitle="Active user accounts"
          onClick={() => setActiveTab('sessions')}
        />
        <StatCard
          title="24h Successful Logins"
          value={overview?.loginsLast24h ?? 0}
          type="orange"
          icon={<CheckCircle2 size={24} className="text-white" />}
          isLoading={isLoadingOverview}
          subtitle="Legitimate authentications"
          onClick={() => setActiveTab('history')}
          active={activeTab === 'history'}
        />
        <StatCard
          title="Security Threat Radar"
          value={totalActiveThreats}
          type={totalActiveThreats > 0 ? 'coral' : 'emerald'}
          icon={<ShieldAlert size={24} className="text-white" />}
          isLoading={isLoadingThreats}
          subtitle={
            totalActiveThreats > 0
              ? `${threats?.impossibleTravelIncidents.length || 0} travel, ${threats?.bruteForceAttacks.length || 0} brute force`
              : 'Zero active threats'
          }
          onClick={() => setActiveTab('threats')}
          active={activeTab === 'threats'}
        />
      </div>

      {/* Standardized Pill Navigation Tabs */}
      <div className="border-b border-gray-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3">
          {[
            { id: 'sessions', label: 'Live Sessions', count: sessionsTotal, icon: <Radio size={14} /> },
            { id: 'threats', label: 'Threat Radar', count: totalActiveThreats, icon: <ShieldAlert size={14} />, alert: totalActiveThreats > 0 },
            { id: 'locations', label: 'Geo Explorer', count: locations.length, icon: <Compass size={14} /> },
            { id: 'history', label: 'Global Audit Logs', count: historyTotal, icon: <History size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary shadow-2xs font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    tab.alert
                      ? 'bg-red-500 text-white font-bold'
                      : activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: LIVE ACTIVE SESSIONS                                             */}
      {/* ======================================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <FilterToolbar
            searchValue={sessionSearch}
            onSearchChange={setSessionSearch}
            searchPlaceholder="Search by user name, email, IP, institution... (Press / to focus)"
            viewMode={sessionViewMode}
            onViewModeChange={setSessionViewMode}
            activeChips={[
              ...(deviceFilter
                ? [
                    {
                      id: 'deviceFilter',
                      label: 'Device',
                      value: deviceFilter.toUpperCase(),
                      onRemove: () => {
                        setDeviceFilter('');
                        setSessionPage(1);
                      },
                    },
                  ]
                : []),
            ]}
            hasActiveFilters={Boolean(deviceFilter || sessionSearch)}
            onClearFilters={() => {
              setDeviceFilter('');
              setSessionSearch('');
              setSessionPage(1);
            }}
            totalResults={sessionsTotal}
            totalLabel="Active Sessions"
            filterElements={
              <FilterSelect
                icon={<Laptop size={13} />}
                value={deviceFilter}
                onChange={(e) => {
                  setDeviceFilter(e.target.value);
                  setSessionPage(1);
                }}
                title="Filter by Device Form Factor"
              >
                <option value="">All Devices</option>
                <option value="desktop">Desktop Stations</option>
                <option value="mobile">Mobile Devices</option>
                <option value="tablet">Tablet Terminals</option>
              </FilterSelect>
            }
          />

          {isLoadingSessions ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-3 shadow-2xs">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs">
              <EmptyState
                icon={<Radio size={28} className="text-primary" />}
                title="No active sessions found"
                description={
                  sessionSearch || deviceFilter
                    ? 'No device sessions match your current filter parameters.'
                    : 'There are currently no active user sessions recorded on the platform.'
                }
              />
            </div>
          ) : (
            <div>
              {/* Mobile Card List (< md screens, or when CARDS view is active) */}
              <div
                className={
                  sessionViewMode === 'CARDS'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5'
                    : 'md:hidden divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'
                }
              >
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 space-y-3 hover:bg-gray-50/70 transition-colors ${
                      sessionViewMode === 'CARDS'
                        ? 'bg-white rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2.5 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary font-bold text-xs flex items-center justify-center border border-orange-100 shrink-0">
                            {s.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-gray-900 text-sm truncate">{s.userName}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono font-bold shrink-0">
                                {s.userRole}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 block truncate">{s.userEmail}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold shrink-0 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Live</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Device</span>
                          <div className="flex items-center gap-1 text-gray-800 font-medium mt-0.5">
                            {s.deviceType === 'mobile' ? (
                              <Smartphone size={13} className="text-primary shrink-0" />
                            ) : (
                              <Laptop size={13} className="text-primary shrink-0" />
                            )}
                            <span className="truncate">{s.browser || 'Browser'}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 block truncate">{s.os || 'Unknown OS'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Origin</span>
                          <div className="flex items-center gap-1 text-gray-800 font-medium mt-0.5">
                            <MapPin size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{[s.city, s.country].filter(Boolean).join(', ') || 'Edge'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-gray-500 truncate">{s.ipAddress || '—'}</span>
                            {s.ipAddress && (
                              <button
                                type="button"
                                onClick={(e) => handleCopy(`ip_${s.id}`, s.ipAddress, e)}
                                className="text-gray-400 hover:text-primary"
                                title="Copy IP"
                              >
                                {copiedId === `ip_${s.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {s.institutionName && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mb-2">
                          <Building2 size={12} className="text-primary shrink-0" />
                          <span className="truncate font-medium">{s.institutionName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Active {new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSessionToRevoke(s)}
                          className="h-[34px] px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Terminate this device session"
                        >
                          <Trash2 size={12} /> Kill
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToNuke({ userId: s.userId, userName: s.userName })}
                          className="h-[34px] px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors"
                          title="Kill all devices for this user"
                        >
                          Nuke All
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md screens, hidden in CARDS view) */}
              <div className={sessionViewMode === 'CARDS' ? 'hidden' : 'hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">User & Institution</th>
                        <th className="py-3.5 px-4">Hardware & Browser</th>
                        <th className="py-3.5 px-4">IP & Location</th>
                        <th className="py-3.5 px-4">Session Age / Heartbeat</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-50 text-primary font-bold text-xs flex items-center justify-center border border-orange-100 shrink-0">
                                {s.userName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                  <span>{s.userName}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono font-semibold">
                                    {s.userRole}
                                  </span>
                                </div>
                                <div className="text-gray-500 text-[11px]">{s.userEmail}</div>
                                {s.institutionName && (
                                  <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                                    <Building2 size={11} />
                                    <span>{s.institutionName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-orange-50 text-primary border border-orange-100">
                                {s.deviceType === 'mobile' ? <Smartphone size={15} /> : <Laptop size={15} />}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{s.browser || 'Web Browser'}</div>
                                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                  <span>{s.os || 'Unknown OS'}</span>
                                  {s.cpuArchitecture && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">{s.cpuArchitecture}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-mono text-xs text-gray-700 flex items-center gap-1.5">
                                <Globe size={13} className="text-gray-400" />
                                <span>{s.ipAddress || '—'}</span>
                                {s.ipAddress && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(`ip_d_${s.id}`, s.ipAddress, e)}
                                    className="text-gray-400 hover:text-primary"
                                    title="Copy IP"
                                  >
                                    {copiedId === `ip_d_${s.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={12} className="text-gray-400" />
                                <span>{[s.city, s.country].filter(Boolean).join(', ') || 'Edge Network'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active {new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="text-gray-400 text-[11px] flex items-center gap-1">
                                <Clock size={11} />
                                <span>Signed in {new Date(s.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSessionToRevoke(s)}
                                className="h-[34px] px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                                title="Terminate this device session"
                              >
                                <Trash2 size={12} /> Kill Session
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserToNuke({ userId: s.userId, userName: s.userName })}
                                className="h-[34px] px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs transition-colors"
                                title="Kill all devices for this user"
                              >
                                Nuke All
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Standardized Pagination */}
          <Pagination
            page={sessionPage}
            totalPages={sessionsTotalPages}
            totalItems={sessionsTotal}
            pageSize={15}
            onPageChange={setSessionPage}
            itemName="active sessions"
          />
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: THREAT RADAR & ANOMALIES                                         */}
      {/* ======================================================================= */}
      {activeTab === 'threats' && (
        <div className="space-y-6">
          {/* Impossible Travel Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Plane className="text-amber-500" size={16} />
                  <span>Impossible Travel Incidents ({threats?.impossibleTravelIncidents.length || 0})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sign-in events from geographically distinct locations within impossible physical travel time windows.
                </p>
              </div>
            </div>

            {isLoadingThreats ? (
              <div className="py-6 text-center text-xs text-gray-400">Scanning geographical logs...</div>
            ) : (threats?.impossibleTravelIncidents.length || 0) === 0 ? (
              <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-70" />
                <p className="text-sm font-bold text-gray-800">No Impossible Travel Anomalies</p>
                <p className="text-xs text-gray-500 mt-0.5">All recent sign-ins fall within expected physical velocities.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threats?.impossibleTravelIncidents.map((inc, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-red-50/70 border border-red-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          {inc.severity}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{inc.userName}</span>
                        <span className="text-xs text-gray-500">({inc.userEmail})</span>
                      </div>
                      <p className="text-xs text-red-800 font-medium">{inc.reason}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-1 font-mono">
                        <span>Origin: {inc.originLocation} ({inc.originIp || 'IP Hidden'})</span>
                        <span>➔</span>
                        <span>Dest: {inc.destinationLocation} ({inc.destinationIp || 'IP Hidden'})</span>
                        <span>•</span>
                        <span>Delta: {inc.timeDeltaMinutes}m</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUserToNuke({ userId: inc.userId, userName: inc.userName })}
                      className="h-[36px] px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors shrink-0"
                    >
                      Nuke All Devices
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brute Force Attacks Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Crosshair className="text-red-500" size={16} />
                  <span>Brute-Force Password Bursts ({threats?.bruteForceAttacks.length || 0})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  IP addresses exceeding consecutive failed login thresholds in the telemetry buffer.
                </p>
              </div>
            </div>

            {(threats?.bruteForceAttacks.length || 0) === 0 ? (
              <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-70" />
                <p className="text-sm font-bold text-gray-800">No Brute-Force Attacks Detected</p>
                <p className="text-xs text-gray-500 mt-0.5">Zero IP addresses exceeding 3 consecutive failed login attempts in the past 2 hours.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {threats?.bruteForceAttacks.map((bf, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-amber-900">{bf.ipAddress}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                        {bf.failedAttempts} failed attempts
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1.5">
                      <MapPin size={13} className="text-gray-400" />
                      <span>{bf.location}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center justify-between border-t border-amber-200/60 pt-2">
                      <span>Targeted Accounts: {bf.targetedAccountsCount}</span>
                      <span>Last Attempt: {new Date(bf.lastAttemptAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: EDGE GEOGRAPHIC TELEMETRY                                        */}
      {/* ======================================================================= */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Compass className="text-emerald-500" size={16} />
              <span>Edge Geographic Distribution & Telemetry</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live geographic clusters aggregated from Cloudflare Edge edge nodes and device coordinates.
            </p>
          </div>

          {isLoadingLocations ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading location coordinates...</div>
          ) : locations.length === 0 ? (
            <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <Globe size={32} className="mx-auto mb-2 text-gray-400 opacity-60" />
              <p className="text-sm font-bold text-gray-800">No Location Clusters Found</p>
              <p className="text-xs text-gray-500 mt-0.5">Locations will appear as workstations establish secure connections.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {locations.map((loc, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-primary font-bold text-xs flex items-center justify-center border border-orange-100 shrink-0">
                        {loc.country ? loc.country.slice(0, 2).toUpperCase() : 'GL'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-xs truncate">{loc.city || 'Regional Hub'}</h4>
                        <span className="text-[11px] text-gray-400 truncate block">{loc.country}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Edge
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-200/50">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Sessions</span>
                      <span className="font-bold text-gray-800">{loc.activeSessionsCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Unique Users</span>
                      <span className="font-bold text-gray-800">{loc.uniqueUsersCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 4: GLOBAL LOGIN AUDIT LOGS                                          */}
      {/* ======================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <FilterToolbar
            searchValue={historySearch}
            onSearchChange={setHistorySearch}
            searchPlaceholder="Search audit by user name, email, IP, location... (Press / to focus)"
            viewMode={historyViewMode}
            onViewModeChange={setHistoryViewMode}
            activeChips={[
              ...(statusFilter
                ? [
                    {
                      id: 'statusFilter',
                      label: 'Status',
                      value: statusFilter,
                      onRemove: () => {
                        setStatusFilter('');
                        setHistoryPage(1);
                      },
                    },
                  ]
                : []),
            ]}
            hasActiveFilters={Boolean(statusFilter || historySearch)}
            onClearFilters={() => {
              setStatusFilter('');
              setHistorySearch('');
              setHistoryPage(1);
            }}
            totalResults={historyTotal}
            totalLabel="Audit Events"
            filterElements={
              <FilterSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setHistoryPage(1);
                }}
                title="Filter by Authentication Status"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILED">Failed Only</option>
              </FilterSelect>
            }
          />

          {isLoadingHistory ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-3 shadow-2xs">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs">
              <EmptyState
                icon={<History size={28} className="text-primary" />}
                title="No login audit records found"
                description={
                  historySearch || statusFilter
                    ? 'No audit log entries match your active criteria.'
                    : 'Historical login events will appear as users authenticate.'
                }
              />
            </div>
          ) : (
            <div>
              {/* Mobile Card View for History */}
              <div
                className={
                  historyViewMode === 'CARDS'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5'
                    : 'md:hidden divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'
                }
              >
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={`p-4 space-y-2.5 hover:bg-gray-50/70 transition-colors ${
                      historyViewMode === 'CARDS'
                        ? 'bg-white rounded-2xl border border-gray-200 shadow-2xs'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 text-xs truncate block">{h.userName || h.userEmail || 'Anonymous'}</span>
                        <span className="text-[11px] text-gray-400 truncate block">{h.userEmail}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          h.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>

                    {h.failureReason && (
                      <div className="text-[11px] font-mono text-rose-600 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                        Reason: {h.failureReason}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Device</span>
                        <span className="text-[11px] text-gray-700 font-medium block truncate">
                          {[h.browser, h.os].filter(Boolean).join(' / ') || 'Web Client'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Location</span>
                        <span className="text-[11px] text-gray-700 font-medium block truncate">
                          {[h.city, h.country].filter(Boolean).join(', ') || 'Edge Network'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="font-mono text-gray-500">{h.ipAddress || '—'}</span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock size={11} />
                        <span>{new Date(h.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View for History */}
              <div className={historyViewMode === 'CARDS' ? 'hidden' : 'hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Status & Reason</th>
                        <th className="py-3.5 px-4">Account / Target</th>
                        <th className="py-3.5 px-4">Client Hardware & Browser</th>
                        <th className="py-3.5 px-4">IP & Location</th>
                        <th className="py-3.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                h.status === 'SUCCESS'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {h.status}
                            </span>
                            {h.failureReason && (
                              <div className="text-[10px] font-mono text-rose-600 mt-1 max-w-[180px] truncate">
                                {h.failureReason}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {h.userName ? (
                              <div>
                                <div className="font-semibold text-gray-900">{h.userName}</div>
                                <div className="text-[11px] text-gray-400">{h.userEmail}</div>
                              </div>
                            ) : (
                              <span className="font-mono text-gray-400 text-xs">{h.userEmail || 'Anonymous'}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-gray-800 font-medium">
                              {[h.browser, h.os].filter(Boolean).join(' on ') || 'Generic Web Client'}
                            </div>
                            <div className="text-[11px] text-gray-400 capitalize">Type: {h.deviceType || 'Desktop'}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs text-gray-700">{h.ipAddress || '—'}</div>
                            <div className="text-xs text-gray-500">
                              {[h.city, h.country].filter(Boolean).join(', ') || 'Edge Network'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-500">
                            {new Date(h.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Standardized Pagination */}
          <Pagination
            page={historyPage}
            totalPages={historyTotalPages}
            totalItems={historyTotal}
            pageSize={20}
            onPageChange={setHistoryPage}
            itemName="audit logs"
          />
        </div>
      )}

      {/* Standardized Confirmation Modal: Kill Single Session */}
      <ConfirmDialog
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={() => {
          if (!sessionToRevoke) return;
          killSession(sessionToRevoke.id, {
            onSuccess: () => setSessionToRevoke(null),
          });
        }}
        title="Revoke Device Session?"
        description={`Are you sure you want to terminate this active session for ${sessionToRevoke?.userName} (${sessionToRevoke?.userEmail}) on ${sessionToRevoke?.browser || 'Web Browser'} (${sessionToRevoke?.os || 'Client'})? This will immediately log out the user from that device.`}
        confirmLabel="Kill Session"
        variant="danger"
        isPending={isKillingSession}
      />

      {/* Standardized Confirmation Modal: Kill All User Sessions */}
      <ConfirmDialog
        isOpen={Boolean(userToNuke)}
        onClose={() => setUserToNuke(null)}
        onConfirm={() => {
          if (!userToNuke) return;
          killAllUserSessions(userToNuke.userId, {
            onSuccess: () => setUserToNuke(null),
          });
        }}
        title="Terminate All Device Sessions?"
        description={`This will immediately revoke all active device sessions and tokens across all laptops, phones, and workstations for ${userToNuke?.userName}.`}
        confirmLabel="Nuke All Sessions"
        variant="critical"
        isPending={isKillingAll}
      />
    </div>
  );
}
