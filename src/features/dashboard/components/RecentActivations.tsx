import React, { useEffect, useState } from 'react';
import api from '@/lib/api/client';

const RecentActivations: React.FC = () => {
  const [activations, setActivations] = useState<Array<{ id: string; initials: string; name: string; desc: string; date: string; type: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/v1/dashboard/recent-activations');
        if (response.data?.success && response.data?.data) {
          setActivations(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch recent activations", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Pending Activations</h3>
        <div className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-2.5 py-1 rounded-full">
          {activations.length} pending
        </div>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activations.map((activation) => (
          <div key={activation.id} className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0eb] text-[#f77f52] shrink-0 font-medium text-sm border border-[#fdece5]">
                {activation.initials}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800 leading-tight">{activation.name}</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[150px] leading-snug">{activation.desc}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{activation.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-[#fcdabf] text-[#d65e2b] text-[11px] font-bold px-2 py-0.5 rounded-md">
                pending
              </div>
              <span className="font-bold text-sm text-[#f77f52]">{activation.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivations;
