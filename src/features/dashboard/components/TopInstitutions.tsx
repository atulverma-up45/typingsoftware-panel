import React from 'react';
import { Trophy, Building } from 'lucide-react';
import { useDashboardTopInstitutions } from '../api/dashboardApi';

interface TopInstitutionsProps {
  enabled?: boolean;
}

const TopInstitutions: React.FC<TopInstitutionsProps> = ({ enabled = true }) => {
  const { data: institutions = [], isLoading } = useDashboardTopInstitutions(5, enabled);

  return (
    <div className="bg-[#ecfeff] rounded-[20px] shadow-sm border border-[#cffafe] p-6 flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#06B6D4] shadow-2xs border border-[#cffafe]">
          <Trophy size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Top Institutions</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <h4 className="text-[11px] font-bold text-gray-400 tracking-wider mb-4">
          BY TOTAL LICENSES
        </h4>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 flex items-center justify-between border border-[#cffafe] animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="w-32 h-4 bg-gray-200 rounded" />
                </div>
                <div className="w-16 h-5 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#06B6D4] flex items-center justify-center mb-3 shadow-2xs">
              <Building size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">No Institutions Enrolled</p>
            <p className="text-xs text-gray-400 mt-1">Institutions will rank here by license count.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {institutions.map((inst, index) => (
              <div
                key={inst.id}
                className="bg-white rounded-xl p-4 flex items-center justify-between border border-[#cffafe] shadow-2xs hover:border-[#06B6D4]/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                      index === 0
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : index === 1
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : index === 2
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-cyan-50 text-[#06B6D4] border border-cyan-100'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <p
                    className="font-semibold text-sm text-gray-800 truncate"
                    title={inst.name}
                  >
                    {inst.name}
                  </p>
                </div>
                <div className="bg-[#cffafe] text-[#06B6D4] text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2">
                  {inst.count} {inst.count === 1 ? 'license' : 'licenses'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopInstitutions;
