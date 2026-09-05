import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  Calendar,
  Search,
  RefreshCw,
  Trash2,
  Building2,
  User,
  Globe,
  Tag,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Check,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuditLogs, useAuditStats } from '../api/auditApi';
import type { AuditLog, AuditEntityType } from '../api/auditApi';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';
import { AuditCleanupModal } from '../components/AuditCleanupModal';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export const AuditPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'action' | 'entityType'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [refreshInterval, setRefreshInterval] = useState<number | false>(15000); // 15s default

  // Modals
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: institutionsData } = useInstitutions({ limit: 100, status: 'ACTIVE' });
  const institutions = institutionsData?.data || [];

  const queryParams = {
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    entityType: selectedEntityType !== 'ALL' ? selectedEntityType : undefined,
    action: selectedAction !== 'ALL' ? selectedAction : undefined,
    institutionId:
      isSuperAdmin && selectedInstitutionId !== 'ALL' ? selectedInstitutionId : undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    sortBy,
    sortOrder,
  };

  const {
    data: logsData,
    isLoading,
    refetch,
  } = useAuditLogs(queryParams, refreshInterval);
  const { data: statsData } = useAuditStats(refreshInterval);

  const logs = logsData?.data || [];
  const meta = logsData?.meta || { page: 1, limit: 15, total: 0, totalPages: 1 };
  const stats = statsData || {
    totalAuditLogs: 0,
    logsLast24Hours: 0,
    logsLast7Days: 0,
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';

    if (act.includes('DELETE') || act.includes('REVOKE') || act.includes('PURGE') || act.includes('SUSPEND')) {
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (act.includes('CREATE') || act.includes('ACTIVATE') || act.includes('PUBLISH') || act.includes('RESTORE') || act.includes('RENEW')) {
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('STATUS')) {
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-[#ff8a5c]" size={28} />
            System Audit Trail & Forensics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable compliance record of administrative operations, security mutations, and tenant activities
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsCleanupOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
            >
              <Trash2 size={15} />
              Prune Compliance History
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh Stream
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Audit Logs</span>
            <ShieldCheck size={18} className="text-[#ff8a5c]" />
          </div>
          <div className="text-3xl font-black text-gray-900">
            {stats.totalAuditLogs.toLocaleString()}
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">Recorded compliance events</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Past 24 Hours</span>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {stats.logsLast24Hours.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600/80 mt-0.5 block">Today's mutation velocity</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Past 7 Days</span>
            <Calendar size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-600">
            {stats.logsLast7Days.toLocaleString()}
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">Weekly operational volume</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Log Governance</span>
            <Tag size={18} className="text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-700 flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Append-Only
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">Zero mutable modifications</span>
        </div>
      </div>

      {/* Multifaceted Filter Toolbar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search action, actor, entity ID, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
              />
            </div>

            {/* Entity Type Filter */}
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c]"
            >
              <option value="ALL">All Entity Types</option>
              <option value="USER">USER</option>
              <option value="INSTITUTION">INSTITUTION</option>
              <option value="LICENSE">LICENSE</option>
              <option value="ACTIVATION">ACTIVATION</option>
              <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              <option value="PLAN">PLAN</option>
              <option value="MODULE">MODULE</option>
              <option value="CONTENT">CONTENT</option>
              <option value="RELEASE">RELEASE</option>
              <option value="SYNC">SYNC</option>
              <option value="AUDIT">AUDIT</option>
            </select>

            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c] max-w-[170px]"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_UPDATED">USER_UPDATED</option>
              <option value="INSTITUTION_CREATED">INSTITUTION_CREATED</option>
              <option value="LICENSE_CREATED">LICENSE_CREATED</option>
              <option value="LICENSE_REVOKED">LICENSE_REVOKED</option>
              <option value="SUBSCRIPTION_CREATED">SUBSCRIPTION_CREATED</option>
              <option value="SUBSCRIPTION_RENEWED">SUBSCRIPTION_RENEWED</option>
              <option value="RELEASE_CREATED">RELEASE_CREATED</option>
              <option value="RELEASE_PUBLISHED">RELEASE_PUBLISHED</option>
              <option value="SYNC_HISTORY_CLEANED">SYNC_HISTORY_CLEANED</option>
              <option value="AUDIT_HISTORY_CLEANED">AUDIT_HISTORY_CLEANED</option>
            </select>

            {/* Institution Filter (Super Admin) */}
            {isSuperAdmin && (
              <select
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#ff8a5c] max-w-[170px]"
              >
                <option value="ALL">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Polling interval */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span>Auto-poll:</span>
              <select
                value={refreshInterval === false ? 'off' : refreshInterval.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setRefreshInterval(val === 'off' ? false : parseInt(val, 10));
                }}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-gray-50"
              >
                <option value="off">Manual</option>
                <option value="10000">10s</option>
                <option value="15000">15s</option>
                <option value="30000">30s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar size={13} className="text-gray-400" />
            <span className="font-semibold text-gray-700">Filter by Date:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50"
            />
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="text-xs text-[#ff8a5c] font-semibold hover:underline"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center animate-pulse">
          <div className="h-6 bg-gray-200 rounded-md w-1/4 mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded-md w-1/2 mx-auto" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Audit Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {searchTerm || selectedEntityType !== 'ALL' || selectedAction !== 'ALL' || startDate || endDate
              ? 'No audit logs match your applied filter conditions.'
              : 'Administrative mutations and security events will stream here automatically.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Tenant Scope</th>
                  <th className="py-3 px-4">Origin IP</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Action */}
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>

                    {/* Target Entity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800 text-[11px]">
                          {log.entityType}:
                        </span>
                        <span className="font-mono text-gray-500 text-[11px] truncate max-w-[130px]">
                          {log.entityId}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(`ent_${log.id}`, log.entityId, e)}
                          className="text-gray-400 hover:text-[#ff8a5c] shrink-0"
                          title="Copy Entity ID"
                        >
                          {copiedId === `ent_${log.id}` ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <User size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[130px] font-medium">
                          {log.actor?.name || log.actorId || 'SYSTEM'}
                        </span>
                      </div>
                    </td>

                    {/* Tenant Scope */}
                    <td className="py-3 px-4 text-gray-600">
                      {log.institution ? (
                        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                          <Building2 size={13} className="text-blue-500 shrink-0" />
                          <span className="truncate font-medium">{log.institution.name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Global Platform</span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      <div className="flex items-center gap-1">
                        <Globe size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {log.ipAddress || 'Internal'}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-gray-500">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock size={12} className="text-gray-400 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="View forensic details"
                      >
                        <Eye size={13} />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(page * limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{meta.total}</span> audit records
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2 text-gray-700">
              Page {page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuditLogDetailModal
        isOpen={!!inspectingLog}
        onClose={() => setInspectingLog(null)}
        auditLog={inspectingLog}
      />

      <AuditCleanupModal
        isOpen={isCleanupOpen}
        onClose={() => setIsCleanupOpen(false)}
      />
    </div>
  );
};
export default AuditPage;

