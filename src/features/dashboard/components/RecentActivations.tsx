import React from 'react';
import { Laptop2, CheckCircle2 } from 'lucide-react';
import { useDashboardRecentActivations } from '../api/dashboardApi';

const RecentActivations: React.FC = () => {
  const { data: activations = [], isLoading } = useDashboardRecentActivations(10);

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Recent Activations</h3>
        {activations.length > 0 && (
          <div className="bg-[#e0f2fe] text-[#0ea5e9] text-[11px] font-bold px-2.5 py-1 rounded-full">
            {activations.length} recent
          </div>
        )}
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-2">
                  <div className="w-24 h-3.5 bg-gray-200 rounded" />
                  <div className="w-32 h-2.5 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-14 h-5 bg-gray-200 rounded" />
            </div>
          ))
        ) : activations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
              <Laptop2 size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">No Recent Activations</p>
            <p className="text-xs text-gray-400 mt-1">
              New workstation licenses will appear here once activated.
            </p>
          </div>
        ) : (
          activations.map((activation) => (
            <div key={activation.id} className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0eb] text-[#f77f52] shrink-0 font-bold text-xs border border-[#fdece5]">
                  {activation.initials || 'WK'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 leading-tight">
                    {activation.name}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-[150px] leading-snug">
                    {activation.desc}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{activation.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-[#dcfce7] text-[#16a34a] text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={11} /> active
                </div>
                <span className="font-bold text-xs text-[#f77f52] uppercase">
                  {activation.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivations;
