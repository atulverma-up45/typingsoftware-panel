import React from 'react';
import { History, Clock } from 'lucide-react';
import type { GlobalLoginHistoryItem } from '../api/authTrackingApi';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export interface LoginHistoryTabProps {
  history: GlobalLoginHistoryItem[];
  historyTotal: number;
  historyTotalPages: number;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  historyViewMode: 'TABLE' | 'CARDS';
  setHistoryViewMode: (mode: 'TABLE' | 'CARDS') => void;
  isLoadingHistory: boolean;
}

export const LoginHistoryTab: React.FC<LoginHistoryTabProps> = ({
  history,
  historyTotal,
  historyTotalPages,
  historyPage,
  setHistoryPage,
  historySearch,
  setHistorySearch,
  statusFilter,
  setStatusFilter,
  historyViewMode,
  setHistoryViewMode,
  isLoadingHistory,
}) => {
  return (
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
                    <span className="font-bold text-gray-900 text-xs truncate block">
                      {h.userName || h.userEmail || 'Anonymous'}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate block">
                      {h.userEmail}
                    </span>
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
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Device
                    </span>
                    <span className="text-[11px] text-gray-700 font-medium block truncate">
                      {[h.browser, h.os].filter(Boolean).join(' / ') || 'Web Client'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Location
                    </span>
                    <span className="text-[11px] text-gray-700 font-medium block truncate">
                      {[h.city, h.country].filter(Boolean).join(', ') || 'Edge Network'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="font-mono text-gray-500">{h.ipAddress || '—'}</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={11} />
                    <span>
                      {new Date(h.createdAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View for History */}
          <div
            className={
              historyViewMode === 'CARDS'
                ? 'hidden'
                : 'hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden'
            }
          >
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
                          <span className="font-mono text-gray-400 text-xs">
                            {h.userEmail || 'Anonymous'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-gray-800 font-medium">
                          {[h.browser, h.os].filter(Boolean).join(' on ') || 'Generic Web Client'}
                        </div>
                        <div className="text-[11px] text-gray-400 capitalize">
                          Type: {h.deviceType || 'Desktop'}
                        </div>
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
  );
};

