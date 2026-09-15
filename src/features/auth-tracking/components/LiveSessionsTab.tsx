import React from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  Radio,
  Trash2,
  Clock,
  MapPin,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import type { LiveSessionItem } from '../api/authTrackingApi';
import FilterToolbar, { FilterSelect } from '@/components/ui/FilterToolbar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export interface LiveSessionsTabProps {
  sessions: LiveSessionItem[];
  sessionsTotal: number;
  sessionsTotalPages: number;
  sessionPage: number;
  setSessionPage: (page: number) => void;
  sessionSearch: string;
  setSessionSearch: (search: string) => void;
  deviceFilter: string;
  setDeviceFilter: (filter: string) => void;
  sessionViewMode: 'TABLE' | 'CARDS';
  setSessionViewMode: (mode: 'TABLE' | 'CARDS') => void;
  isLoadingSessions: boolean;
  copiedId: string | null;
  onCopy: (id: string, text: string | null | undefined, e: React.MouseEvent) => void;
  onRevokeSession: (session: LiveSessionItem) => void;
  onNukeUser: (user: { userId: string; userName: string }) => void;
}

export const LiveSessionsTab: React.FC<LiveSessionsTabProps> = ({
  sessions,
  sessionsTotal,
  sessionsTotalPages,
  sessionPage,
  setSessionPage,
  sessionSearch,
  setSessionSearch,
  deviceFilter,
  setDeviceFilter,
  sessionViewMode,
  setSessionViewMode,
  isLoadingSessions,
  copiedId,
  onCopy,
  onRevokeSession,
  onNukeUser,
}) => {
  return (
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
                            onClick={(e) => onCopy(`ip_${s.id}`, s.ipAddress, e)}
                            className="text-gray-400 hover:text-primary cursor-pointer"
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
                      onClick={() => onRevokeSession(s)}
                      className="h-[34px] px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Terminate this device session"
                    >
                      <Trash2 size={12} /> Kill
                    </button>
                    <button
                      type="button"
                      onClick={() => onNukeUser({ userId: s.userId, userName: s.userName })}
                      className="h-[34px] px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
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
                                onClick={(e) => onCopy(`ip_d_${s.id}`, s.ipAddress, e)}
                                className="text-gray-400 hover:text-primary cursor-pointer"
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
                            onClick={() => onRevokeSession(s)}
                            className="h-[34px] px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Terminate this device session"
                          >
                            <Trash2 size={12} /> Kill Session
                          </button>
                          <button
                            type="button"
                            onClick={() => onNukeUser({ userId: s.userId, userName: s.userName })}
                            className="h-[34px] px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs transition-colors cursor-pointer"
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
  );
};

