import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useDashboardPendingSyncs } from '../api/dashboardApi';

const PendingSyncs: React.FC = () => {
  const { data: syncs = [], isLoading } = useDashboardPendingSyncs(7, 10);

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Pending Syncs</h3>
        {syncs.length > 0 && (
          <span className="bg-[#fcdabf] text-[#d65e2b] text-[11px] font-bold px-2.5 py-1 rounded-full">
            {syncs.length} stale
          </span>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
                <div className="space-y-2">
                  <div className="w-28 h-3.5 bg-gray-200 rounded" />
                  <div className="w-20 h-2.5 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-16 h-5 bg-gray-200 rounded-full" />
            </div>
          ))
        ) : syncs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">All Workstations Synchronized</p>
            <p className="text-xs text-gray-400 mt-1">
              No devices have overdue synchronization states.
            </p>
          </div>
        ) : (
          syncs.map((sync) => (
            <div
              key={sync.id}
              className="bg-[#fff6f2] rounded-xl p-4 flex items-center justify-between border border-[#fdece5] hover:border-[#fc9b7f]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#f77f52] shrink-0 border border-[#fdece5] shadow-2xs">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{sync.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Last seen: {sync.date}</p>
                </div>
              </div>
              <div className="bg-[#fcdabf] text-[#d65e2b] text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2">
                {sync.days} days ago
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PendingSyncs;
