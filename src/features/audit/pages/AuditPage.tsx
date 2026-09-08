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
  Filter,
  Copy,
  Check,
  Clock,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuditLogs, useAuditStats } from '../api/auditApi';
import type { AuditLog, AuditEntityType } from '../api/auditApi';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';
import { AuditCleanupModal } from '../components/AuditCleanupModal';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';

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
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

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
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* Top Header */}
      <PageHeader
        title="System Audit Trail & Forensics"
        subtitle="Immutable compliance record of administrative operations, security mutations, and tenant activities"
        icon={<ShieldCheck size={20} />}
        actions={
          <>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCleanupOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs min-h-[38px]"
              >
                <Trash2 size={14} />
                <span>Prune Logs</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-colors min-h-[38px]"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#ff8a5c]' : ''} />
              <span>Refresh Stream</span>
            </button>
          </>
        }
      />

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
      <FilterToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search action, actor, entity ID, IP... (Press / to focus)"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeChips={[
          ...(selectedEntityType !== 'ALL'
            ? [
                {
                  id: 'entityType',
                  label: 'Entity',
                  value: selectedEntityType,
                  onRemove: () => {
                    setSelectedEntityType('ALL');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedAction !== 'ALL'
            ? [
                {
                  id: 'action',
                  label: 'Action',
                  value: selectedAction,
                  onRemove: () => {
                    setSelectedAction('ALL');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(selectedInstitutionId !== 'ALL'
            ? [
                {
                  id: 'institution',
                  label: 'Institution',
                  value:
                    institutions.find((i) => i.id === selectedInstitutionId)?.name ||
                    selectedInstitutionId,
                  onRemove: () => {
                    setSelectedInstitutionId('ALL');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(startDate
            ? [
                {
                  id: 'startDate',
                  label: 'From',
                  value: startDate,
                  onRemove: () => {
                    setStartDate('');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(endDate
            ? [
                {
                  id: 'endDate',
                  label: 'To',
                  value: endDate,
                  onRemove: () => {
                    setEndDate('');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        hasActiveFilters={Boolean(
          searchTerm ||
            selectedEntityType !== 'ALL' ||
            selectedAction !== 'ALL' ||
            selectedInstitutionId !== 'ALL' ||
            startDate ||
            endDate
        )}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedEntityType('ALL');
          setSelectedAction('ALL');
          setSelectedInstitutionId('ALL');
          setStartDate('');
          setEndDate('');
          setPage(1);
        }}
        totalResults={meta.total}
        totalLabel="Audit events"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className="hidden sm:inline font-medium">Poll:</span>
              <FilterSelect
                value={refreshInterval === false ? 'off' : refreshInterval.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setRefreshInterval(val === 'off' ? false : parseInt(val, 10));
                }}
                className="text-xs"
                title="Telemetry auto-polling frequency"
              >
                <option value="off">Manual</option>
                <option value="10000">10s Auto</option>
                <option value="15000">15s Auto</option>
                <option value="30000">30s Auto</option>
              </FilterSelect>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="h-[38px] px-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 shrink-0 shadow-2xs"
              title="Refresh audit log"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#ff8a5c]' : ''} />
            </button>
          </div>
        }
        filterElements={
          <>
            {/* Entity Type Filter */}
            <FilterSelect
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(1);
              }}
              title="Filter by Entity Type"
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
            </FilterSelect>

            {/* Action Filter */}
            <FilterSelect
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="max-w-[200px] truncate"
              title="Filter by Action Type"
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
            </FilterSelect>

            {/* Institution Filter (Super Admin) */}
            {isSuperAdmin && (
              <FilterSelect
                icon={<Building2 size={13} />}
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setPage(1);
                }}
                className="max-w-[200px] truncate"
                title="Filter by Institution"
              >
                <option value="ALL">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </FilterSelect>
            )}

            {/* Date Pickers */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                title="Start Date"
                className="h-[38px] text-xs px-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#ff8a5c] w-full sm:w-auto shadow-2xs"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                title="End Date"
                className="h-[38px] text-xs px-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#ff8a5c] w-full sm:w-auto shadow-2xs"
              />
            </div>
          </>
        }
      />

      {/* Main Audit Records Data View */}
      <ResponsiveDataView
        items={logs}
        isLoading={isLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        keyExtractor={(log) => log.id}
        cardGridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5"
        emptyState={
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
        }
        renderCard={(log) => (
          <div
            key={log.id}
            onClick={() => setInspectingLog(log)}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>{getActionBadge(log.action)}</div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock size={11} />
                <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[11px]">Entity</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-800 text-[11px]">{log.entityType}:</span>
                  <span className="font-mono text-gray-600 text-[11px] max-w-[120px] truncate">{log.entityId}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(`ent_${log.id}`, log.entityId, e);
                    }}
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
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[11px]">Actor</span>
                <span className="font-semibold text-gray-800 truncate max-w-[140px]">
                  {log.actor?.name || log.actorId || 'SYSTEM'}
                </span>
              </div>

              {log.institution && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[11px]">Tenant</span>
                  <span className="text-blue-600 font-medium truncate max-w-[140px] flex items-center gap-1">
                    <Building2 size={11} />
                    {log.institution.name}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-mono text-[10px] text-gray-400">{log.ipAddress || 'Internal IP'}</span>
              <span className="text-[#ff8a5c] font-bold inline-flex items-center gap-1">
                <Eye size={12} /> Inspect
              </span>
            </div>
          </div>
        )}
        renderTable={() => (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
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
        )}
      />

      {/* Standardized Pagination Bar */}
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        itemName="audit records"
      />

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

