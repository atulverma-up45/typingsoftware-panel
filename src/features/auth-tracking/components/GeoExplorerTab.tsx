import React from 'react';
import { Compass, Globe } from 'lucide-react';
import type { LocationClusterItem } from '../api/authTrackingApi';

export interface GeoExplorerTabProps {
  locations: LocationClusterItem[];
  isLoadingLocations: boolean;
}

export const GeoExplorerTab: React.FC<GeoExplorerTabProps> = ({
  locations,
  isLoadingLocations,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Compass className="text-emerald-500" size={16} />
          <span>Edge Geographic Distribution & Telemetry</span>
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Live geographic clusters aggregated from Cloudflare Edge nodes and device coordinates.
        </p>
      </div>

      {isLoadingLocations ? (
        <div className="py-8 text-center text-xs text-gray-400">
          Loading location coordinates...
        </div>
      ) : locations.length === 0 ? (
        <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <Globe size={32} className="mx-auto mb-2 text-gray-400 opacity-60" />
          <p className="text-sm font-bold text-gray-800">No Location Clusters Found</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Locations will appear as workstations establish secure connections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {locations.map((loc, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-primary font-bold text-xs flex items-center justify-center border border-orange-100 shrink-0">
                    {loc.country ? loc.country.slice(0, 2).toUpperCase() : 'GL'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate">
                      {loc.city || 'Regional Hub'}
                    </h4>
                    <span className="text-[11px] text-gray-400 truncate block">
                      {loc.country}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Edge
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-200/50">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">
                    Sessions
                  </span>
                  <span className="font-bold text-gray-800">{loc.activeSessionsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">
                    Unique Users
                  </span>
                  <span className="font-bold text-gray-800">{loc.uniqueUsersCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

