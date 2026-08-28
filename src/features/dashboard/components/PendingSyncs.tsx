import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '@/lib/api/client';

const PendingSyncs: React.FC = () => {
  const [syncs, setSyncs] = useState<Array<{ id: string; title: string; date: string; days: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/v1/dashboard/pending-syncs');
        if (response.data?.success && response.data?.data) {
          setSyncs(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch pending syncs", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
      <h3 className="text-[16px] font-bold text-gray-800 mb-6 tracking-tight">Pending Syncs</h3>
      
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {syncs.map((sync) => (
          <div key={sync.id} className="bg-[#fff6f2] rounded-xl p-4 flex items-center justify-between border border-[#fdece5]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#f77f52] shrink-0 border border-[#fdece5]">
                <RefreshCw size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{sync.title}</p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>{sync.date}</span>
                </div>
              </div>
            </div>
            <div className="bg-[#fcdabf] text-[#d65e2b] text-[11px] font-bold px-2.5 py-1 rounded-full">
              In {sync.days} days
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingSyncs;
