import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { useDashboardEvents } from '../api/dashboardApi';

const ActivityFeed: React.FC = () => {
  const { data: events = [], isLoading } = useDashboardEvents(10);

  return (
    <div className="bg-[#fff6f2] rounded-[20px] shadow-sm border border-[#fdece5] p-6 flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#f77f52] shadow-2xs border border-[#fdece5]">
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Activity Feed</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h4 className="text-[11px] font-bold text-gray-400 tracking-wider mb-4">RECENT ACTIVITY</h4>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-start gap-3 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-orange-200 mt-1 shrink-0" />
                <div className="flex-1 bg-white p-3 rounded-lg border border-[#fdece5] space-y-1.5">
                  <div className="w-3/4 h-3.5 bg-gray-200 rounded" />
                  <div className="w-1/3 h-2.5 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#f77f52] flex items-center justify-center mb-3 shadow-2xs">
              <ShieldCheck size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">No Security Events</p>
            <p className="text-xs text-gray-400 mt-1">Platform operations will stream here live.</p>
          </div>
        ) : (
          <div className="space-y-5 relative before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#f77f52]/30 before:to-transparent">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start justify-between">
                <div className="flex items-start gap-4 z-10 w-full">
                  <div
                    className="w-5 h-5 rounded-full mt-0.5 shrink-0 border-4 border-[#fff6f2]"
                    style={{ backgroundColor: event.color || '#f77f52' }}
                  />
                  <div className="flex-1 min-w-0 bg-white p-3 rounded-lg border border-[#fdece5] shadow-2xs hover:border-[#fc9b7f]/50 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 block truncate">
                      {event.title}
                    </span>
                    <span className="text-xs text-gray-500 font-medium mt-1 block">
                      {event.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
