import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Trash2,
} from 'lucide-react';
import { useAuditLogs, useAuditStats } from '../api/auditApi';
import type { AuditLog } from '../api/auditApi';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';
import { AuditCleanupModal } from '../components/AuditCleanupModal';
import { useInstitutions } from '@/features/institutions/api/institutionApi';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue, useOnDepChange } from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import ResponsiveDataView from '@/components/ui/ResponsiveDataView';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import { AuditStatsCards } from '../components/AuditStatsCards';
import { AuditTableView } from '../components/AuditTableView';
import { AuditLogCard } from '../components/AuditLogCard';

export const AuditPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'action' | 'entityType'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [refreshInterval] = useState<number | false>(15000); // 15s default
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Modals
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useOnDepChange(debouncedSearch, () => setPage(1));

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
          </>
        }
      />

      {/* KPI Overview Cards */}
      <AuditStatsCards stats={stats} />

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
            endDate ||
            sortBy !== 'createdAt' ||
            sortOrder !== 'desc'
        )}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedEntityType('ALL');
          setSelectedAction('ALL');
          setSelectedInstitutionId('ALL');
          setStartDate('');
          setEndDate('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        totalResults={meta.total}
        totalLabel="Records"
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
              <option value="LICENSE">LICENSE</option>
              <option value="DEVICE">DEVICE</option>
              <option value="INSTITUTION">INSTITUTION</option>
              <option value="CONTENT">CONTENT</option>
              <option value="PLAN">PLAN</option>
              <option value="RELEASE">RELEASE</option>
              <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              <option value="SECURITY">SECURITY</option>
              <option value="SYSTEM">SYSTEM</option>
            </FilterSelect>

            {/* Action Filter */}
            <FilterSelect
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              title="Filter by Mutation Action"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_CREATE">USER_CREATE</option>
              <option value="USER_UPDATE">USER_UPDATE</option>
              <option value="USER_DELETE">USER_DELETE</option>
              <option value="USER_SUSPEND">USER_SUSPEND</option>
              <option value="LICENSE_GENERATE">LICENSE_GENERATE</option>
              <option value="LICENSE_REVOKE">LICENSE_REVOKE</option>
              <option value="DEVICE_DEACTIVATE">DEVICE_DEACTIVATE</option>
              <option value="INSTITUTION_PROVISION">INSTITUTION_PROVISION</option>
              <option value="RELEASE_PUBLISH">RELEASE_PUBLISH</option>
            </FilterSelect>

            {/* Institution Filter (Super Admin only) */}
            {isSuperAdmin && (
              <FilterSelect
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setPage(1);
                }}
                title="Filter by Tenant Institution"
              >
                <option value="ALL">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </FilterSelect>
            )}

            {/* Date Range Selectors */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                title="Start Date"
                className="h-[38px] text-xs px-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-primary w-full sm:w-auto shadow-2xs"
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
                className="h-[38px] text-xs px-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-primary w-full sm:w-auto shadow-2xs"
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
          <AuditLogCard
            key={log.id}
            log={log}
            copiedId={copiedId}
            onCopy={handleCopy}
            onInspect={(l) => setInspectingLog(l)}
          />
        )}
        renderTable={() => (
          <AuditTableView
            logs={logs}
            copiedId={copiedId}
            onCopy={handleCopy}
            onInspect={(log) => setInspectingLog(log)}
          />
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
