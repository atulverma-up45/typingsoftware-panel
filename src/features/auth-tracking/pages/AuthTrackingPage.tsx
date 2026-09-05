import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  Radio,
  History,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Users,
  Download,
  ShieldAlert,
  X,
  Sparkles,
  Zap,
  Plane,
  Crosshair,
  Compass,
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

export default function AuthTrackingPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'threats' | 'locations' | 'history'>('sessions');

  // Sessions query state
  const [sessionSearch, setSessionSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [sessionPage, setSessionPage] = useState(1);

  // History query state
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  // Interactive Confirmation Modal state
  const [sessionToRevoke, setSessionToRevoke] = useState<LiveSessionItem | null>(null);
  const [userToNuke, setUserToNuke] = useState<{ userId: string; userName: string } | null>(null);

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

  // ---------------------------------------------------------------------------
  // CSV Export Functions
  // ---------------------------------------------------------------------------
  const exportSessionsToCSV = () => {
    if (sessions.length === 0) return;
    const headers = [
      'Session ID',
      'User Name',
      'User Email',
      'Role',
      'Institution ID',
      'IP Address',
      'Device Type',
      'OS',
      'Browser',
      'City',
      'Country',
      'Signed In At',
      'Last Active Heartbeat',
    ];
    const rows = sessions.map((s) => [
      `"${s.id}"`,
      `"${s.userName.replace(/"/g, '""')}"`,
      `"${s.userEmail}"`,
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Auth & Device Tracking Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
            {totalActiveThreats > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <AlertTriangle size={13} className="animate-bounce" />
                {totalActiveThreats} Threat{totalActiveThreats === 1 ? '' : 's'} Active
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            Real-time platform session telemetry, geo-velocity threat radar, and forensic authentication auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => pruneExpired()}
            disabled={isPruning}
            title="Prune dead expired sessions older than 7 days"
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
          >
            <Sparkles size={14} className={isPruning ? 'animate-spin' : 'text-amber-400'} />
            Prune Dead Sessions
          </button>
          <button
            onClick={activeTab === 'sessions' ? exportSessionsToCSV : exportHistoryToCSV}
            title="Download CSV report"
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={handleRefreshAll}
            title="Refresh telemetry"
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw
              size={16}
              className={isFetchingSessions || isFetchingHistory ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Live Active Devices',
            value: overview?.totalActiveSessions ?? 0,
            icon: Radio,
            color: 'from-blue-600 to-indigo-600',
            subtitle: 'Tokens currently valid',
          },
          {
            title: 'Unique Users Online',
            value: overview?.uniqueActiveUsers ?? 0,
            icon: Users,
            color: 'from-emerald-500 to-teal-500',
            subtitle: 'Active accounts',
          },
          {
            title: '24h Successful Logins',
            value: overview?.loginsLast24h ?? 0,
            icon: CheckCircle2,
            color: 'from-purple-500 to-indigo-500',
            subtitle: 'Legitimate authentications',
          },
          {
            title: 'Security Threat Radar',
            value: totalActiveThreats,
            icon: totalActiveThreats > 0 ? AlertTriangle : Zap,
            color: totalActiveThreats > 0 ? 'from-red-600 to-amber-600' : 'from-gray-600 to-gray-700',
            subtitle:
              totalActiveThreats > 0
                ? `${threats?.impossibleTravelIncidents.length || 0} impossible travel, ${threats?.bruteForceAttacks.length || 0} brute force`
                : 'No active threats detected',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-white/5 p-6 group hover:border-white/10 transition-all"
          >
            <div
              className={`absolute top-0 right-0 p-4 bg-gradient-to-br ${stat.color} rounded-bl-3xl opacity-10 group-hover:opacity-20 transition-opacity`}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  {stat.title}
                </p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {isLoadingOverview || isLoadingThreats ? '...' : stat.value}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="text-white" size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabbed Command Center */}
      <div className="rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-white/10 px-6 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-4 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Radio size={16} /> Live Active Sessions ({sessionsTotal})
          </button>
          <button
            onClick={() => setActiveTab('threats')}
            className={`py-4 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'threats'
                ? 'border-red-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldAlert size={16} className={totalActiveThreats > 0 ? 'text-red-400' : ''} />
            Threat Radar ({totalActiveThreats})
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-4 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'locations'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass size={16} /> Geo Explorer ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History size={16} /> Global Audit Logs ({historyTotal})
          </button>
        </div>

        {/* Tab 1: Live Sessions Table */}
        {activeTab === 'sessions' && (
          <div>
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search user, email, IP address, city..."
                  value={sessionSearch}
                  onChange={(e) => {
                    setSessionSearch(e.target.value);
                    setSessionPage(1);
                  }}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={deviceFilter}
                  onChange={(e) => {
                    setDeviceFilter(e.target.value);
                    setSessionPage(1);
                  }}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="">All Device Types</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/30 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">User & Institution</th>
                    <th className="px-6 py-4">Hardware & Browser</th>
                    <th className="px-6 py-4">IP & Location</th>
                    <th className="px-6 py-4">Session Age / Heartbeat</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingSessions ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm">Fetching live sessions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                        <Radio size={40} className="mx-auto mb-2 opacity-30 text-indigo-400" />
                        <p className="text-base text-gray-300 font-semibold">No active sessions matching criteria</p>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {s.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-100 flex items-center gap-2">
                                <span>{s.userName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                                  {s.userRole}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">{s.userEmail}</div>
                              {s.institutionId && (
                                <div className="text-[11px] text-indigo-400 font-mono mt-0.5">
                                  {s.institutionName ? `${s.institutionName} (${s.institutionId})` : s.institutionId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-white/5 text-indigo-400 border border-white/5">
                              {s.deviceType === 'mobile' ? (
                                <Smartphone size={16} />
                              ) : (
                                <Laptop size={16} />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-200">
                                {s.browser || 'Web Browser'}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                <span>{s.os || 'Unknown OS'}</span>
                                {s.cpuArchitecture && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[11px] font-mono text-gray-400">{s.cpuArchitecture}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs text-gray-300 flex items-center gap-1.5">
                              <Globe size={13} className="text-gray-500" />
                              {s.ipAddress || '—'}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1.5">
                              <MapPin size={13} className="text-gray-500" />
                              {[s.city, s.country].filter(Boolean).join(', ') || 'Cloudflare Edge'}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active {new Date(s.updatedAt).toLocaleTimeString()}
                            </div>
                            <div className="text-gray-400 flex items-center gap-1">
                              <Clock size={12} className="text-gray-500" />
                              Signed in {new Date(s.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSessionToRevoke(s)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                              title="Immediately kill this device session"
                            >
                              <Trash2 size={13} /> Kill Session
                            </button>
                            <button
                              onClick={() => setUserToNuke({ userId: s.userId, userName: s.userName })}
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
                              title="Kill all devices for this user"
                            >
                              Nuke All
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sessionsTotal > 0 && (
              <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-400">
                  Showing <span className="text-white font-medium">{(sessionPage - 1) * 15 + 1}</span> to{' '}
                  <span className="text-white font-medium">{Math.min(sessionPage * 15, sessionsTotal)}</span> of{' '}
                  <span className="text-white font-medium">{sessionsTotal}</span> active devices (Page {sessionPage} of{' '}
                  {sessionsTotalPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                    disabled={sessionPage <= 1}
                    className="px-3.5 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-lg transition-colors text-gray-300"
                  >
                    Previous
                  </button>
                  <div className="px-2 text-xs font-mono text-gray-400">
                    {sessionPage} / {sessionsTotalPages}
                  </div>
                  <button
                    onClick={() => setSessionPage((p) => Math.min(sessionsTotalPages, p + 1))}
                    disabled={sessionPage >= sessionsTotalPages}
                    className="px-3.5 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-lg transition-colors text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Security Threat Radar & Anomalies */}
        {activeTab === 'threats' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="text-red-400" size={20} /> Geo-Velocity & Threat Detection Radar
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automated detection of Impossible Travel (physically impossible speed between logins) and Brute-Force attack bursts.
                </p>
              </div>
            </div>

            {/* Impossible Travel Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Plane size={15} className="text-amber-400" /> Impossible Travel Incidents ({threats?.impossibleTravelIncidents.length || 0})
              </h4>

              {isLoadingThreats ? (
                <p className="text-xs text-gray-500">Scanning geographical logs...</p>
              ) : (threats?.impossibleTravelIncidents.length || 0) === 0 ? (
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center text-gray-500">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                  <p className="text-sm font-medium text-gray-300">No Impossible Travel Anomalies Detected</p>
                  <p className="text-xs text-gray-500 mt-0.5">All recent sign-ins fall within expected physical travel velocities.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {threats?.impossibleTravelIncidents.map((inc, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            {inc.severity}
                          </span>
                          <span className="font-semibold text-white text-sm">{inc.userName}</span>
                          <span className="text-xs text-gray-400">({inc.userEmail})</span>
                        </div>
                        <p className="text-xs text-red-300/90 font-medium">{inc.reason}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1 font-mono">
                          <span>Origin: {inc.originLocation} ({inc.originIp || 'IP Hidden'})</span>
                          <span>➔</span>
                          <span>Destination: {inc.destinationLocation} ({inc.destinationIp || 'IP Hidden'})</span>
                          <span>•</span>
                          <span>Interval: {inc.timeDeltaMinutes}m</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setUserToNuke({ userId: inc.userId, userName: inc.userName })}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-colors shrink-0"
                      >
                        Nuke All Devices
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brute Force Attacks Section */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Crosshair size={15} className="text-red-400" /> Brute-Force Password Bursts ({threats?.bruteForceAttacks.length || 0})
              </h4>

              {(threats?.bruteForceAttacks.length || 0) === 0 ? (
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center text-gray-500">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                  <p className="text-sm font-medium text-gray-300">No Brute-Force Attacks Detected</p>
                  <p className="text-xs text-gray-500 mt-0.5">No IP addresses exceeding 3 consecutive failed login attempts in the past 2 hours.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {threats?.bruteForceAttacks.map((bf, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-amber-300">{bf.ipAddress}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">
                          {bf.failedAttempts} failed attempts
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <MapPin size={13} /> {bf.location}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center justify-between border-t border-white/5 pt-1.5">
                        <span>Targeted Accounts: {bf.targetedAccountsCount}</span>
                        <span>Last attempt: {new Date(bf.lastAttemptAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Edge Geographic Clusters & Live Coordinates */}
        {activeTab === 'locations' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="text-emerald-400" size={20} /> Edge Geographic Distribution & Telemetry
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time geographic clusters aggregated from Cloudflare Edge edge nodes and live device coordinates.
              </p>
            </div>

            {isLoadingLocations ? (
              <p className="text-xs text-gray-500">Mapping geographic clusters...</p>
            ) : locations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <MapPin size={40} className="mx-auto mb-2 opacity-30 text-emerald-400" />
                <p className="text-sm font-medium text-gray-300">No active geographic locations</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {loc.city !== 'Unknown' ? loc.city : loc.region}
                          </h4>
                          <span className="text-xs text-gray-400">{loc.country}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                        {loc.activeSessionsCount} active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-2 border-t border-white/5 font-mono">
                      <div>
                        <span className="text-gray-500">Lat:</span> {loc.latitude.toFixed(4)}
                      </div>
                      <div>
                        <span className="text-gray-500">Lon:</span> {loc.longitude.toFixed(4)}
                      </div>
                      <div className="col-span-2 text-indigo-400">
                        {loc.uniqueUsersCount} unique {loc.uniqueUsersCount === 1 ? 'user' : 'users'} connected
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Global Security & Auth Audit Log */}
        {activeTab === 'history' && (
          <div>
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search user, email, IP, location, reason..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="">All Results</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="FAILED">Failed Logins Only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/30 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Status & Reason</th>
                    <th className="px-6 py-4">Account / Target</th>
                    <th className="px-6 py-4">Client Hardware & Browser</th>
                    <th className="px-6 py-4">IP & Location</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm">Loading security audit records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                        <History size={40} className="mx-auto mb-2 opacity-30 text-indigo-400" />
                        <p className="text-base text-gray-300 font-semibold">No login history records found</p>
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {h.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={14} /> Authentication Succeeded
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle size={14} /> Failed Login
                              </span>
                              {h.failureReason && (
                                <div className="text-[11px] font-mono text-red-300/80 ml-1">
                                  {h.failureReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {h.userName ? (
                            <div>
                              <div className="font-semibold text-gray-200">{h.userName}</div>
                              <div className="text-xs text-gray-400">{h.userEmail}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Unknown account attempt</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-300">
                            {[h.browser, h.os].filter(Boolean).join(' on ') || 'Generic Web Client'}
                          </div>
                          <div className="text-[11px] text-gray-500 capitalize">
                            Type: {h.deviceType || 'Desktop'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-gray-300">{h.ipAddress || '—'}</div>
                          <div className="text-xs text-gray-400">
                            {[h.city, h.country].filter(Boolean).join(', ') || 'Edge Network'}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {historyTotal > 0 && (
              <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-400">
                  Showing <span className="text-white font-medium">{(historyPage - 1) * 20 + 1}</span> to{' '}
                  <span className="text-white font-medium">{Math.min(historyPage * 20, historyTotal)}</span> of{' '}
                  <span className="text-white font-medium">{historyTotal}</span> audit events (Page {historyPage} of{' '}
                  {historyTotalPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                    className="px-3.5 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-lg transition-colors text-gray-300"
                  >
                    Previous
                  </button>
                  <div className="px-2 text-xs font-mono text-gray-400">
                    {historyPage} / {historyTotalPages}
                  </div>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="px-3.5 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-lg transition-colors text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Glassmorphic Session Revocation Confirmation Dialog */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="font-bold text-lg text-white">Revoke Device Session?</h3>
              </div>
              <button
                onClick={() => setSessionToRevoke(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">User:</span>
                <span className="text-white font-medium">{sessionToRevoke.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Device Hardware:</span>
                <span className="text-gray-200">
                  {sessionToRevoke.browser || 'Browser'} on {sessionToRevoke.os || 'OS'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">IP & Edge Origin:</span>
                <span className="text-gray-200 font-mono">
                  {sessionToRevoke.ipAddress || '—'}{' '}
                  {sessionToRevoke.city ? `(${sessionToRevoke.city})` : ''}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Terminating this session will immediately invalidate the bearer token and forcibly log out the user on this device.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSessionToRevoke(null)}
                className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  killSession(sessionToRevoke.id);
                  setSessionToRevoke(null);
                }}
                disabled={isKillingSession}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} /> Forcibly Kill Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic User Nuclear Revoke Confirmation Dialog */}
      {userToNuke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="font-bold text-lg text-white">Nuke All User Sessions?</h3>
              </div>
              <button
                onClick={() => setUserToNuke(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Are you sure you want to terminate <strong className="text-white">every active device session</strong> for user <span className="font-semibold text-indigo-400 font-mono">"{userToNuke.userName}"</span>?
            </p>
            <p className="text-xs text-gray-400">
              The user will be immediately evicted from all desktop, tablet, and mobile clients simultaneously.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToNuke(null)}
                className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  killAllUserSessions(userToNuke.userId);
                  setUserToNuke(null);
                }}
                disabled={isKillingAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} /> Nuke All Devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
