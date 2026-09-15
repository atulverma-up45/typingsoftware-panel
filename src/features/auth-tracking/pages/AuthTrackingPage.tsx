import React, { useState } from 'react';
import {
  Radio,
  History,
  CheckCircle2,
  RefreshCw,
  Users,
  Download,
  ShieldAlert,
  Sparkles,
  Compass,
} from 'lucide-react';
import { exportCsv } from '@/lib/exportCsv';
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
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/Modal';
import { LiveSessionsTab } from '../components/LiveSessionsTab';
import { ThreatRadarTab } from '../components/ThreatRadarTab';
import { GeoExplorerTab } from '../components/GeoExplorerTab';
import { LoginHistoryTab } from '../components/LoginHistoryTab';

export const AuthTrackingPage: React.FC = () => {
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
    exportCsv(
      `live-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Session ID', accessor: 'id' },
        { header: 'User ID', accessor: 'userId' },
        { header: 'User Name', accessor: (s) => s.userName || '' },
        { header: 'User Email', accessor: (s) => s.userEmail || '' },
        { header: 'User Role', accessor: 'userRole' },
        { header: 'Institution ID', accessor: (s) => s.institutionId || '' },
        { header: 'IP Address', accessor: (s) => s.ipAddress || '' },
        { header: 'Device Type', accessor: (s) => s.deviceType || '' },
        { header: 'OS', accessor: (s) => s.os || '' },
        { header: 'Browser', accessor: (s) => s.browser || '' },
        { header: 'City', accessor: (s) => s.city || '' },
        { header: 'Country', accessor: (s) => s.country || '' },
        { header: 'Created At', accessor: 'createdAt' },
        { header: 'Last Active', accessor: 'updatedAt' },
      ],
      sessions,
    );
  };

  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    exportCsv(
      `auth-audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Record ID', accessor: 'id' },
        { header: 'Status', accessor: 'status' },
        { header: 'Failure Reason', accessor: (h) => h.failureReason || '' },
        { header: 'User Name', accessor: (h) => h.userName || '' },
        { header: 'User Email', accessor: (h) => h.userEmail || '' },
        { header: 'IP Address', accessor: (h) => h.ipAddress || '' },
        { header: 'Device Type', accessor: (h) => h.deviceType || '' },
        { header: 'OS', accessor: (h) => h.os || '' },
        { header: 'Browser', accessor: (h) => h.browser || '' },
        { header: 'City', accessor: (h) => h.city || '' },
        { header: 'Country', accessor: (h) => h.country || '' },
        { header: 'Timestamp', accessor: 'createdAt' },
      ],
      history,
    );
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
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs h-[38px] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={14} className={isPruning ? 'animate-spin text-primary' : 'text-amber-500'} />
              <span>Prune Dead Sessions</span>
            </button>

            <button
              type="button"
              onClick={activeTab === 'sessions' ? exportSessionsToCSV : exportHistoryToCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs h-[38px] cursor-pointer"
              title="Export report to CSV"
            >
              <Download size={14} className="text-gray-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isFetchingSessions || isFetchingHistory}
              className="h-[38px] px-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
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
            {
              id: 'threats',
              label: 'Threat Radar',
              count: totalActiveThreats,
              icon: <ShieldAlert size={14} />,
              alert: totalActiveThreats > 0,
            },
            { id: 'locations', label: 'Geo Explorer', count: locations.length, icon: <Compass size={14} /> },
            { id: 'history', label: 'Global Audit Logs', count: historyTotal, icon: <History size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'sessions' | 'threats' | 'locations' | 'history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
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

      {/* Tab Contents */}
      {activeTab === 'sessions' && (
        <LiveSessionsTab
          sessions={sessions}
          sessionsTotal={sessionsTotal}
          sessionsTotalPages={sessionsTotalPages}
          sessionPage={sessionPage}
          setSessionPage={setSessionPage}
          sessionSearch={sessionSearch}
          setSessionSearch={setSessionSearch}
          deviceFilter={deviceFilter}
          setDeviceFilter={setDeviceFilter}
          sessionViewMode={sessionViewMode}
          setSessionViewMode={setSessionViewMode}
          isLoadingSessions={isLoadingSessions}
          copiedId={copiedId}
          onCopy={handleCopy}
          onRevokeSession={setSessionToRevoke}
          onNukeUser={setUserToNuke}
        />
      )}

      {activeTab === 'threats' && (
        <ThreatRadarTab
          threats={threats}
          isLoadingThreats={isLoadingThreats}
          onNukeUser={setUserToNuke}
        />
      )}

      {activeTab === 'locations' && (
        <GeoExplorerTab
          locations={locations}
          isLoadingLocations={isLoadingLocations}
        />
      )}

      {activeTab === 'history' && (
        <LoginHistoryTab
          history={history}
          historyTotal={historyTotal}
          historyTotalPages={historyTotalPages}
          historyPage={historyPage}
          setHistoryPage={setHistoryPage}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          historyViewMode={historyViewMode}
          setHistoryViewMode={setHistoryViewMode}
          isLoadingHistory={isLoadingHistory}
        />
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
};

export default AuthTrackingPage;
